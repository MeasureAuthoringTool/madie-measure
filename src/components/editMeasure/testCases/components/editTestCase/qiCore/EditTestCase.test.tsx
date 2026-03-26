import * as React from "react";
import { ChangeEvent } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import EditTestCase, {
  findEpisodeActualValue,
  isEmptyTestCaseJsonString,
} from "./EditTestCase";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosResponse } from "axios";
import axios from "../../../../../../api/axios-instance";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import {
  HapiOperationOutcome,
  Measure,
  MeasureErrorType,
  MeasureScoring,
  Model,
  Population,
  PopulationExpectedValue,
  PopulationType,
  TestCase,
  ValidationStatus,
} from "@madie/madie-models";
import TestCaseRoutes from "../../routes/qiCore/TestCaseRoutes";
import { PopulationEpisodeResult } from "../../../api/CalculationService";
import { simpleMeasureFixture } from "../../createTestCase/__mocks__/simpleMeasureFixture";
import { testCaseFixture } from "../../createTestCase/__mocks__/testCaseFixture";
import {
  buildMeasureBundle,
  getExampleValueSet,
} from "../../../util/CalculationTestHelpers";
import { ExecutionContextProvider } from "../../routes/qiCore/ExecutionContext";
import { multiGroupMeasureFixture } from "../../createTestCase/__mocks__/multiGroupMeasureFixture";
import { nonBoolTestCaseFixture } from "../../createTestCase/__mocks__/nonBoolTestCaseFixture";
import { TestCaseValidator } from "../../../validators/TestCaseValidator";
// @ts-ignore
import {
  checkUserCanEdit,
  useFeatureFlags,
  MeasureServiceApi,
} from "@madie/madie-util";
import { PopulationType as FqmPopulationType } from "fqm-execution/build/types/Enums";
import { ResourceIdentifier } from "../../../api/models/ResourceIdentifier";

//temporary solution (after jest updated to version 27) for error: thrown: "Exceeded timeout of 5000 ms for a test.
jest.setTimeout(60000);

jest.mock("../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockMeasureServiceApi: MeasureServiceApi = {
  updateMeasureTestCaseConfiguration: jest.fn(),
} as unknown as MeasureServiceApi;

// mock editor to reduce errors and warnings
const mockEditor = { resize: jest.fn() };
jest.mock(
  "../../editor/Editor",
  () =>
    ({ setEditor, value, onChange, readOnly }) => {
      const React = require("react");
      React.useEffect(() => {
        if (setEditor) {
          setEditor(mockEditor);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return (
        <input
          data-testid="test-case-json-editor"
          readOnly={readOnly}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            onChange(e.target.value);
          }}
        />
      );
    }
);

//value needs to come from Util(feature flag)
const testCaseAlertToast = false;

const serviceConfig: ServiceConfig = {
  qdmElmTranslationService: { baseUrl: "qdm-cql-to-elm.com" },
  fhirElmTranslationService: { baseUrl: "fhir-cql-to-elm.com" },
  excelExportService: {
    baseUrl: "excelexport.com",
  },
  measureService: {
    baseUrl: "measure.url",
  },
  fhirService: {
    baseUrl: "fhirservice.url",
  },
  terminologyService: {
    baseUrl: "something.com",
  },
};
const MEASURE_CREATEDBY = "testuser";
let mockApplyDefaults = false;
jest.mock("@madie/madie-util", () => {
  return {
    useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
    useDocumentTitle: jest.fn(),
    useFeatureFlags: jest.fn(() => {
      return {
        applyDefaults: mockApplyDefaults,
        qiCoreElementsTab: true,
      };
    }),
    measureStore: {
      updateMeasure: jest.fn((measure) => measure),
      state: null,
      initialState: null,
      subscribe: (set) => {
        set({} as Measure);
        return { unsubscribe: () => null };
      },
      unsubscribe: () => null,
    },
    useOktaTokens: jest.fn(() => ({
      getAccessToken: () => "test.jwt",
    })),
    checkUserCanEdit: jest.fn(() => {
      return true;
    }),
    routeHandlerStore: {
      subscribe: () => {
        return { unsubscribe: () => null };
      },
      updateRouteHandlerState: () => null,
      state: { canTravel: false, pendingPath: "" },
      initialState: { canTravel: false, pendingPath: "" },
    },
  };
});
const hapiOperationSuccessOutcome = {
  code: 200,
  message: null,
  successful: true,
  outcomeResponse: {
    resourceType: "OperationOutcome",
    text: undefined,
    issue: [
      {
        severity: "information",
        code: "informational",
        diagnostics: "No issues detected during validation",
        location: undefined,
      },
    ],
  },
};

const defaultMeasure = {
  id: "m1234",
  measureScoring: MeasureScoring.COHORT,
  createdBy: MEASURE_CREATEDBY,
  model: Model.QICORE,
  groups: [
    {
      groupId: "Group1_ID",
      displayId: "Group1_ID",
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          displayId: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Pop1",
        },
      ],
      stratifications: [
        {
          id: "id-2",
          displayId: "strat-id-1",
          description: "strat1 description",
          cqlDefinition: "cql definition",
          associations: [PopulationType.INITIAL_POPULATION],
        },
      ],
    },
  ],
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;
const measureBundle = buildMeasureBundle(simpleMeasureFixture);
const valueSets = [getExampleValueSet()];
const setMeasure = jest.fn();
const setMeasureBundle = jest.fn();
const setValueSets = jest.fn();
const setError = jest.fn();
const setCustomWarningMessages = jest.fn();
// Need this for our drag windows to work
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const renderWithRouter = (
  initialEntries = [],
  routePath: string,
  measure: Measure = defaultMeasure
) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <ApiContextProvider value={serviceConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [measure, setMeasure],
            bundleState: [measureBundle, setMeasureBundle],
            valueSetsState: [valueSets, setValueSets],
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <Routes>
            <Route
              path={routePath}
              element={
                <EditTestCase
                  errors={[]}
                  setErrors={setError}
                  setCustomWarningMessages={setCustomWarningMessages}
                />
              }
            />
          </Routes>
        </ExecutionContextProvider>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

const resourceIdentifiers: ResourceIdentifier[] = [
  {
    id: "qicore-adverseevent",
    type: "AdverseEvent",
    title: "QICore AdverseEvent",
    category: "Clinical.Summary",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
  },
  {
    id: "qicore-medicationstatement",
    type: "MedicationStatement",
    title: "QICore MedicationStatement",
    category: "Clinical.Medications",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-medicationstatement",
  },
  {
    id: "qicore-claim",
    type: "Claim",
    title: "QICore Claim",
    category: "Financial.Billing",
    profile: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-claim",
  },
  {
    id: "qicore-procedure",
    type: "Procedure",
    title: "QICore Procedure",
    category: "Clinical.Summary",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
  },
];
const testTitle = async (title: string, clear = false) => {
  const tcTitle = await screen.findByTestId("test-case-title");
  expect(tcTitle).toBeInTheDocument();
  if (clear) {
    userEvent.clear(tcTitle);
    await waitFor(() => {
      expect(tcTitle).toHaveValue("");
    });
  }
  userEvent.type(tcTitle, title);
  await waitFor(() => {
    expect(tcTitle).toHaveValue(title);
  });
};

describe("EditTestCase component", () => {
  beforeEach(() => {
    (checkUserCanEdit as jest.Mock).mockClear().mockImplementation(() => {
      return true;
    });
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (args && args.endsWith("resources")) {
        return Promise.resolve({
          data: [
            {
              id: "qicore-adverseevent",
              type: "AdverseEvent",
              title: "QICore AdverseEvent",
              category: "Clinical.Summary",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
            },
            {
              id: "qicore-medicationstatement",
              type: "MedicationStatement",
              title: "QICore MedicationStatement",
              category: "Clinical.Medications",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-medicationstatement",
            },
            {
              id: "qicore-claim",
              type: "Claim",
              title: "QICore Claim",
              category: "Financial.Billing",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-claim",
            },
            {
              id: "qicore-procedure",
              type: "Procedure",
              title: "QICore Procedure",
              category: "Clinical.Summary",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
            },
          ],
        });
      }
      return Promise.resolve({ data: null });
    });
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.endsWith("relevant-elements")) {
        return Promise.resolve({
          data: [
            {
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
              type: "AdverseEvent",
            },
          ],
        });
      }
    });
    mockedAxios.post.mockImplementation((args) => {
      if (args && args.endsWith("lock")) {
        return Promise.resolve({
          data: {
            isLocked: false,
            locedBy: MEASURE_CREATEDBY,
          },
        });
      }
    });
    mockedAxios.delete.mockImplementation((args) => {
      if (args && args.endsWith("lock")) {
        return Promise.resolve({
          data: {
            isLocked: false,
            locedBy: null,
          },
        });
      }
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  // TODO: split these into separate groups
  describe("EditTestCase other test cases", () => {
    it("should render edit test case page", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
      expect(screen.getByTestId("test-case-cql-editor")).toBeInTheDocument();
      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(
        () => {
          expect(screen.getByTestId("test-case-title")).toBeInTheDocument();
          expect(
            screen.getByTestId("test-case-description")
          ).toBeInTheDocument();
          expect(
            screen.getByRole("button", { name: "Save" })
          ).toBeInTheDocument();
        },
        { timeout: 1500 }
      );
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Discard Changes" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Discard Changes" })
      ).toBeInTheDocument();

      userEvent.click(screen.getByTestId("measurecql-tab"));
      expect(screen.getByTestId("test-case-cql-editor")).toBeInTheDocument();
    });

    it("Navigating between elements tab and json tab", async () => {
      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
      } as unknown as Measure;
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        measure
      );

      expect(screen.getByTestId("elements-content")).toBeInTheDocument();
      expect(
        await screen.findByText("QICore AdverseEvent")
      ).toBeInTheDocument();
      userEvent.click(screen.getByTestId("json-tab"));
      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
    });

    it("Should only display relevant elements", async () => {
      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
      } as unknown as Measure;
      mockedAxios.put.mockImplementation((args) => {
        if (args && args.endsWith("relevant-elements")) {
          return Promise.resolve({
            data: [
              {
                profile:
                  "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
                type: "AdverseEvent",
              },
              {
                profile:
                  "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-medicationstatement",
                type: "MedicationStatement",
              },
            ],
          });
        }
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        measure
      );

      expect(screen.getByTestId("elements-content")).toBeInTheDocument();
      // only relevant elements should be displayed
      expect(
        await screen.findByText("QICore AdverseEvent")
      ).toBeInTheDocument();
      expect(screen.queryByText("QICore Procedure")).not.toBeInTheDocument();
      expect(
        await screen.findByText("QICore MedicationStatement")
      ).toBeInTheDocument();
      userEvent.click(screen.getByTestId("json-tab"));
      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
    });

    it("Should display all elements if fetch of relevant elements fails", async () => {
      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
      } as unknown as Measure;
      const axiosError: AxiosError = {
        response: {
          status: 404,
          data: {},
        } as AxiosResponse,
        toJSON: jest.fn(),
      } as unknown as AxiosError;
      mockedAxios.put.mockClear().mockRejectedValue(axiosError);

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        measure
      );

      expect(screen.getByTestId("elements-content")).toBeInTheDocument();
      // only relevant elements should be displayed
      expect(
        await screen.findByText("QICore AdverseEvent")
      ).toBeInTheDocument();
      expect(screen.queryByText("QICore Procedure")).toBeInTheDocument();
      expect(
        await screen.findByText("QICore MedicationStatement")
      ).toBeInTheDocument();
      userEvent.click(screen.getByTestId("json-tab"));
      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
    });

    it("should edit test case when save button is clicked", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );
      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      mockedAxios.post.mockResolvedValue({
        data: {
          id: "testID",
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1");

      await waitFor(
        () => {
          const descriptionInput = screen.getByTestId("test-case-description");
          userEvent.type(descriptionInput, testCaseDescription);
        },
        { timeout: 1500 }
      );

      const saveButton = screen.getByRole("button", { name: "Save" });
      userEvent.click(saveButton);

      const debugOutput = await screen.findByText(
        "Test case created successfully!"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("Displaying successful message when Id is present in the JSON while editing a test case", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByText(
        "Test case updated successfully!"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("should alert for updated datetime", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
        date: "2025-10-06T12:00:00.000+04:00",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: {
            code: 500,
            message: "An unknown error occurred with HAPI FHIR",
            outcomeResponse: {
              resourceType: "OperationOutcome",
              text: "Error: Bad things happened",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Bad things happened",
                },
              ],
            },
          },
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("error-toast");
      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with errors in JSON"
      );
      expect(setError).toHaveBeenCalledWith([
        "Timezone offsets have been added when hours are present, otherwise timezone offsets are removed or set to UTC for consistency.",
      ]);
    });

    it("should alert for updated datetime without hours", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
        date: "2025-10-06T",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: {
            code: 500,
            message: "An unknown error occurred with HAPI FHIR",
            outcomeResponse: {
              resourceType: "OperationOutcome",
              text: "Error: Bad things happened",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Bad things happened",
                },
              ],
            },
          },
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("error-toast");
      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with errors in JSON"
      );
      expect(setError).toHaveBeenCalledWith([
        "Timezone offsets have been added when hours are present, otherwise timezone offsets are removed or set to UTC for consistency.",
      ]);
    });

    it("should alert for updated datetime with only hours", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
        date: "2025-10-06T12",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: {
            code: 500,
            message: "An unknown error occurred with HAPI FHIR",
            outcomeResponse: {
              resourceType: "OperationOutcome",
              text: "Error: Bad things happened",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Bad things happened",
                },
              ],
            },
          },
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("error-toast");
      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with errors in JSON"
      );
      expect(setError).toHaveBeenCalledWith([
        "Timezone offsets have been added when hours are present, otherwise timezone offsets are removed or set to UTC for consistency.",
      ]);
    });

    it("should alert for test validation status", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as unknown as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("success-toast");
      expect(debugOutput).toHaveTextContent("Test case updated successfully!");
      expect(debugOutput).not.toHaveTextContent(
        "MADiE only supports a timezone offset of 0. MADiE has overwritten any timezone offsets that are not zero."
      );
    });

    it("should alert for test validation status updated datetime", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as unknown as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
        date: "2025-10-06T12:00:00+04:00",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("success-toast");
      //here
      expect(debugOutput).toHaveTextContent("Test case updated successfully!");
      expect(setCustomWarningMessages).toHaveBeenCalledWith([
        {
          message: "Test case updated successfully!",
          details: [
            "Timezone offsets have been added when hours are present, otherwise timezone offsets are removed or set to UTC for consistency.",
          ],
          testDataId: "test-case-validation-warning",
        },
      ]);
    });

    it("should alert for test valid status updated datetime", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as unknown as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
        date: "2025-10-06T12:00:00+04:00",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
          validationStatus: ValidationStatus.VALID,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("success-toast");
      //here
      expect(debugOutput).toHaveTextContent("Test case updated successfully!");
      expect(setCustomWarningMessages).toHaveBeenCalledWith([
        {
          message: "Test case updated successfully!",
          details: [
            "Timezone offsets have been added when hours are present, otherwise timezone offsets are removed or set to UTC for consistency.",
          ],
          testDataId: "test-case-validation-warning",
        },
      ]);
    });

    it("should alert for test valid status bundleTypeUpdated is true", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as unknown as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          validationStatus: ValidationStatus.VALID,
          bundleTypeUpdated: true,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("success-toast");

      expect(debugOutput).toHaveTextContent("Test case updated successfully!");
      expect(setCustomWarningMessages).toHaveBeenCalledWith([
        {
          message: "Test case updated successfully!",
          details: [
            "Please note that the bundle type has been updated to Collection, as the Test Case Builder supports editing only collection bundles.",
          ],
          testDataId: "test-case-validation-warning",
        },
      ]);
    });

    it("should alert for bundleTypeUpdated Pending status", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as unknown as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          bundleTypeUpdated: true,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("success-toast");

      expect(debugOutput).toHaveTextContent("Test case updated successfully!");
      expect(setCustomWarningMessages).toHaveBeenCalledWith([
        {
          message: "Test case updated successfully!",
          details: [
            "Please note that the bundle type has been updated to Collection, as the Test Case Builder supports editing only collection bundles.",
          ],
          testDataId: "test-case-validation-warning",
        },
      ]);
    });

    it("should alert for bundleTypeUpdated Validating status", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as unknown as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          bundleTypeUpdated: true,
          validationStatus: ValidationStatus.VALIDATING,
          hapiOperationOutcome: {
            code: 500,
            message: "An unknown error occurred with HAPI FHIR",
            outcomeResponse: {
              resourceType: "OperationOutcome",
              text: "Error: Bad things happened",
              issue: [
                {
                  severity: "warning",
                  diagnostics: "Bad things happened",
                },
              ],
            },
          },
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("success-toast");

      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with warnings in JSON"
      );
      expect(setCustomWarningMessages).toHaveBeenCalledWith([
        {
          message: "Test case updated successfully!",
          details: [
            "Please note that the bundle type has been updated to Collection, as the Test Case Builder supports editing only collection bundles.",
          ],
          testDataId: "test-case-validation-warning",
        },
      ]);
    });

    it("should display isQICore6 validation running message in toast when test case is created and isQICore6 is true", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.PENDING,
      } as TestCase;

      // Set up measure with QICORE_6_0_0 model
      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
        testCases: [],
      };

      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      mockedAxios.post.mockResolvedValue({
        data: {
          ...testCase,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        measure
      );

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("TC1");

      const saveButton = screen.getByRole("button", { name: "Save" });
      userEvent.click(saveButton);

      const debugOutput = await screen.findByTestId("success-toast");
      expect(debugOutput).toHaveTextContent(
        "Test case created successfully! Test case validation has started running, please continue working in MADiE."
      );
    });

    it("should alert for updated datetime invalid timezone", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "43",
        date: "2025-10-06T12:00:00+99:99",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: {
            code: 500,
            message: "An unknown error occurred with HAPI FHIR",
            outcomeResponse: {
              resourceType: "OperationOutcome",
              text: "Error: Bad things happened",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Bad things happened",
                },
              ],
            },
          },
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("error-toast");
      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with errors in JSON"
      );
      expect(setError).toHaveBeenCalledWith([
        "Timezone offsets have been added when hours are present, otherwise timezone offsets are removed or set to UTC for consistency.",
      ]);
    });

    it("should save the cql with errros and shouldn't perform datetime conversion when cql cannot be parsed", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = "";

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: {
            code: 500,
            message: "An unknown error occurred with HAPI FHIR",
            outcomeResponse: {
              resourceType: "OperationOutcome",
              text: "Error: Bad things happened",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Bad things happened",
                },
              ],
            },
          },
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);
      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1", true);

      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByTestId("error-toast");
      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with errors in JSON"
      );
    });

    it("Displaying successful message when Id is not present in the JSON while editing a test case", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [testCase],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      const testCaseDescription = "TestCase123";
      const testCaseTitle = "TestTitle";
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
      });

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          json: testCaseJson,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      const editor = screen.getByTestId("test-case-json-editor");
      await waitFor(() => expect(editor).toHaveValue(""));
      userEvent.click(screen.getByTestId("details-tab"));
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);

      await testTitle("TC1", true);

      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "Discard Changes" })
      ).not.toBeDisabled();
      const createBtn = await screen.findByRole("button", {
        name: "Save",
      });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByText(
        "Test case updated successfully!"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("should provide user alert when edit test case fails", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );
      const testCaseDescription = "TestCase123";
      mockedAxios.post.mockRejectedValue({
        data: {
          error: "Random error",
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("TC1");

      await waitFor(
        () => {
          const descriptionInput = screen.getByTestId("test-case-description");
          userEvent.type(descriptionInput, testCaseDescription);
        },
        { timeout: 1500 }
      );

      const createBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(createBtn);

      const alert = await screen.findByTestId("error-toast");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "An error occurred while creating the test case."
      );
    });

    it("should provide user alert for a success result but response is missing ID attribute", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );
      const testCaseDescription = "TestCase123";
      mockedAxios.post.mockResolvedValue({
        data: `The requested URL was rejected. Please contact soc.
            
             Your support ID is: 12345678901234567890
            `,
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("TC1");

      await waitFor(
        () => {
          const descriptionInput = screen.getByTestId("test-case-description");
          userEvent.type(descriptionInput, testCaseDescription);
        },
        { timeout: 1500 }
      );

      const createBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(createBtn);

      const alert = await screen.findByTestId("error-toast");
      expect(alert).toHaveTextContent(
        "An error occurred - create did not return the expected successful result."
      );

      const closeAlertBtn = screen.findByTestId("close-toast-button");
      userEvent.click(await closeAlertBtn);
      await waitFor(() => {
        expect(
          screen.queryByText(
            "An error occurred - create did not return the expected successful result."
          )
        ).not.toBeInTheDocument();
      });
    });

    it("should update test case when update button is clicked", async () => {
      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        series: "SeriesA",
        json: `{"test":"test"}`,
        groupPopulations: [
          {
            groupId: "Group1_ID",
            scoring: MeasureScoring.CONTINUOUS_VARIABLE,
            populationValues: [
              {
                name: PopulationType.INITIAL_POPULATION,
                expected: true,
                actual: false,
              },
              {
                name: PopulationType.MEASURE_POPULATION,
                expected: true,
                actual: false,
              },
            ],
          },
        ],
      } as unknown as TestCase;
      const testCaseDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });
      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [testCase],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          description: testCaseDescription,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const seriesInput = screen
        .getByTestId("test-case-series")
        .querySelector("input");
      expect(seriesInput).toHaveValue("SeriesA");

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${testCaseDescription}`
      );

      userEvent.click(seriesInput);
      const list = await screen.findByRole("listbox");
      expect(list).toBeInTheDocument();
      const listItems = within(list).getAllByRole("option");
      expect(listItems[1]).toHaveTextContent("SeriesB");
      userEvent.click(listItems[1]);

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("TC1");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
      });
      userEvent.click(screen.getByRole("button", { name: "Save" }));

      const debugOutput = await screen.findByText(
        "Test case updated successfully!"
      );
      expect(debugOutput).toBeInTheDocument();

      const calls = mockedAxios.put.mock.calls;
      expect(calls).toBeTruthy();
      expect(calls[0]).toBeTruthy();
      const updatedTestCase = calls[0][1] as TestCase;
      expect(updatedTestCase).toBeTruthy();
      expect(updatedTestCase.series).toEqual("SeriesB");
      expect(updatedTestCase.groupPopulations).toEqual([
        {
          groupId: "Group1_ID",
          scoring: MeasureScoring.CONTINUOUS_VARIABLE,
          populationValues: [
            {
              name: PopulationType.INITIAL_POPULATION,
              expected: true,
              actual: false,
            },
            {
              name: PopulationType.MEASURE_POPULATION,
              expected: true,
              actual: false,
            },
          ],
        },
      ]);
    });

    it("should clear error alert when user clicks alert close button", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );
      const testCaseDescription = "TestCase123";
      mockedAxios.post.mockRejectedValue({
        data: {
          error: "Random error",
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("TC1");
      await waitFor(
        () => {
          const descriptionInput = screen.getByTestId("test-case-description");
          userEvent.type(descriptionInput, testCaseDescription);
        },
        { timeout: 1500 }
      );

      const createBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(createBtn);

      const alert = await screen.findByTestId("error-toast");
      expect(alert).toHaveTextContent(
        "An error occurred while creating the test case."
      );

      const closeAlertBtn = screen.findByTestId("close-toast-button");
      userEvent.click(await closeAlertBtn);
      await waitFor(() => {
        expect(
          screen.queryByText("An error occurred while creating the test case.")
        ).not.toBeInTheDocument();
      });
    });

    it("should load existing test case data when viewing specific test case", async () => {
      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        json: `{"test":"test"}`,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(
        () => {
          const descriptionTextArea = screen.getByTestId(
            "test-case-description"
          );
          expect(descriptionTextArea).toBeInTheDocument();
          expect(descriptionTextArea).toHaveTextContent(testCase.description);
        },
        { timeout: 1500 }
      );
      userEvent.click(screen.getByTestId("details-tab"));
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Discard Changes" })
      ).toBeInTheDocument();
    });

    it("Displaying successful message when Id is not present in the JSON while updating test case when update button is clicked", async () => {
      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        title: "Original Title",
        series: "SeriesA",
        groupPopulations: [
          {
            groupId: "Group1_ID",
            scoring: MeasureScoring.CONTINUOUS_VARIABLE,
            populationValues: [
              {
                name: PopulationType.INITIAL_POPULATION,
                expected: true,
                actual: false,
              },
              {
                name: PopulationType.MEASURE_POPULATION,
                expected: true,
                actual: false,
              },
            ],
          },
        ],
      } as unknown as TestCase;
      const testCaseDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });
      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [testCase],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Continuous Variable",
            populationBasis: "boolean",
            populations: [
              {
                name: PopulationType.INITIAL_POPULATION,
                definition: "Pop1",
              },
              {
                name: PopulationType.MEASURE_POPULATION,
                definition: "Measure Population",
              },
            ],
          },
        ],
      } as unknown as Measure;
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          json: testCaseJson,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const seriesInput = screen
        .getByTestId("test-case-series")
        .querySelector("input");
      expect(seriesInput).toHaveValue("SeriesA");

      await testTitle("Updated Title", true);

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${testCaseDescription}`
      );

      userEvent.click(seriesInput);
      const list = await screen.findByRole("listbox");
      expect(list).toBeInTheDocument();
      const listItems = within(list).getAllByRole("option");
      expect(listItems[1]).toHaveTextContent("SeriesB");
      userEvent.click(listItems[1]);

      userEvent.click(screen.getByTestId("expectoractual-tab"));

      const ippExpectedCb = await screen.findByTestId(
        "test-population-initialPopulation-expected"
      );
      expect(ippExpectedCb).toBeChecked();

      const editor = screen.getByTestId("test-case-json-editor");
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
      });
      userEvent.click(screen.getByRole("button", { name: "Save" }));

      const debugOutput = await screen.findByText(
        "Test case updated successfully!"
      );
      expect(debugOutput).toBeInTheDocument();

      const calls = mockedAxios.put.mock.calls;
      expect(calls).toBeTruthy();
      expect(calls[0]).toBeTruthy();
      const updatedTestCase = calls[0][1] as TestCase;
      expect(updatedTestCase).toBeTruthy();
      expect(updatedTestCase.series).toEqual("SeriesB");
      expect(updatedTestCase.title).toEqual("Updated Title");
      expect(updatedTestCase.groupPopulations).toEqual([
        {
          groupId: "Group1_ID",
          scoring: MeasureScoring.CONTINUOUS_VARIABLE,
          populationBasis: "boolean",
          populationValues: [
            {
              name: PopulationType.INITIAL_POPULATION,
              expected: true,
              actual: false,
            },
            {
              name: PopulationType.MEASURE_POPULATION,
              expected: true,
              actual: false,
            },
          ],
        },
      ]);
    });

    it("Displaying successful message when Id is present in the JSON while updating test case when update button is clicked", async () => {
      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        series: "SeriesA",
        groupPopulations: [
          {
            groupId: "Group1_ID",
            scoring: MeasureScoring.CONTINUOUS_VARIABLE,
            populationValues: [
              {
                name: PopulationType.INITIAL_POPULATION,
                expected: true,
                actual: false,
              },
              {
                name: PopulationType.MEASURE_POPULATION,
                expected: true,
                actual: false,
              },
            ],
          },
        ],
      } as unknown as TestCase;
      const testCaseDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });
      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Continuous Variable",
            populationBasis: "boolean",
            populations: [
              {
                name: PopulationType.INITIAL_POPULATION,
                definition: "Pop1",
              },
              {
                name: PopulationType.MEASURE_POPULATION,
                definition: "measure population",
              },
            ],
          },
        ],
      } as unknown as Measure;
      const testCaseJson = JSON.stringify({
        resourceType: "Bundle",
        id: "12",
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("details-tab"));

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          json: testCaseJson,
          description: testCaseDescription,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      await testTitle("Updated Title", true);

      const seriesInput = screen
        .getByTestId("test-case-series")
        .querySelector("input");
      expect(seriesInput).toHaveValue("SeriesA");

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${testCaseDescription}`
      );

      userEvent.click(seriesInput);
      const list = await screen.findByRole("listbox");
      expect(list).toBeInTheDocument();
      const listItems = within(list).getAllByRole("option");
      expect(listItems[1]).toHaveTextContent("SeriesB");
      userEvent.click(listItems[1]);

      userEvent.click(screen.getByTestId("expectoractual-tab"));
      const ippExpectedCb = await screen.findByTestId(
        "test-population-initialPopulation-expected"
      );
      expect(ippExpectedCb).toBeChecked();

      const editor = screen.getByTestId("test-case-json-editor");
      userEvent.paste(editor, testCaseJson);
      expect(editor).toHaveValue(testCaseJson);

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
      });
      userEvent.click(screen.getByRole("button", { name: "Save" }));

      const debugOutput = await screen.findByText(
        "Test case updated successfully!"
      );
      expect(debugOutput).toBeInTheDocument();

      const calls = mockedAxios.put.mock.calls;
      expect(calls).toBeTruthy();
      expect(calls[0]).toBeTruthy();
      const updatedTestCase = calls[0][1] as TestCase;
      expect(updatedTestCase).toBeTruthy();
      expect(updatedTestCase.title).toEqual("Updated Title");
      expect(updatedTestCase.series).toEqual("SeriesB");
      expect(updatedTestCase.groupPopulations).toEqual([
        {
          groupId: "Group1_ID",
          scoring: MeasureScoring.CONTINUOUS_VARIABLE,
          populationBasis: "boolean",
          populationValues: [
            {
              name: PopulationType.INITIAL_POPULATION,
              expected: true,
              actual: false,
            },
            {
              name: PopulationType.MEASURE_POPULATION,
              expected: true,
              actual: false,
            },
          ],
        },
      ]);
    });

    it("should display an error when test case update fails", async () => {
      const testCase = {
        id: "1234",
        title: "Original Title",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        json: `{"test":"test"}`,
      } as TestCase;
      const modifiedDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const axiosError: AxiosError = {
        response: {
          status: 404,
          data: {},
        } as AxiosResponse,
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.put.mockClear().mockRejectedValue(axiosError);

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${modifiedDescription}`
      );

      await waitFor(() => {
        expect(descriptionInput).toHaveTextContent(modifiedDescription);
      });
      userEvent.click(screen.getByRole("button", { name: "Save" }));

      const debugOutput = await screen.findByText(
        "An error occurred while updating the test case."
      );
      expect(debugOutput);
    });

    it("should display an error when test case update fails due to test case locked", async () => {
      const testCase = {
        id: "1234",
        title: "Original Title",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        json: `{"test":"test"}`,
      } as TestCase;
      const modifiedDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      const axiosError: AxiosError = {
        response: {
          status: 423,
          data: {
            message:
              "Unable to update Test Case. Test Case is locked by: another.user",
          },
        } as AxiosResponse,
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.put.mockClear().mockRejectedValue(axiosError);

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${modifiedDescription}`
      );

      await waitFor(() => {
        expect(descriptionInput).toHaveTextContent(modifiedDescription);
      });
      userEvent.click(screen.getByRole("button", { name: "Save" }));

      const debugOutput = await screen.findByText(
        "Unable to update Test Case. Test Case is locked by: another.user"
      );
      expect(debugOutput);
    });

    it("should display an error when test case update returns no data", async () => {
      const testCase = {
        id: "1234",
        title: "Original Title",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        json: `{"test":"test"}`,
      } as TestCase;
      const modifiedDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      mockedAxios.put.mockResolvedValue({
        data: null,
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${modifiedDescription}`
      );

      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

      await waitFor(() => {
        expect(descriptionInput).toHaveTextContent(modifiedDescription);
      });
      userEvent.click(screen.getByTestId("details-tab"));
      userEvent.click(screen.getByRole("button", { name: "Save" }));

      const debugOutput = await screen.findByText(
        "An error occurred while updating the test case."
      );
      expect(debugOutput);
    });

    it("should ignore supplied changes when cancel button is clicked during test case edit", async () => {
      const testCase = {
        id: "1234",
        title: "Original Title",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        json: `{"test":"test"}`,
      } as TestCase;
      const modifiedDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const descriptionInput = screen.getByTestId("test-case-description");
      expect(descriptionInput).toHaveTextContent(testCase.description);
      userEvent.type(
        descriptionInput,
        `{selectall}{del}${modifiedDescription}`
      );

      await waitFor(() => {
        expect(descriptionInput).toHaveTextContent(modifiedDescription);
      });
      userEvent.click(screen.getByRole("button", { name: "Discard Changes" }));
      expect(mockedAxios.put).toBeCalledTimes(0);
    });

    it("should generate field level error for test case description more than 250 characters", async () => {
      const testCase = {
        id: "1234",
        title: "Original Title",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        json: `{"test":"test"}`,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [testCase],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      userEvent.click(screen.getByTestId("details-tab"));
      const testCaseDescription =
        "abcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyzaaa";
      const descriptionInput = screen.getByTestId("test-case-description");
      userEvent.type(descriptionInput, testCaseDescription);

      fireEvent.blur(descriptionInput);

      testTitle("TC1");

      const createBtn = screen.getByRole("button", { name: "Save" });
      await waitFor(() => {
        expect(createBtn).toBeDisabled;
      });
      expect(
        screen.getByTestId("test-case-description-helper-text")
      ).toHaveTextContent(
        "Test Case Description cannot be more than 250 characters."
      );
    });

    it("should allow special characters for test case description", async () => {
      const testCaseDescription =
        "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
      const testCaseTitle = "TestTitle";

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      // mock update to test case
      mockedAxios.post.mockResolvedValue({
        data: {
          id: "testID",
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));

      await testTitle("TC1");

      // description with special characters is added
      await waitFor(
        () => {
          const descriptionInput = screen.getByTestId("test-case-description");
          userEvent.type(descriptionInput, testCaseDescription);
        },
        { timeout: 1500 }
      );

      const saveButton = screen.getByRole("button", { name: "Save" });
      userEvent.click(saveButton);

      const debugOutput = await screen.findByText(
        "Test case created successfully!"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("should display an error when test case series fail to load", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.reject({
            status: 500,
            data: null,
          });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        } else if (
          args &&
          args.startsWith(serviceConfig.measureService.baseUrl)
        ) {
          return Promise.resolve({
            data: {
              id: "m1234",
              measureScoring: MeasureScoring.COHORT,
            },
          });
        }
        return Promise.resolve({ data: null });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      userEvent.click(screen.getByTestId("details-tab"));
      const debugOutput = await screen.findByText(
        "Unable to retrieve test case series, please try later."
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("should display an error when measure doesn't exist fetching test case series", async () => {
      const axiosError: AxiosError = {
        response: {
          status: 404,
          data: {},
        } as AxiosResponse,
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.reject(axiosError);
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        } else if (
          args &&
          args.startsWith(serviceConfig.measureService.baseUrl)
        ) {
          return Promise.resolve({
            data: {
              id: "m1234",
              measureScoring: MeasureScoring.COHORT,
            },
          });
        }
        return Promise.resolve({ data: null });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      userEvent.click(screen.getByTestId("details-tab"));
      const debugOutput = await screen.findByText(
        "Measure does not exist, unable to load test case series!"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("should allow special characters for test case title", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      const testCaseDescription = "Test Description";
      const testCaseTitle =
        "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
      mockedAxios.post.mockResolvedValue({
        data: {
          id: "testID",
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          title: testCaseTitle,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("TC1");

      const createBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByText(
        "Test case created successfully!"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("should allow special characters for test case series", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      const testCaseDescription = "Test Description";
      const testCaseSeries =
        "{{[[{shift}{ctrl/}a{/shift}~!@#$% ^&*() _-+= }|] \\ :;,. <>?/ '\"";
      mockedAxios.post.mockResolvedValue({
        data: {
          id: "testID",
          createdBy: MEASURE_CREATEDBY,
          description: testCaseDescription,
          series: testCaseSeries,
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(() => {
        const seriesInput = screen.getByTestId("test-case-series");
        userEvent.type(seriesInput, testCaseSeries);
      });
      await testTitle("TC1");

      const createBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(createBtn);

      const debugOutput = await screen.findByText(
        "Test case created successfully!"
      );
      expect(debugOutput).toBeInTheDocument();
    }, 50000);

    it("should display HAPI validation errors after creating test case", async () => {
      jest.useFakeTimers("modern");

      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
      } as unknown as Measure;

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        measure
      );

      const mockResponse = {
        data: {
          id: "testID",
          validationStatus: ValidationStatus.INVALID,
          hapiOperationOutcome: {
            code: 400,
            outcomeResponse: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Patient.name is a required field",
                  location: ["Location 1"],
                },
                {
                  severity: "error",
                  diagnostics: "Patient.identifier is a required field",
                  location: ["Location 2"],
                },
              ],
            },
          },
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      // Actions
      await act(async () => {
        userEvent.click(screen.getByTestId("details-tab"));
        await testTitle("TC1");
      });

      userEvent.click(screen.getByRole("button", { name: "Save" }));

      // Assertions
      const debugOutput = await screen.findByText(
        testCaseAlertToast
          ? "Changes created successfully but the following error(s) were found"
          : "Test case updated successfully with errors in JSON"
      );
      expect(debugOutput).toBeInTheDocument();

      expect(screen.queryByTestId("json-error-alert")).not.toBeInTheDocument();
      expect(screen.queryByText("JSON Failing")).not.toBeInTheDocument();
      expect(screen.getByTestId("elements-content")).toBeInTheDocument();

      const validationErrorsBtn = screen.getByRole("button", {
        name: "Open Validations",
      });
      userEvent.click(validationErrorsBtn);
      jest.advanceTimersByTime(100);

      const errorList = await screen.findByTestId(
        "json-validation-errors-list"
      );
      expect(errorList).toBeInTheDocument();

      const patientNameError = await screen.findByTestId("validation-card-0");
      expect(patientNameError).toBeInTheDocument();
      expect(patientNameError).toHaveTextContent(
        `Error: Resource ID: Location 1 | Patient.name is a required field`
      );
      const patientIdentifierError = await screen.findByTestId(
        "validation-card-1"
      );
      expect(patientIdentifierError).toBeInTheDocument();
      expect(patientIdentifierError).toHaveTextContent(
        `Error: Resource ID: Location 2 | Patient.identifier is a required field`
      );

      jest.useRealTimers();
    });

    it("should display JSON error notification and not display QICore test case builder for invalid JSON", async () => {
      jest.useFakeTimers("modern");
      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        series: "SeriesA",
        json: `{"test":"test" BAD BAD JSON - DEFINITELY INVALID }`,
      } as TestCase;

      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        model: Model.QICORE_6_0_0,
        testCases: [],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      await renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      expect(await screen.findByTestId("json-error-alert")).toBeInTheDocument();
      expect(screen.queryByTestId("elements-content")).not.toBeInTheDocument();
      expect(screen.getByText("JSON Failing")).toBeInTheDocument();
      expect(
        screen.getByText(
          "All JSON errors must be cleared before the UI Builder can be used."
        )
      ).toBeInTheDocument();
    }, 15000);

    it("should display HAPI validation errors after update test case", async () => {
      jest.useFakeTimers("modern");

      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        series: "SeriesA",
        json: `{"test":"test"}`,
      } as TestCase;

      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;
      const testCaseDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      mockedAxios.put.mockResolvedValue({
        data: {
          ...testCase,
          description: testCaseDescription,
          hapiOperationOutcome: {
            code: 400,
            outcomeResponse: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  diagnostics: "Patient.name is a required field",
                  location: ["Location 1"],
                },
                {
                  severity: "error",
                  diagnostics: "Patient.identifier is a required field",
                  location: ["Location 2"],
                },
              ],
            },
          },
        },
      });
      userEvent.click(screen.getByTestId("details-tab"));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      await testTitle("TC1");
      const seriesInput = screen.getByTestId("test-case-description");
      userEvent.type(seriesInput, testCaseDescription);
      const updateBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(updateBtn);
      const debugOutput = await screen.findByText(
        testCaseAlertToast
          ? "Changes updated successfully but the following error(s) were found"
          : "Test case updated successfully with errors in JSON"
      );
      expect(debugOutput).toBeInTheDocument();

      const showValidationErrorsBtn = screen.getByRole("button", {
        name: "Open Validations",
      });
      expect(showValidationErrorsBtn).toBeInTheDocument();
      userEvent.click(showValidationErrorsBtn);
      jest.advanceTimersByTime(700);

      const validationErrorsList = await screen.findByTestId(
        "json-validation-errors-list"
      );
      expect(validationErrorsList).toBeInTheDocument();

      const patientNameError = await screen.findByTestId("validation-card-0");
      expect(patientNameError).toBeInTheDocument();
      expect(patientNameError).toHaveTextContent(
        `Error: Resource ID: Location 1 | Patient.name is a required field`
      );

      const patientIdentifierError = await screen.findByTestId(
        "validation-card-1"
      );
      expect(patientIdentifierError).toBeInTheDocument();
      expect(patientIdentifierError).toHaveTextContent(
        `Error: Resource ID: Location 2 | Patient.identifier is a required field`
      );
    });

    it("should alert for HAPI FHIR errors", async () => {
      jest.useFakeTimers("modern");

      const testCase = {
        id: "1234",
        title: "Original Title",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        series: "SeriesA",
        json: `{"test":"test"}`,
      } as TestCase;

      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;

      const testCaseDescription = "modified description";
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      const data = {
        ...testCase,
        description: testCaseDescription,
        hapiOperationOutcome: {
          code: 500,
          message: "An unknown error occurred with HAPI FHIR",
          outcomeResponse: {
            resourceType: "OperationOutcome",
            text: "Error: Bad things happened",
            issue: [
              {
                severity: "error",
                diagnostics: "Bad things happened",
                location: ["Location 1"],
              },
            ],
          },
        },
      };

      mockedAxios.put.mockResolvedValue({
        data,
      });

      userEvent.click(screen.getByTestId("details-tab"));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Save" })
        ).toBeInTheDocument();
      });

      const tcTitle = await screen.findByTestId("test-case-title");
      expect(tcTitle).toBeInTheDocument();
      userEvent.type(tcTitle, "TC1");
      await waitFor(() => {
        expect(tcTitle).toHaveValue("TC1");
      });
      const seriesInput = screen.getByTestId("test-case-description");
      userEvent.type(seriesInput, testCaseDescription);
      const updateBtn = screen.getByRole("button", { name: "Save" });
      userEvent.click(updateBtn);

      const debugOutput = await screen.findByTestId("error-toast");
      expect(debugOutput).toBeInTheDocument();
      expect(debugOutput).toHaveTextContent(
        "Test case updated successfully with errors in JSON"
      );

      const showValidationErrorsBtn = screen.getByRole("button", {
        name: "Open Validations",
      });
      expect(showValidationErrorsBtn).toBeInTheDocument();
      userEvent.click(showValidationErrorsBtn);
      jest.advanceTimersByTime(700);

      const validationErrorsList = await screen.findByTestId(
        "json-validation-errors-list"
      );
      expect(validationErrorsList).toBeInTheDocument();

      const error = await screen.findByTestId("validation-card-0");
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent(
        `Error: Resource ID: Location 1 | Bad things happened`
      );

      const closeValidationErrorsBtn = await screen.findByRole("button", {
        name: "Close Panel",
      });
      expect(closeValidationErrorsBtn).toBeInTheDocument();
      userEvent.click(closeValidationErrorsBtn);
      jest.advanceTimersByTime(700);
      const sideButton = await screen.findByTestId(
        "closed-json-validation-errors-aside"
      );
      expect(sideButton).toBeInTheDocument();
      const errorText = screen.queryByText(
        "data.hapiOperationOutcome.outcomeResponse.text"
      );
      expect(errorText).not.toBeInTheDocument();
    });

    it("should start polling if the validation response is either Pending or Validating", async () => {
      const testCase = {
        id: "1234",
        createdBy: MEASURE_CREATEDBY,
        description: "Test IPP",
        series: "SeriesA",
        json: `{"test":"test"}`,
        validationStatus: ValidationStatus.PENDING,
        hapiOperationOutcome: null,
      } as unknown as TestCase;

      const measure = {
        id: "m1234",
        createdBy: MEASURE_CREATEDBY,
        testCases: [],
        groups: [
          {
            id: "Group1_ID",
            scoring: "Cohort",
            population: {
              initialPopulation: "Pop1",
            },
          },
        ],
      } as unknown as Measure;
      mockedAxios.get
        .mockClear()
        .mockImplementation((args) => {
          if (args && args.endsWith("series")) {
            return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
          } else if (args && args.endsWith("resources")) {
            return Promise.resolve({
              data: [...resourceIdentifiers],
            });
          }
          return Promise.resolve({ data: testCase });
        })
        .mockResolvedValueOnce(
          Promise.resolve({
            data: { ...testCase, validationStatus: ValidationStatus.VALID },
          })
        );

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it("should handle displaying a test case with null groupPopulation data", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        json: '{ "resourceType": "Bundle", "type": "collection", "entry": [] }',
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        hapiOperationOutcome: {} as HapiOperationOutcome,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        } else if (
          args &&
          args.startsWith(serviceConfig.measureService.baseUrl)
        ) {
          return Promise.resolve({
            data: {
              id: "m1234",
              measureScoring: MeasureScoring.CONTINUOUS_VARIABLE,
              groups: [
                {
                  id: "Group1_ID",
                  scoring: "Cohort",
                  population: {
                    initialPopulation: "Pop1",
                  },
                },
              ],
            },
          });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      userEvent.click(screen.getByTestId("expectoractual-tab"));
      const ippRow = await screen.findByTestId(
        "test-row-population-id-initialPopulation"
      );
      expect(ippRow).toBeInTheDocument();
    });

    it("should show message and disable run button when no groups are present", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        json: '{ "resourceType": "Bundle", "type": "collection", "entry": [] }',
        groupPopulations: [],
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        hapiOperationOutcome: {} as HapiOperationOutcome,
      } as TestCase;

      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: testCase });
      });
      const measure = { ...defaultMeasure, groups: null };
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      userEvent.click(screen.getByTestId("expectoractual-tab"));
      const errorMessage = await screen.findByText(
        "No data for current scoring. Please make sure at least one measure group has been created."
      );
      expect(errorMessage).toBeInTheDocument();
    });

    it("showing the error message in the measure cql tab when there are errors in the cql", async () => {
      const measure = { ...defaultMeasure, cqlErrors: true };
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
      expect(
        await screen.findByText(
          "An error exists with the measure CQL, please review the CQL Editor tab"
        )
      ).toBeInTheDocument();
    });

    it("checking if cql is being shown when there are no errors in the cql", async () => {
      const measure = { ...defaultMeasure, cql: "MeasureCql" };
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
      expect(screen.getByTestId("test-case-cql-editor")).toBeInTheDocument();
      userEvent.click(screen.getByTestId("expectoractual-tab"));
      userEvent.click(screen.getByTestId("measurecql-tab"));

      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue("MeasureCql");
    });

    it("should disable run button when json string is empty", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        json: "{}",
        groupPopulations: [],
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        hapiOperationOutcome: {} as HapiOperationOutcome,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA", "SeriesB", "SeriesC"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        } else if (
          args &&
          args.startsWith(serviceConfig.measureService.baseUrl)
        ) {
          return Promise.resolve({ data: simpleMeasureFixture });
        }
        return Promise.resolve({ data: testCase });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );
      userEvent.click(screen.getByTestId("details-tab"));

      await waitFor(() => {
        expect(
          screen.getByRole("button", {
            name: "Run Test Case",
          })
        ).toBeDisabled();
      });
    });

    it("should render 404 page", async () => {
      mockedAxios.get.mockClear().mockImplementation(() => {
        return Promise.reject(
          new Error("Error: Request failed with status code 404")
        );
      });

      await act(async () => {
        render(
          <MemoryRouter
            initialEntries={["/measures/m1234/edit/test-cases/tc1234"]}
          >
            <ApiContextProvider value={serviceConfig}>
              <TestCaseRoutes />
            </ApiContextProvider>
          </MemoryRouter>
        );
      });

      expect(screen.getByTestId("404-page")).toBeInTheDocument();
      expect(screen.getByText("404 - Not Found!")).toBeInTheDocument();
      expect(screen.getByTestId("404-page-link")).toBeInTheDocument();
    });

    it("should disable text input and no create or update button if measure is not shared with user", async () => {
      (checkUserCanEdit as jest.Mock).mockImplementation(() => {
        return false;
      });
      mockedAxios.get.mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        }
        return Promise.resolve({ data: null });
      });

      const measure = { ...defaultMeasure, createdBy: "AnotherUser" };

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        measure
      );

      const editor = screen.getByTestId("test-case-json-editor");
      userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(
        () => {
          expect(
            screen.queryByRole("button", { name: "Save" })
          ).not.toBeInTheDocument();
          expect(
            screen.getByRole("textbox", { name: "Title" })
          ).toHaveAttribute("readonly");
          expect(
            screen.getByRole("textbox", { name: "Description" })
          ).toHaveAttribute("readonly");
          expect(
            screen.getByRole("textbox", { name: "Group" })
          ).toHaveAttribute("readonly");
        },
        { timeout: 1500 }
      );

      expect(editor).toBeInTheDocument();
    });

    it("should render text input and update button if measure is shared with the user", async () => {
      mockedAxios.get.mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        }
        return Promise.resolve({ data: null });
      });

      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases",
        defaultMeasure
      );
      const editor = await screen.getByTestId("test-case-json-editor");
      await userEvent.click(screen.getByTestId("details-tab"));
      await waitFor(
        () => {
          expect(screen.queryByTestId("test-case-title")).toBeInTheDocument();
          expect(
            screen.queryByTestId("test-case-description")
          ).toBeInTheDocument();
          expect(screen.queryByTestId("test-case-series")).toBeInTheDocument();
          expect(
            screen.queryByRole("button", { name: "Save" })
          ).toBeInTheDocument();
        },
        { timeout: 1500 }
      );
      expect(
        screen.queryByRole("button", { name: "Discard Changes" })
      ).toBeInTheDocument();

      expect(editor).toBeInTheDocument();
    });
    it("handles checking expected values", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: { ...testCaseFixture } });
      });
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("expectoractual-tab"));
      //fail
      const ipCheckbox = await screen.findByTestId(
        "test-population-initialPopulation-expected"
      );
      expect(ipCheckbox).toBeInTheDocument();
      userEvent.click(ipCheckbox);
      await waitFor(() => expect(ipCheckbox).toBeChecked());
      const stratCheckbox = await screen.findByTestId(
        "Strata 1-initialPopulation-expected"
      );
      userEvent.click(stratCheckbox);
      expect(stratCheckbox).toBeInTheDocument();
      await waitFor(() => {
        expect(stratCheckbox).toBeChecked();
      });
      userEvent.click(stratCheckbox);
      userEvent.click(screen.getByTestId("details-tab"));

      const tcTitle = await screen.findByTestId("test-case-title");
      userEvent.clear(tcTitle);
      userEvent.type(tcTitle, "testTitle");
      await waitFor(() => expect(tcTitle).toHaveValue("testTitle"));

      const saveButton = await screen.findByRole("button", {
        name: "Save",
      });
      await waitFor(() => expect(saveButton).not.toBeDisabled());
      userEvent.click(saveButton);

      const alert = await screen.findByTestId("error-toast");
      expect(alert).toBeInTheDocument();
    });

    it("handles checking expected non-boolean values", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: { ...nonBoolTestCaseFixture } });
      });
      const measure = {
        ...multiGroupMeasureFixture,
        createdBy: MEASURE_CREATEDBY,
      };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/631f98927e7cb7651b971d1d",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("expectoractual-tab"));

      const ipInput = await screen.findByTestId(
        "test-population-initialPopulation-expected"
      );
      expect(ipInput).toBeInTheDocument();
      userEvent.clear(ipInput);
      userEvent.type(ipInput, "BAD");
      await waitFor(() => expect(ipInput).toHaveValue("BAD"));
      await waitFor(() =>
        expect(
          screen.getByText(
            "Only positive numeric values can be entered in the expected values"
          )
        ).toBeInTheDocument()
      );

      userEvent.click(screen.getByTestId("details-tab"));

      const tcTitle = await screen.findByTestId("test-case-title");
      userEvent.clear(tcTitle);
      userEvent.type(tcTitle, "testTitle");
      await waitFor(() => expect(tcTitle).toHaveValue("testTitle"));

      const saveButton = await screen.findByRole("button", {
        name: "Save",
      });
      await waitFor(() => expect(saveButton).toBeDisabled());
    });

    it("executes a test case and shows the errors for invalid test case json", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: '{ "resourceType": "Bundle", "type": "collection", "entry": [] }',
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        } else if (args && args.includes("test-cases/")) {
          return Promise.resolve({
            data: testCase,
          });
        } else if (
          args &&
          args.startsWith(serviceConfig.measureService.baseUrl)
        ) {
          return Promise.resolve({ data: simpleMeasureFixture });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      mockedAxios.post.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("execution-bundles")) {
          return Promise.resolve({
            data: {
              testCases: [testCase],
              modifiedTestCaseIds: ["1234"],
            },
          });
        }
      });
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      measure.testCaseConfiguration.executeInvalidTestCases = false;
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("details-tab"));
      // this is to make form dirty so that run test button is enabled
      const tcTitle = await screen.findByTestId("test-case-title");
      userEvent.type(tcTitle, "testTitle");
      await waitFor(() => {
        const runTestButton = screen.getByRole("button", {
          name: "Run Test Case",
        });
        expect(runTestButton).not.toBeDisabled();
      });
      userEvent.click(screen.getByRole("button", { name: "Run Test Case" }));
      expect(screen.getByText("CQL")).toBeInTheDocument();

      userEvent.click(screen.getByTestId("highlighting-tab"));
      const debugOutput = await screen.findByText(
        "No entries found in passed patient bundles"
      );
      expect(debugOutput).toBeInTheDocument();
    });

    it("executes a test case successfully when test case resources are valid", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: { ...testCaseFixture, createdBy: MEASURE_CREATEDBY },
        });
      });
      mockedAxios.post.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("execution-bundles")) {
          return Promise.resolve({
            data: {
              testCases: [testCaseFixture],
              modifiedTestCaseIds: [testCaseFixture.id],
            },
          });
        }
        return Promise.resolve({
          data: {
            code: 200,
            message: null,
            successful: true,
            outcomeResponse: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "informational",
                  code: "processing",
                  diagnostics: "No issues!",
                },
              ],
            },
          },
        });
      });
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("details-tab"));

      // this is to make form dirty so that run test button is enabled
      const tcTitle = await screen.findByTestId("test-case-title");
      userEvent.type(tcTitle, "testTitle");

      userEvent.click(screen.getByTestId("expectoractual-tab"));

      await waitFor(async () => {
        userEvent.click(
          await screen.findByRole("button", { name: "Run Test Case" })
        );
      });
      userEvent.click(screen.getByTestId("highlighting-tab"));
      expect(
        await screen.findByText("Population Criteria")
      ).toBeInTheDocument();

      userEvent.click(screen.getByTestId("expectoractual-tab"));
      expect(
        await screen.findByTestId("test-population-initialPopulation-actual")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("test-population-numerator-actual")
      ).not.toBeChecked();
    });

    it("disables run button when CQL return type mismatch error exists on measure", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: { ...testCaseFixture, createdBy: MEASURE_CREATEDBY },
        });
      });
      mockedAxios.post.mockResolvedValue({
        data: {
          code: 200,
          message: null,
          successful: true,
          outcomeResponse: {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "informational",
                code: "processing",
                diagnostics: "No issues!",
              },
            ],
          },
        },
      });
      const measure = {
        ...simpleMeasureFixture,
        createdBy: MEASURE_CREATEDBY,
        errors: [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES],
      };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("details-tab"));

      // this is to make form dirty so that run test button is enabled
      const tcTitle = await screen.findByTestId("test-case-title");
      userEvent.type(tcTitle, "testTitle");

      userEvent.click(screen.getByTestId("expectoractual-tab"));

      await waitFor(async () => {
        expect(
          await screen.findByRole("button", { name: "Run Test Case" })
        ).toBeDisabled();
      });
    });

    it("displays non-boolean results", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: { ...nonBoolTestCaseFixture, createdBy: MEASURE_CREATEDBY },
        });
      });
      mockedAxios.post.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("execution-bundles")) {
          return Promise.resolve({
            data: {
              testCases: [nonBoolTestCaseFixture],
              modifiedTestCaseIds: [nonBoolTestCaseFixture.id],
            },
          });
        }
        return Promise.resolve({
          data: {
            code: 200,
            message: null,
            successful: true,
            outcomeResponse: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "informational",
                  code: "processing",
                  diagnostics: "No issues!",
                },
              ],
            },
          },
        });
      });
      const measure = {
        ...multiGroupMeasureFixture,
        createdBy: MEASURE_CREATEDBY,
      };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      userEvent.click(screen.getByTestId("details-tab"));

      // this is to make form dirty so that run test button is enabled
      const tcTitle = await screen.findByTestId("test-case-title");
      userEvent.type(tcTitle, "testTitle");

      userEvent.click(screen.getByTestId("expectoractual-tab"));

      await waitFor(async () => {
        userEvent.click(
          await screen.findByRole("button", { name: "Run Test Case" })
        );
      });
      userEvent.click(screen.getByTestId("highlighting-tab"));
      expect(
        await screen.findByText("Population Criteria")
      ).toBeInTheDocument();

      userEvent.click(screen.getByTestId("expectoractual-tab"));
      expect(
        await screen.findByTestId("test-population-initialPopulation-actual")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("test-population-initialPopulation-expected")
      ).toHaveValue("2");
    });

    it("displays warning when test case execution is aborted for service error on test case JSON validation", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: { ...testCaseFixture, createdBy: MEASURE_CREATEDBY },
        });
      });
      const axiosError: AxiosError = {
        response: {
          status: 500,
          data: {},
        } as AxiosResponse,
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockedAxios.post.mockClear().mockRejectedValue(axiosError);
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      const editor = (await screen.getByTestId(
        "test-case-json-editor"
      )) as HTMLInputElement;
      await waitFor(() => expect(editor.value).not.toBe("Loading...")); // wait for load to complete as editor is read-only
      userEvent.clear(editor);
      await waitFor(() => expect(editor.value).toBe(""));
      userEvent.paste(
        editor,
        `{ "resourceType": "BAD", "type": "collection" }`
      );
      await waitFor(() => {
        expect(editor.value).toBeTruthy();
        expect(editor.value.trim().length > 0).toBeTruthy();
      });

      const runButton = await screen.findByRole("button", {
        name: "Run Test Case",
      });
      await waitFor(() => expect(runButton).not.toBeDisabled());
      userEvent.click(runButton);
      await waitFor(async () =>
        userEvent.click(screen.getByTestId("highlighting-tab"))
      );

      const alert = await screen.findByTestId("calculation-error-alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Test case execution was aborted because JSON could not be validated. If this error persists, please contact the help desk."
      );
    });

    it("displays error when test case execution is aborted due to errors validating test case JSON on new test case", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: [] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      mockedAxios.post.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("execution-bundles")) {
          return Promise.resolve({
            data: {
              testCases: [testCaseFixture],
              modifiedTestCaseIds: [testCaseFixture.id],
            },
          });
        }
        return Promise.resolve({
          data: {
            code: 200,
            message: null,
            successful: false,
            outcomeResponse: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  code: "processing",
                  diagnostics: "Major issue on line 1!",
                },
              ],
            },
          },
        });
      });
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      renderWithRouter(
        ["/measures/623cacebe74613783378c17b/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      const editor = (await screen.getByTestId(
        "test-case-json-editor"
      )) as HTMLInputElement;
      await waitFor(() => expect(editor.value).toEqual(""));
      userEvent.paste(editor, testCaseFixture.json);
      await waitFor(() => expect(editor.value).toBeTruthy());

      const runButton = await screen.findByRole("button", {
        name: "Run Test Case",
      });
      userEvent.click(runButton);
      await waitFor(async () =>
        userEvent.click(screen.getByTestId("highlighting-tab"))
      );
      const alert = await screen.findByTestId("calculation-error-alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Test case execution was aborted due to errors with the test case JSON."
      );
    });

    it("displays error when test case execution is aborted due to errors validating test case JSON on existing test case", async () => {
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: { ...testCaseFixture, createdBy: MEASURE_CREATEDBY },
        });
      });
      mockedAxios.post.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("execution-bundles")) {
          return Promise.resolve({
            data: {
              testCases: [testCaseFixture],
              modifiedTestCaseIds: [testCaseFixture.id],
            },
          });
        }
        return Promise.resolve({
          data: {
            code: 200,
            message: null,
            successful: false,
            outcomeResponse: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  code: "processing",
                  diagnostics: "Major issue on line 1!",
                },
              ],
            },
          },
        });
      });
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      const editor = (await screen.getByTestId(
        "test-case-json-editor"
      )) as HTMLInputElement;
      await waitFor(() => expect(editor.value).not.toBe("Loading...")); // wait for load to complete as editor is read-only
      userEvent.clear(editor);
      await waitFor(() => expect(editor.value).toBe(""));
      userEvent.paste(
        editor,
        `{ "resourceType": "BAD", "type": "collection" }`
      );
      await waitFor(() => {
        expect(editor.value).toBeTruthy();
        expect(editor.value.trim().length > 0).toBeTruthy();
      });

      const runButton = await screen.findByRole("button", {
        name: "Run Test Case",
      });
      await waitFor(() => expect(runButton).not.toBeDisabled());
      await waitFor(async () => userEvent.click(runButton));

      userEvent.click(screen.getByTestId("highlighting-tab"));
      const alert = await screen.findByTestId("calculation-error-alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent(
        "Test case execution was aborted due to errors with the test case JSON."
      );
    });

    it("disables button to run the test case when Measure CQL errors exist", async () => {
      // measure with cqlErrors flag
      const testCase = {
        id: "623cacffe74613783378c17c",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        json: '{ "resourceType": "Bundle", "type": "collection", "entry": [] }',
        groupPopulations: [],
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        hapiOperationOutcome: {} as HapiOperationOutcome,
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: testCase,
        });
      });
      const measure = { ...simpleMeasureFixture, cqlErrors: true };
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );
      const runButton = await screen.findByRole("button", {
        name: "Run Test Case",
      });
      expect(runButton).toBeDisabled();
    });

    it("displays existing validation errors when test case is executed irrespective of execution config setting", async () => {
      const validationOutcome = {
        code: 200,
        message: null,
        successful: false,
        outcomeResponse: {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "processing",
              diagnostics: "Major issue on line 1!",
            },
          ],
        },
      };
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["DENOM_Pass", "NUMER_Pass"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({
          data: {
            ...testCaseFixture,
            createdBy: MEASURE_CREATEDBY,
            hapiOperationOutcome: validationOutcome,
          },
        });
      });
      mockedAxios.post.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("execution-bundles")) {
          return Promise.resolve({
            data: {
              testCases: [testCaseFixture],
              modifiedTestCaseIds: [testCaseFixture.id],
            },
          });
        }
      });
      const measure = { ...simpleMeasureFixture, createdBy: MEASURE_CREATEDBY };
      measure.testCaseConfiguration.executeInvalidTestCases = true;
      renderWithRouter(
        [
          "/measures/623cacebe74613783378c17b/edit/test-cases/623cacffe74613783378c17c",
        ],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      const editor = screen.getByTestId(
        "test-case-json-editor"
      ) as HTMLInputElement;
      await waitFor(() => expect(editor.value).not.toBe("Loading...")); // wait for load to complete as editor is read-only

      const runButton = await screen.findByRole("button", {
        name: "Run Test Case",
      });
      await waitFor(() => userEvent.click(runButton));

      const sideButton = await screen.findByTestId(
        "show-json-validation-errors-button"
      );
      userEvent.click(sideButton);

      const validationErrorsList = await screen.findByTestId(
        "json-validation-errors-list"
      );
      expect(validationErrorsList).toHaveTextContent(
        validationOutcome.outcomeResponse.issue[0].diagnostics
      );
    });

    it("should render calculator button", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      expect(screen.getByTestId("test-case-json-editor")).toBeInTheDocument();
      expect(screen.getByTestId("test-case-cql-editor")).toBeInTheDocument();
      expect(
        screen.queryByTestId("editor-calculator-button")
      ).toBeInTheDocument();

      const calculatorButton = screen.getByTestId("editor-calculator-button");
      userEvent.click(calculatorButton);

      expect(screen.queryByTestId("calculation-dialog")).toBeInTheDocument();

      const closeButton = screen.getByTestId("calculation-close-button");
      userEvent.click(closeButton);
      await waitFor(() =>
        expect(
          screen.queryByTestId("calculation-dialog")
        ).not.toBeInTheDocument()
      );
    });

    it("should display tooltip with title error when title is cleared and form is dirty", async () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: '{ "resourceType": "Bundle", "type": "collection", "entry": [] }',
      } as TestCase;
      mockedAxios.get.mockClear().mockImplementation((args) => {
        if (args && args.endsWith("series")) {
          return Promise.resolve({ data: ["SeriesA"] });
        } else if (args && args.endsWith("resources")) {
          return Promise.resolve({
            data: [...resourceIdentifiers],
          });
        }
        return Promise.resolve({ data: { ...testCase } });
      });
      renderWithRouter(
        ["/measures/m1234/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id"
      );

      userEvent.click(screen.getByTestId("details-tab"));
      const tcTitle = await screen.findByTestId("test-case-title");
      expect(tcTitle).toBeInTheDocument();
      // Clear the title to trigger a validation error
      userEvent.clear(tcTitle);
      await waitFor(() => {
        expect(tcTitle).toHaveValue("");
      });
      // blur to trigger touched
      fireEvent.blur(tcTitle);

      const saveButton = await screen.findByRole("button", {
        name: "Save",
      });
      await waitFor(() => expect(saveButton).toBeDisabled());

      // Hover over the span wrapping the disabled save button to trigger tooltip
      fireEvent.mouseOver(saveButton.closest("span"));
      await waitFor(() => {
        expect(
          screen.getByText(/title: Test Case Title is required/)
        ).toBeInTheDocument();
      });
    });

    it("should display tooltip with description error when description exceeds max length", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      userEvent.click(screen.getByTestId("details-tab"));

      // First set a valid title so the title error does not appear
      await testTitle("ValidTitle");

      const descriptionInput = await screen.findByTestId(
        "test-case-description"
      );
      const longDescription = "a".repeat(251);
      fireEvent.change(descriptionInput, {
        target: { value: longDescription },
      });
      fireEvent.blur(descriptionInput);

      const saveButton = await screen.findByRole("button", {
        name: "Save",
      });
      await waitFor(() => expect(saveButton).toBeDisabled());

      fireEvent.mouseOver(saveButton.closest("span"));
      await waitFor(() => {
        expect(
          screen.getByText(
            /description: Test Case Description cannot be more than 250 characters/
          )
        ).toBeInTheDocument();
      });
    });

    it("should not display tooltip when form has no errors", async () => {
      renderWithRouter(
        ["/measures/m1234/edit/test-cases"],
        "/measures/:measureId/edit/test-cases"
      );

      mockedAxios.post.mockResolvedValue({
        data: {
          id: "testID",
          createdBy: MEASURE_CREATEDBY,
          description: "desc",
          title: "ValidTitle",
          hapiOperationOutcome: hapiOperationSuccessOutcome,
        },
      });

      userEvent.click(screen.getByTestId("details-tab"));
      await testTitle("ValidTitle");

      const saveButton = await screen.findByRole("button", {
        name: "Save",
      });
      await waitFor(() => expect(saveButton).not.toBeDisabled());

      // Hover over the button's wrapper span
      fireEvent.mouseOver(saveButton.closest("span"));
      // The tooltip should not show any error text
      await waitFor(() => {
        expect(screen.queryByText(/title:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/description:/)).not.toBeInTheDocument();
        expect(screen.queryByText(/series:/)).not.toBeInTheDocument();
      });
    });
  });

  describe("locking test case", () => {
    it("locking test case successfully", () => {
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.INVALID,
      } as unknown as TestCase;
      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
        testCases: [testCase],
      };
      renderWithRouter(
        ["/measures/623cacebe74613783378c17b/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      expect(mockedAxios.post).toBeCalled();
    });

    it("locking test case fails", () => {
      mockedAxios.post.mockImplementation((args) => {
        if (args && args.endsWith("lock")) {
          return Promise.reject({
            data: [
              {
                isLocked: false,
                locedBy: null,
              },
            ],
          });
        }
      });
      const testCase = {
        id: "1234",
        description: "Test IPP",
        series: "SeriesA",
        createdBy: MEASURE_CREATEDBY,
        createdAt: "",
        lastModifiedAt: "",
        lastModifiedBy: "null",
        title: "TestIPP",
        name: "TestIPP",
        executionStatus: "false",
        json: null,
        validationStatus: ValidationStatus.INVALID,
      } as unknown as TestCase;
      const measure = {
        ...defaultMeasure,
        model: Model.QICORE_6_0_0,
        testCases: [testCase],
      };
      renderWithRouter(
        ["/measures/623cacebe74613783378c17b/edit/test-cases/1234"],
        "/measures/:measureId/edit/test-cases/:id",
        measure
      );

      expect(mockedAxios.post).toBeCalled();
    });
  });
});

describe("isEmptyTestCaseJsonString", () => {
  it("should return true for null input", () => {
    expect(isEmptyTestCaseJsonString(null)).toBeTruthy();
  });

  it("should return true for undefined input", () => {
    expect(isEmptyTestCaseJsonString(undefined)).toBeTruthy();
  });

  it("should return true for empty string input", () => {
    expect(isEmptyTestCaseJsonString("")).toBeTruthy();
  });

  it("should return true for whitespace string input", () => {
    expect(isEmptyTestCaseJsonString("  ")).toBeTruthy();
  });

  it("should return true for empty json object string", () => {
    expect(isEmptyTestCaseJsonString("{}")).toBeTruthy();
  });

  it("should return true for invalid json string", () => {
    expect(isEmptyTestCaseJsonString("NOT_JSON")).toBeTruthy();
  });

  it("should return false for json object string with a field", () => {
    expect(isEmptyTestCaseJsonString(`{"field1":"value"}`)).toBeFalsy();
  });
});

describe("validator", () => {
  it("should provide error for bad boolean value", () => {
    const tc = {
      ...testCaseFixture,
      groupPopulations: [
        {
          group: "Group One",
          groupId: "1",
          scoring: MeasureScoring.PROPORTION,
          populationBasis: "boolean",
          populationValues: [
            {
              name: PopulationType.INITIAL_POPULATION,
              expected: "WRONG",
              actual: false,
            },
            {
              name: PopulationType.NUMERATOR,
              expected: false,
              actual: false,
            },
            {
              name: PopulationType.DENOMINATOR,
              expected: true,
              actual: false,
            },
          ],
        },
      ],
    };
    let expectedError: Error = null;
    try {
      TestCaseValidator.validateSync(tc);
      fail("Expected an error");
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).toBeTruthy();
    expect(expectedError.message).toEqual(
      "Expected value type must match population basis type"
    );
  });

  it("should provide error for non boolean populations when value is in decimal", () => {
    const tc = {
      ...testCaseFixture,
      groupPopulations: [
        {
          group: "Group One",
          groupId: "1",
          scoring: MeasureScoring.PROPORTION,
          populationBasis: "Encounter",
          populationValues: [
            {
              name: PopulationType.INITIAL_POPULATION,
              expected: "1.5",
              actual: false,
            },
            {
              name: PopulationType.NUMERATOR,
              expected: false,
              actual: false,
            },
            {
              name: PopulationType.DENOMINATOR,
              expected: true,
              actual: false,
            },
          ],
        },
      ],
    };
    let expectedError: Error = null;
    try {
      TestCaseValidator.validateSync(tc);
      fail("Expected an error");
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).toBeTruthy();
    expect(expectedError.message).toEqual(
      "Decimals values cannot be entered in the population expected values"
    );
  });

  it("should provide error for non boolean populations when the value is negative", () => {
    const tc = {
      ...testCaseFixture,
      groupPopulations: [
        {
          group: "Group One",
          groupId: "1",
          scoring: MeasureScoring.PROPORTION,
          populationBasis: "Encounter",
          populationValues: [
            {
              name: PopulationType.INITIAL_POPULATION,
              expected: "-1.5",
              actual: false,
            },
            {
              name: PopulationType.NUMERATOR,
              expected: false,
              actual: false,
            },
            {
              name: PopulationType.DENOMINATOR,
              expected: true,
              actual: false,
            },
          ],
        },
      ],
    };
    let expectedError: Error = null;
    try {
      TestCaseValidator.validateSync(tc);
      fail("Expected an error");
    } catch (error) {
      expectedError = error;
    }

    expect(expectedError).toBeTruthy();
    expect(expectedError.message).toEqual(
      "Only positive numeric values can be entered in the expected values"
    );
  });
});

describe("findEpisodeActualValue", () => {
  it("should return 0 if episode results is null", () => {
    const popValue: PopulationExpectedValue = {
      id: "abc",
      name: PopulationType.INITIAL_POPULATION,
      expected: 1,
    };
    const output = findEpisodeActualValue(null, popValue, "ipp");
    expect(output).toEqual(0);
  });

  it("should return 0 if episode results is undefined", () => {
    const popValue: PopulationExpectedValue = {
      id: "abc",
      name: PopulationType.INITIAL_POPULATION,
      expected: 1,
    };
    const output = findEpisodeActualValue(undefined, popValue, "ipp");
    expect(output).toEqual(0);
  });

  it("should return 0 if episode results is empty array", () => {
    const popValue: PopulationExpectedValue = {
      id: "abc",
      name: PopulationType.INITIAL_POPULATION,
      expected: 1,
    };
    const output = findEpisodeActualValue([], popValue, "ipp");
    expect(output).toEqual(0);
  });

  it("should return actual value for matching name and type IPP", () => {
    const popEpisodeResults: PopulationEpisodeResult[] = [
      {
        populationType: FqmPopulationType.IPP,
        define: "ipp",
        value: 2,
      },
    ];
    const measureGroupPop: Population = {
      id: "abc",
      name: PopulationType.INITIAL_POPULATION,
      definition: "ipp",
    };
    const popValue: PopulationExpectedValue = {
      id: "abc",
      name: PopulationType.INITIAL_POPULATION,
      expected: 1,
    };
    const output = findEpisodeActualValue(popEpisodeResults, popValue, "ipp");
    expect(output).toEqual(2);
  });

  it("should return actual value for matching name and type DENOM", () => {
    const popEpisodeResults: PopulationEpisodeResult[] = [
      {
        populationType: FqmPopulationType.IPP,
        define: "ipp",
        value: 2,
      },
      {
        populationType: FqmPopulationType.DENOM,
        define: "den",
        value: 1,
      },
    ];
    const popValue: PopulationExpectedValue = {
      id: "bbb",
      name: PopulationType.DENOMINATOR,
      expected: 1,
    };
    const output = findEpisodeActualValue(popEpisodeResults, popValue, "den");
    expect(output).toEqual(1);
  });

  it("should return zero value for matching type DENOM but missing definition", () => {
    const popEpisodeResults: PopulationEpisodeResult[] = [
      {
        populationType: FqmPopulationType.IPP,
        define: "ipp",
        value: 2,
      },
      {
        populationType: FqmPopulationType.DENOM,
        define: "den",
        value: 1,
      },
    ];
    const popValue: PopulationExpectedValue = {
      id: "bbb",
      name: PopulationType.INITIAL_POPULATION,
      expected: 1,
    };
    const output = findEpisodeActualValue(popEpisodeResults, popValue, "ipp2");
    expect(output).toEqual(0);
  });

  it("should return zero value for matching type DENOM but missing definition", () => {
    const popEpisodeResults: PopulationEpisodeResult[] = [
      {
        populationType: FqmPopulationType.IPP,
        define: "ipp",
        value: 2,
      },
      {
        populationType: FqmPopulationType.IPP,
        define: "ipp2",
        value: 3,
      },
      {
        populationType: FqmPopulationType.DENOM,
        define: "den",
        value: 1,
      },
    ];
    const popValue: PopulationExpectedValue = {
      id: "bbb",
      name: PopulationType.INITIAL_POPULATION,
      expected: 1,
    };
    const output = findEpisodeActualValue(popEpisodeResults, popValue, "ipp2");
    expect(output).toEqual(3);
  });
});

describe("Validation Panel", () => {
  it("Should open and close validation panel", async () => {
    const hapiOperationOutcome = {
      code: 200,
      message: null,
      successful: true,
      outcomeResponse: {
        resourceType: "OperationOutcome",
        text: undefined,
        issue: [
          {
            severity: "error",
            code: "error",
            diagnostics: "Test error",
            location: undefined,
          },
        ],
      },
    };
    const testCase = {
      id: "1234",
      description: "Test IPP",
      series: "SeriesA",
      createdBy: MEASURE_CREATEDBY,
      createdAt: "",
      lastModifiedAt: "",
      lastModifiedBy: "null",
      title: "TestIPP",
      name: "TestIPP",
      executionStatus: "false",
      json: null,
      validationStatus: ValidationStatus.INVALID,
      hapiOperationOutcome: hapiOperationOutcome,
    } as unknown as TestCase;
    mockedAxios.get.mockClear().mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: [] });
      } else if (args && args.endsWith("resources")) {
        return Promise.resolve({
          data: [...resourceIdentifiers],
        });
      }
      return Promise.resolve({
        data: testCase,
      });
    });
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id"
    );

    const showValidationErrorsButton = screen.getByTestId(
      "show-json-validation-errors-button"
    );
    userEvent.click(showValidationErrorsButton);
    expect(
      screen.getByTestId("json-validation-errors-list")
    ).toBeInTheDocument();

    const hideValidationErrorsButton = screen.getByTestId(
      "hide-json-validation-errors-button"
    );
    userEvent.click(hideValidationErrorsButton);

    expect(
      screen.queryByTestId("json-validation-errors-list")
    ).not.toBeInTheDocument();
  });
});

describe("EditTestCase QICore Component - Test Case Locked By Other User", () => {
  const testCase = {
    id: "1234",
    description: "Test IPP",
    series: "SeriesA",
    createdBy: MEASURE_CREATEDBY,
    createdAt: "",
    lastModifiedAt: "",
    lastModifiedBy: "null",
    title: "TestIPP",
    name: "TestIPP",
    executionStatus: "false",
    json: null,
    validationStatus: ValidationStatus.INVALID,
    testCaseLock: { lockedBy: "another.user" },
  } as unknown as TestCase;

  beforeEach(() => {
    (checkUserCanEdit as jest.Mock).mockClear().mockImplementation(() => {
      return true;
    });
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (args && args.endsWith("resources")) {
        return Promise.resolve({
          data: [
            {
              id: "qicore-adverseevent",
              type: "AdverseEvent",
              title: "QICore AdverseEvent",
              category: "Clinical.Summary",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
            },
            {
              id: "qicore-medicationstatement",
              type: "MedicationStatement",
              title: "QICore MedicationStatement",
              category: "Clinical.Medications",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-medicationstatement",
            },
            {
              id: "qicore-claim",
              type: "Claim",
              title: "QICore Claim",
              category: "Financial.Billing",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-claim",
            },
            {
              id: "qicore-procedure",
              type: "Procedure",
              title: "QICore Procedure",
              category: "Clinical.Summary",
              profile:
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
            },
          ],
        });
      }
      return Promise.resolve({ data: testCase });
    });
    mockedAxios.post.mockImplementation((args) => {
      if (args && args.endsWith("lock")) {
        return Promise.resolve({
          data: {
            isLocked: false,
            locedBy: MEASURE_CREATEDBY,
          },
        });
      }
    });
    mockedAxios.delete.mockImplementation((args) => {
      if (args && args.endsWith("lock")) {
        return Promise.resolve({
          data: {
            isLocked: false,
            locedBy: null,
          },
        });
      }
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("Should disable edit", async () => {
    const measure = {
      ...defaultMeasure,
      model: Model.QICORE_6_0_0,
      testCases: [testCase],
    };
    renderWithRouter(
      ["/measures/623cacebe74613783378c17b/edit/test-cases/1234"],
      "/measures/:measureId/edit/test-cases/:id",
      measure
    );

    const detailsTab = screen.getByRole("tab", { name: "Details tab panel" });
    act(() => {
      fireEvent.click(detailsTab);
    });
    await waitFor(() => {
      expect(detailsTab).toHaveAttribute("aria-selected", "true");
    });

    const tcTitle = document.getElementById("test-case-title");
    expect(tcTitle).toHaveValue(testCase.title);
    expect(tcTitle).toHaveAttribute("readonly");
  });
});

describe("Composite Measure Edit test case functionality", () => {
  const compositeMeasure = {
    ...defaultMeasure,
    measureMetaData: {
      ...defaultMeasure.measureMetaData,
      composite: true,
    },
  } as unknown as Measure;

  beforeEach(() => {
    (checkUserCanEdit as jest.Mock).mockClear().mockImplementation(() => {
      return true;
    });
    mockedAxios.post.mockImplementation((args) => {
      if (args && args.endsWith("lock")) {
        return Promise.resolve({
          data: {
            isLocked: false,
            lockedBy: MEASURE_CREATEDBY,
          },
        });
      }
    });
    mockedAxios.delete.mockImplementation((args) => {
      if (args && args.endsWith("lock")) {
        return Promise.resolve({
          data: {
            isLocked: false,
            lockedBy: null,
          },
        });
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render actual tab for composite measure and is active by default", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/tc123"],
      "/measures/:measureId/edit/test-cases/:id",
      compositeMeasure
    );

    await waitFor(() => {
      expect(screen.getByTestId("actual-tab")).toBeInTheDocument();
    });

    const actualTab = screen.getByTestId("actual-tab");
    expect(actualTab).toBeInTheDocument();
    expect(actualTab).toHaveTextContent("Actual");
    await waitFor(() => {
      expect(actualTab).toHaveAttribute("aria-selected", "true");
    });
    const actualContent = screen.getByText(
      "Composite actual results in progress..."
    );
    expect(actualContent).toBeInTheDocument();
  });

  it("should show details tab but not CQL and Highlighting tabs for composite measure", async () => {
    renderWithRouter(
      ["/measures/m1234/edit/test-cases/tc123"],
      "/measures/:measureId/edit/test-cases/:id",
      compositeMeasure
    );

    await waitFor(() => {
      expect(screen.getByTestId("actual-tab")).toBeInTheDocument();
    });

    // Details tab should be present
    expect(screen.getByTestId("details-tab")).toBeInTheDocument();
    // CQL and Highlighting tabs should not be present
    expect(screen.queryByTestId("measurecql-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("highlighting-tab")).not.toBeInTheDocument();
  });
});
