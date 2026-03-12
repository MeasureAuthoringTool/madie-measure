import * as React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import EditTestCase from "./EditTestCase";
import { testCaseFixture } from "../../createTestCase/__mocks__/testCaseFixture";
import { QDMPatientSchemaValidator } from "./QDMPatientSchemaValidator";
import {
  Measure,
  MeasureScoring,
  Model,
  PopulationType,
  TestCase,
  AggregateFunctionType,
} from "@madie/madie-models";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import axios from "../../../../../../api/axios-instance";
import { test } from "@jest/globals";
import { mockCqlWithAllCategoriesPresent } from "./mockCql";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import useTestCaseServiceApi, {
  TestCaseServiceApi,
} from "../../../api/useTestCaseServiceApi";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import useCqmConversionService from "../../../api/CqmModelConversionService";
import { QdmExecutionContextProvider } from "../../routes/qdm/QdmExecutionContext";
import { MadieError } from "../../../util/Utils";
import qdmCalculationService, {
  QdmCalculationService,
} from "../../../api/QdmCalculationService";
import useQdmCqlParsingService, {
  QdmCqlParsingService,
} from "../../../api/cqlElmTranslationService/useQdmCqlParsingService";
import { qdmCallStack } from "../groupCoverage/_mocks_/QdmCallStack";
// @ts-ignore
import testCaseJson from "../../../mockdata/qdm/cohort/testCasePatient.json";
import { demographicValueSets } from "../../../__mocks__/demographicValueSets";

const serviceConfig = {
  excelExportService: { baseUrl: "base.url" },
  fhirElmTranslationService: { baseUrl: "base.url" },
  qdmElmTranslationService: { baseUrl: "base.url" },
  measureService: { baseUrl: "base.url" },
  terminologyService: { baseUrl: "http.com" },
} as ServiceConfig;

const measureOwner = "testUser";

const testCase: TestCase = {
  id: "testid",
  title: "Test Case",
  series: "test series",
  description: "test description",
  createdBy: measureOwner,
  validResource: true,
  groupPopulations: [
    {
      groupId: "test_groupId",
      scoring: MeasureScoring.COHORT,
      populationBasis: "true",
      populationValues: [
        {
          id: "4f0a1989-205f-45df-a476-8e19999d21c7",
          name: PopulationType.INITIAL_POPULATION,
          expected: true,
        },
      ],
      stratificationValues: [],
    },
  ],
} as unknown as TestCase;

const mockMeasure = {
  id: "testmeasureid",
  measureName: "test measure",
  scoring: MeasureScoring.COHORT,
  model: Model.QDM_5_6,
  createdBy: "testUserOwner",
  patientBasis: true,
  cql: mockCqlWithAllCategoriesPresent,
  groups: [
    {
      id: "test_groupId",
      scoring: MeasureScoring.COHORT,
      populations: [
        {
          id: "4f0a1989-205f-45df-a476-8e19999d21c7",
          name: PopulationType.INITIAL_POPULATION,
          definition: "IP",
        },
      ],
      populationBasis: "true",
      stratifications: [
        {
          cqlDefinition: "Initial Population",
          description: "",
          id: "strat-1",
        },
      ],
      measureObservations: [
        {
          aggregateMethod: AggregateFunctionType.AVERAGE,
          criteriaReference: "id-2",
          definition: "test",
          description: "",
          id: "observ-1",
        },
      ],
    },
  ],
} as Measure;

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

const lockInfo = {
  isLocked: false,
  locedBy: null,
};

jest.mock("../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({
    measureId: "testmeasureid",
    id: "testid",
  }),
  useNavigate: () => mockNavigate,
}));
// mocking cqm api
jest.mock("../../../api/CqmModelConversionService");
const CQMConversionMock =
  useCqmConversionService as unknown as jest.Mock<TestCaseServiceApi>;
const useCqmConversionServiceMockResolved = {
  fetchRelevantDataElements: jest.fn().mockResolvedValue([
    {
      qdmCategory: "symptom",
      _type: "",
      qdmStatus: "Encounter",
      description: "Allergy/Intolerance: Observation Services",
    },
    {
      _type: "QDM::AllergyIntolerance",
      qdmCategory: "allergy",
      qdmStatus: "Encounter",
      description: "Allergy/Intolerance: Observation Services",
    },
    {
      _type: "QDM::EncounterPerformed",
      qdmCategory: "device",
      qdmStatus: "Encounter",
      description: "Allergy/Intolerance: Observation Services",
    },
  ]),
} as unknown as TestCaseServiceApi;

jest.mock("../../../api/useTestCaseServiceApi");
const useTestCaseServiceMock =
  useTestCaseServiceApi as jest.Mock<TestCaseServiceApi>;
const useTestCaseServiceMockResolved = {
  getTestCase: jest.fn().mockResolvedValue(testCase),
  getTestCaseSeriesForMeasure: jest
    .fn()
    .mockResolvedValue(["Series 1", "Series 2"]),
  updateTestCase: jest.fn().mockResolvedValue(testCase),
  lockTestCase: jest.fn().mockResolvedValue(lockInfo),
  unlockTestCase: jest.fn().mockResolvedValue(lockInfo),
} as unknown as TestCaseServiceApi;

const useTestCaseServiceMockRejectedGetTestCase = {
  getTestCase: jest.fn().mockRejectedValue("404"),
  lockTestCase: jest.fn().mockRejectedValue(lockInfo),
} as unknown as TestCaseServiceApi;

const useTestCaseServiceMockRejected = {
  getTestCase: jest.fn().mockResolvedValue(testCase),
  getTestCaseSeriesForMeasure: jest
    .fn()
    .mockResolvedValue(["Series 1", "Series 2"]),
  updateTestCase: jest
    .fn()
    .mockRejectedValueOnce(
      new MadieError("Reason for test case update failure")
    ),
  lockTestCase: jest.fn().mockRejectedValueOnce(lockInfo),
  unlockTestCase: jest.fn().mockResolvedValue(lockInfo),
} as unknown as TestCaseServiceApi;
const useTestCaseServiceMockRejected423 = {
  getTestCase: jest.fn().mockResolvedValue(testCase),
  getTestCaseSeriesForMeasure: jest
    .fn()
    .mockResolvedValue(["Series 1", "Series 2"]),
  updateTestCase: jest
    .fn()
    .mockRejectedValueOnce(
      new MadieError(
        "Unable to update Test Case. Test Case is locked by: anotherUser"
      )
    ),
  lockTestCase: jest.fn().mockRejectedValueOnce(lockInfo),
  unlockTestCase: jest.fn().mockResolvedValue(lockInfo),
} as unknown as TestCaseServiceApi;
const nonUniqNameData: MadieError = new MadieError("Error Msg");

const useTestCaseServiceMockRejectedNonUniqueName = {
  getTestCase: jest.fn().mockResolvedValue(testCase),
  getTestCaseSeriesForMeasure: jest
    .fn()
    .mockResolvedValue(["Series 1", "Series 2"]),
  updateTestCase: jest.fn().mockRejectedValueOnce(nonUniqNameData),
  lockTestCase: jest.fn().mockResolvedValueOnce(lockInfo),
} as unknown as TestCaseServiceApi;
let mockApplyDefaults = false;
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

jest.mock("../../../api/QdmCalculationService");
const qdmCalculationServiceMock =
  qdmCalculationService as jest.Mock<QdmCalculationService>;

const qdmExecutionResults = {
  // patient with id "1"
  testid: {
    // group / population set with id "1"
    test_groupId: {
      IPP: 1,
      episodeResults: {},
    },
  },
};

jest.mock("../../../api/cqlElmTranslationService/useQdmCqlParsingService");
const useCqlParsingServiceMock =
  useQdmCqlParsingService as jest.Mock<QdmCqlParsingService>;

const useCqlParsingServiceMockResolved = {
  getAllDefinitionsAndFunctions: jest.fn().mockResolvedValue(qdmCallStack),
  getDefinitionCallstacks: jest.fn().mockResolvedValue(qdmCallStack),
} as unknown as QdmCqlParsingService;

const mockProcessTestCaseResults = jest.fn().mockImplementation(() => {
  return {
    ...testCase,
    groupPopulations: [
      {
        groupId: "test_groupId",
        scoring: MeasureScoring.COHORT,
        populationBasis: "true",
        populationValues: [
          {
            id: "4f0a1989-205f-45df-a476-8e19999d21c7",
            name: PopulationType.INITIAL_POPULATION,
            expected: true,
            actual: true,
          },
        ],
        stratificationValues: [],
      },
    ],
  };
});

const qdmCalculationServiceMockResolved = {
  calculateQdmTestCases: jest.fn().mockResolvedValue(qdmExecutionResults),
  processTestCaseResults: mockProcessTestCaseResults,
  qdmFakeFunction: jest.fn(),
} as unknown as QdmCalculationService;

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useFeatureFlags: jest.fn(() => {
    return {
      applyDefaults: mockApplyDefaults,
      qdmHideJson: false,
    };
  }),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => mockMeasure),
    initialState: null,
    subscribe: (set) => {
      set(mockMeasure);
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
}));

const { findByTestId, findByText, queryByTestId, queryByText } = screen;
const measure = mockMeasure;
const setMeasure = jest.fn();
const setCqmMeasure = jest.fn;
const setExecutionContextReady = jest.fn;
const cqmMeasure = {
  source_data_criteria: [
    { qdmStatus: "race", codeListId: "2.16.840.1.114222.4.11.836" },
    { qdmStatus: "ethnicity", codeListId: "2.16.840.1.114222.4.11.837" },
    { qdmStatus: "gender", codeListId: "2.16.840.1.113762.1.4.1021.121" },
  ],
  value_sets: demographicValueSets,
};

const renderEditTestCaseComponent = () => {
  return render(
    <MemoryRouter>
      <ApiContextProvider value={serviceConfig}>
        <QdmExecutionContextProvider
          value={{
            measureState: [measure, setMeasure],
            cqmMeasureState: [cqmMeasure, setCqmMeasure],
            executionContextReady: true,
            setExecutionContextReady: setExecutionContextReady,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <EditTestCase />
        </QdmExecutionContextProvider>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

describe("ElementsTab", () => {
  useTestCaseServiceMock.mockImplementation(() => {
    return useTestCaseServiceMockResolved;
  });
  useCqlParsingServiceMock.mockImplementation(() => {
    return useCqlParsingServiceMockResolved;
  });
  CQMConversionMock.mockImplementation(() => {
    return useCqmConversionServiceMockResolved;
  });

  test("Icons present and navigate correctly.", async () => {
    await waitFor(() => renderEditTestCaseComponent());
    const json = await findByText("JSON");
    // const elements = await findByText("Elements"); // this doesn't work?
    const elements = await findByTestId("json-tab");

    act(() => {
      fireEvent.click(elements);
    });
    await waitFor(() => {
      expect(elements).toHaveAttribute("aria-selected", "true");
    });

    act(() => {
      fireEvent.click(json);
    });
    await waitFor(() => {
      expect(json).toHaveAttribute("aria-selected", "true");
    });
  });

  test("JSON tab is disabled with feature flag qdmHideJson being true", async () => {
    CQMConversionMock.mockImplementation(() => {
      return useCqmConversionServiceMockResolved;
    });
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => {
      return {
        qdmHideJson: true,
      };
    });
    await waitFor(() => renderEditTestCaseComponent());
    const json = queryByText("JSON");
    const elements = queryByTestId("json-tab");
    expect(json).not.toBeInTheDocument();
    expect(elements).not.toBeInTheDocument();
  });
});

test("LeftPanel navigation works as expected.", async () => {
  CQMConversionMock.mockImplementation(() => {
    return useCqmConversionServiceMockResolved;
  });
  useCqlParsingServiceMock.mockImplementation(() => {
    return useCqlParsingServiceMockResolved;
  });
  await waitFor(() => renderEditTestCaseComponent());
  const symptom = await findByTestId("elements-tab-symptom");
  await waitFor(() => {
    expect(symptom).toBeInTheDocument();
  });

  const allergy = await findByText("Allergy");
  await waitFor(() => {
    expect(allergy).toBeInTheDocument();
  });
  // elements-tab-allergy

  const device = await findByText("Device");
  await waitFor(() => {
    expect(device).toBeInTheDocument();
  });
  expect(allergy).toHaveAttribute("aria-selected", "true");
  act(() => {
    fireEvent.click(device);
  });
  await waitFor(() => {
    expect(device).toHaveAttribute("aria-selected", "true");
  });
});

test("Calculator button is found", async () => {
  CQMConversionMock.mockImplementation(() => {
    return useCqmConversionServiceMockResolved;
  });
  useCqlParsingServiceMock.mockImplementation(() => {
    return useCqlParsingServiceMockResolved;
  });
  await waitFor(() => renderEditTestCaseComponent());
  expect(screen.queryByTestId("editor-calculator-button")).toBeInTheDocument();

  const calculatorButton = screen.getByTestId("editor-calculator-button");
  userEvent.click(calculatorButton);

  expect(screen.queryByTestId("calculation-dialog")).toBeInTheDocument();

  const closeButton = screen.getByTestId("calculation-close-button");
  userEvent.click(closeButton);
  await waitFor(() =>
    expect(screen.queryByTestId("calculation-dialog")).not.toBeInTheDocument()
  );
});

describe("EditTestCase QDM Component", () => {
  const { getByRole, findByTestId, findByText } = screen;

  beforeEach(() => {
    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockResolved;
    });
    qdmCalculationServiceMock.mockImplementation(() => {
      return qdmCalculationServiceMockResolved;
    });
    CQMConversionMock.mockImplementation(() => {
      return useCqmConversionServiceMockResolved;
    });
    useCqlParsingServiceMock.mockImplementation(() => {
      return useCqlParsingServiceMockResolved;
    });
  });

  it("should run qdm test case", async () => {
    await waitFor(() => renderEditTestCaseComponent());
    const runTestCaseButton = getByRole("button", {
      name: "Run Test",
    });
    expect(runTestCaseButton).toBeInTheDocument();

    expect(runTestCaseButton).not.toBeDisabled();
    expect(getByRole("button", { name: "Save" })).toBeDisabled();
    expect(getByRole("button", { name: "Discard Changes" })).toBeDisabled();

    userEvent.click(runTestCaseButton);

    userEvent.click(getByRole("tab", { name: "Expected or Actual tab panel" }));
    expect(
      await screen.findByText("Measure Group 1", {}, { timeout: 3000 })
    ).toBeInTheDocument();

    const actualResult = await screen.findByTestId(
      "test-population-initialPopulation-actual"
    ); // it has no name
    await waitFor(() => expect(actualResult).toBeChecked());
  });

  it("should see that the JSON changed", async () => {
    await waitFor(() => renderEditTestCaseComponent());
    const runTestCaseButton = getByRole("button", {
      name: "Run Test",
    });
    expect(runTestCaseButton).toBeInTheDocument();
    expect(getByRole("button", { name: "Save" })).toBeDisabled();
    expect(getByRole("button", { name: "Discard Changes" })).toBeDisabled();
    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    userEvent.click(raceSelector);
    const raceOptions = await screen.findAllByRole("option");
    expect(raceOptions.length).toBe(4);
    userEvent.click(raceOptions[2]);
    expect(raceSelector).toHaveTextContent("Asian");
    expect(getByRole("button", { name: "Save" })).not.toBeDisabled();
    expect(getByRole("button", { name: "Discard Changes" })).not.toBeDisabled();
    expect(runTestCaseButton).not.toBeDisabled();
    userEvent.click(runTestCaseButton);
  });

  it("should render qdm edit test case component along with action buttons", async () => {
    await waitFor(() => renderEditTestCaseComponent());
    const runTestCaseButton = getByRole("button", {
      name: "Run Test",
    });
    expect(runTestCaseButton).toBeInTheDocument();

    expect(getByRole("button", { name: "Save" })).toBeDisabled();
    expect(getByRole("button", { name: "Discard Changes" })).toBeDisabled();
  });

  it("should render group populations from DB", async () => {
    await waitFor(() => renderEditTestCaseComponent());

    const expectedActualTab = getByRole("tab", {
      name: "Expected or Actual tab panel",
    });
    userEvent.click(expectedActualTab);
    const ipCheckbox = (await findByTestId(
      "test-population-initialPopulation-expected"
    )) as HTMLInputElement;
    await waitFor(() => expect(ipCheckbox).toBeChecked());
  });

  it("should throw 404 when fetching a test case that doesn't exists in DB", async () => {
    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockRejectedGetTestCase;
    });

    await waitFor(() => renderEditTestCaseComponent());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it("should render group populations from DB and able to update the values and save test case", async () => {
    // line breaks in JSON cause Formik to think JSON has changed so use stringify to get rid of those
    testCase.json = JSON.stringify(testCaseJson);
    mockedAxios.put.mockResolvedValueOnce(testCase);
    renderEditTestCaseComponent();

    const saveButton = getByRole("button", { name: "Save" });
    const expectedActualTab = getByRole("tab", {
      name: "Expected or Actual tab panel",
    });
    userEvent.click(expectedActualTab);
    const ipCheckbox = (await findByTestId(
      "test-population-initialPopulation-expected"
    )) as HTMLInputElement;
    await waitFor(() => expect(ipCheckbox).toBeChecked());

    userEvent.click(ipCheckbox);
    await waitFor(() => expect(ipCheckbox).not.toBeChecked());

    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    await waitFor(
      () => {
        expect(screen.getByTestId("success-toast")).toHaveTextContent(
          "Test Case Updated Successfully"
        );
      },
      { timeout: 1500 }
    );
  });

  it("should render qdm edit Demographics component with default values", async () => {
    await renderEditTestCaseComponent();

    const raceInput = screen.getByTestId(
      "demographics-race-input"
    ) as HTMLInputElement;
    expect(raceInput).toBeInTheDocument();
    expect(raceInput.value).toBe("");
    const genderInput = screen.getByTestId(
      "demographics-gender-input"
    ) as HTMLInputElement;
    expect(genderInput).toBeInTheDocument();
    expect(genderInput.value).toBe("");
    const livingStatusInput = screen.getByTestId(
      "demographics-living-status-input"
    ) as HTMLInputElement;
    expect(livingStatusInput).toBeInTheDocument();
    expect(livingStatusInput.value).toBe("Living");
  });

  it("should render qdm edit Demographics component with values from TestCase JSON", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    await renderEditTestCaseComponent();

    const raceInput = screen.getByTestId(
      "demographics-race-input"
    ) as HTMLInputElement;
    expect(raceInput).toBeInTheDocument();
    await waitFor(() => {
      expect(raceInput.value).toBe("Asian");
    });
    const genderInput = screen.getByTestId(
      "demographics-gender-input"
    ) as HTMLInputElement;
    expect(genderInput).toBeInTheDocument();
    expect(genderInput.value).toBe("Male (finding)");
    const livingStatusInput = screen.getByTestId(
      "demographics-living-status-input"
    ) as HTMLInputElement;
    expect(livingStatusInput).toBeInTheDocument();
    expect(livingStatusInput.value).toBe("Living");
  });

  it("discard button resets form if form changed", async () => {
    testCase.json = "";
    renderEditTestCaseComponent();

    // Race dropdown change
    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    expect(raceSelector).toHaveTextContent("Select a Race");

    userEvent.click(raceSelector);
    const raceOptions = await screen.findAllByRole("option");
    expect(raceOptions.length).toBe(4);
    userEvent.click(raceOptions[3]);
    await waitFor(() => {
      expect(raceSelector).toHaveTextContent("White");
    });

    // Gender dropdown change
    const genderSelector = screen.getByRole("combobox", { name: "Sex" });
    expect(genderSelector).toHaveTextContent("Select a Gender");

    userEvent.click(genderSelector);
    const genderOptions = await screen.findAllByRole("option");
    expect(genderOptions.length).toBe(3);
    userEvent.click(genderOptions[2]);
    await waitFor(() => {
      expect(genderSelector).toHaveTextContent("Male (finding)");
    });

    // Ethnicity dropdown change
    const ethnicitySelector = screen.getByRole("combobox", {
      name: "Ethnicity",
    });
    expect(ethnicitySelector).toHaveTextContent("Select an Ethnicity");

    userEvent.click(ethnicitySelector);
    const ethnicityOptions = await screen.findAllByRole("option");
    expect(ethnicityOptions.length).toBe(3);
    userEvent.click(ethnicityOptions[1]);
    await waitFor(() => {
      expect(ethnicitySelector).toHaveTextContent("Hispanic or Latino");
    });

    // Living Status dropdown change
    const livingStatusSelector = screen.getByRole("combobox", {
      name: "Living Status",
    });
    expect(livingStatusSelector).toHaveTextContent("Living");
    userEvent.click(livingStatusSelector);
    const livingStatusOptions = await screen.findAllByRole("option");
    expect(livingStatusOptions.length).toBe(2);
    userEvent.click(livingStatusOptions[1]);
    await waitFor(() => {
      expect(livingStatusSelector).toHaveTextContent("Expired");
    });

    // Wait for form state to update before clicking discard
    await waitFor(() => {
      const discardButton = screen.getByTestId("ds-btn");
      expect(discardButton).not.toBeDisabled();
    });

    // Discard button
    const discardButton = screen.getByTestId("ds-btn");
    expect(discardButton).toBeInTheDocument();
    userEvent.click(discardButton);

    const discardConfirm = screen.getByTestId("discard-dialog-continue-button");
    expect(discardConfirm).toBeInTheDocument();
    expect(discardConfirm).not.toBeDisabled();
    userEvent.click(discardConfirm);

    // Verify values reset to initial state
    await waitFor(() =>
      expect(raceSelector).toHaveTextContent("Select a Race")
    );
    expect(genderSelector).toHaveTextContent("Select a Gender");
    expect(ethnicitySelector).toHaveTextContent("Select an Ethnicity");
    expect(livingStatusSelector).toHaveTextContent("Living");
  }, 45000);

  it("test update test case successfully with success toast", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockResolved;
    });

    await waitFor(() => renderEditTestCaseComponent());

    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    expect(raceSelector).toHaveTextContent("Asian");
    userEvent.click(raceSelector);
    const raceOptions = await screen.findAllByRole("option");
    expect(raceOptions.length).toBe(4);
    userEvent.click(raceOptions[3]);
    expect(raceSelector).toHaveTextContent("White");

    const genderSelector = screen.getByRole("combobox", { name: "Sex" });
    expect(genderSelector).toBeInTheDocument();
    userEvent.click(genderSelector);
    const genderOptions = await screen.findAllByRole("option");
    expect(genderOptions.length).toBe(3);
    userEvent.click(genderOptions[2]);
    expect(genderSelector).toHaveTextContent("Male (finding)");

    const livingStatusSelector = screen.getByRole("combobox", {
      name: "Living Status",
    });
    expect(livingStatusSelector).toHaveTextContent("Living");
    userEvent.click(livingStatusSelector);
    const livingStatusOptions = await screen.findAllByRole("option");
    userEvent.click(livingStatusOptions[1]);
    expect(livingStatusSelector).toHaveTextContent("Expired");

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeEnabled();
    userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("success-toast")).toHaveTextContent(
        "Test Case Updated Successfully"
      );
    });
  });

  it("test update test case fails with non-unique test name failure toast", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockRejectedNonUniqueName;
    });
    await renderEditTestCaseComponent();
    const saveTestCaseButton = screen.getByRole("button", {
      name: "Save",
    });

    expect(saveTestCaseButton).toBeInTheDocument();
    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    userEvent.click(raceSelector);
    expect(raceSelector).toHaveTextContent("Asian");
    const raceOptions = await screen.findAllByRole("option");
    userEvent.click(raceOptions[3]);
    expect(raceSelector).toHaveTextContent("White");

    expect(saveTestCaseButton).toBeEnabled();
    userEvent.click(saveTestCaseButton);

    await waitFor(
      () => {
        expect(screen.getByTestId("error-toast")).toHaveTextContent(
          'Error updating Test Case "test measure": Error Msg'
        );
        const closeToastBtn = screen.getByTestId("close-toast-button");
        userEvent.click(closeToastBtn);
        expect(
          screen.queryByText("Error updating Test Case")
        ).not.toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it("test update test case fails with failure toast", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockRejected;
    });
    await renderEditTestCaseComponent();
    const saveTestCaseButton = screen.getByRole("button", {
      name: "Save",
    });

    expect(saveTestCaseButton).toBeInTheDocument();
    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    expect(raceSelector).toHaveTextContent("Select a Race");
    // change the race
    userEvent.click(raceSelector);
    const raceOptions = await screen.findAllByRole("option");
    expect(raceOptions.length).toBe(4);
    userEvent.click(raceOptions[3]);
    expect(raceSelector).toHaveTextContent("White");

    expect(saveTestCaseButton).toBeEnabled();
    userEvent.click(saveTestCaseButton);

    await waitFor(
      () => {
        expect(screen.getByTestId("error-toast")).toHaveTextContent(
          'Error updating Test Case "test measure": Reason for test case update failure'
        );
        const closeToastBtn = screen.getByTestId("close-toast-button");
        userEvent.click(closeToastBtn);
        expect(
          screen.queryByText("Error updating Test Case")
        ).not.toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it("test update test case fails with failure toast for test case locked", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockRejected423;
    });
    await renderEditTestCaseComponent();
    const saveTestCaseButton = screen.getByRole("button", {
      name: "Save",
    });

    expect(saveTestCaseButton).toBeInTheDocument();
    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    expect(raceSelector).toHaveTextContent("Select a Race");
    // change the race
    userEvent.click(raceSelector);
    const raceOptions = await screen.findAllByRole("option");
    expect(raceOptions.length).toBe(4);
    userEvent.click(raceOptions[3]);
    expect(raceSelector).toHaveTextContent("White");

    expect(saveTestCaseButton).toBeEnabled();
    userEvent.click(saveTestCaseButton);

    await waitFor(
      () => {
        expect(screen.getByTestId("error-toast")).toHaveTextContent(
          "Unable to update Test Case. Test Case is locked by: anotherUser"
        );
        const closeToastBtn = screen.getByTestId("close-toast-button");
        userEvent.click(closeToastBtn);
        expect(
          screen.queryByText(
            "Unable to update Test Case. Test Case is locked by: anotherUser"
          )
        ).not.toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it("RightPanel navigation works as expected.", async () => {
    renderEditTestCaseComponent();
    const highlighting = await findByText("Highlighting");
    const measureCql = await findByText("CQL");
    const expectedActual = await findByText("Expected / Actual");
    const details = await findByText("Details");

    act(() => {
      fireEvent.click(highlighting);
    });
    await waitFor(() => {
      expect(highlighting).toHaveAttribute("aria-selected", "true");
    });

    act(() => {
      fireEvent.click(expectedActual);
    });
    await waitFor(() => {
      expect(expectedActual).toHaveAttribute("aria-selected", "true");
    });

    act(() => {
      fireEvent.click(measureCql);
    });
    await waitFor(() => {
      expect(measureCql).toHaveAttribute("aria-selected", "true");
    });

    act(() => {
      fireEvent.click(details);
    });
    await waitFor(() => {
      expect(details).toHaveAttribute("aria-selected", "true");
    });
  });

  it("Should render the details tab with relevant information", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    await waitFor(() => renderEditTestCaseComponent());

    const detailsTab = getByRole("tab", { name: "Details tab panel" });
    act(() => {
      fireEvent.click(detailsTab);
    });
    await waitFor(() => {
      expect(detailsTab).toHaveAttribute("aria-selected", "true");
    });
    // check title is as expected
    const tcTitle = await screen.findByTestId("test-case-title");
    expect(tcTitle).toHaveValue(testCase.title);

    const descriptionInput = screen.getByTestId("test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);

    const seriesInput = screen
      .getByTestId("test-case-series")
      .querySelector("input");
    expect(seriesInput).toHaveValue("test series");

    act(() => {
      userEvent.click(seriesInput);
    });
    const list = await screen.findByRole("listbox");
    expect(list).toBeInTheDocument();
    const listItems = within(list).getAllByRole("option");
    expect(listItems[1]).toHaveTextContent("Series 2");
    act(() => {
      userEvent.click(listItems[1]);
    });

    await testTitle("newtesttitle1", true);
    await waitFor(() => {
      const descriptionInput = screen.getByTestId("test-case-description");
      userEvent.type(descriptionInput, "testtestsetse");
    });

    await waitFor(() => {
      const saveButton = getByRole("button", { name: "Save" });
      expect(saveButton).toBeEnabled();
    });
    const saveButton = getByRole("button", { name: "Save" });
    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("success-toast")).toHaveTextContent(
        "Test Case Updated Successfully"
      );
    });
  });

  it("Should not update test case because of special characters", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    await waitFor(() => renderEditTestCaseComponent());

    const detailsTab = getByRole("tab", { name: "Details tab panel" });
    act(() => {
      fireEvent.click(detailsTab);
    });
    await waitFor(() => {
      expect(detailsTab).toHaveAttribute("aria-selected", "true");
    });
    // check title is as expected
    const tcTitle = await screen.findByTestId("test-case-title");
    expect(tcTitle).toHaveValue(testCase.title);

    const descriptionInput = screen.getByTestId("test-case-description");
    expect(descriptionInput).toHaveTextContent(testCase.description);

    const seriesInput = screen
      .getByTestId("test-case-series")
      .querySelector("input") as HTMLInputElement;
    expect(seriesInput).toHaveValue("test series");

    act(() => {
      userEvent.click(seriesInput);
    });
    const list = await screen.findByRole("listbox");
    expect(list).toBeInTheDocument();
    const listItems = within(list).getAllByRole("option");
    expect(listItems[1]).toHaveTextContent("Series 2");
    act(() => {
      userEvent.click(listItems[1]);
    });

    await testTitle("newtesttitle1 with special characters $ % ^", true);
    await waitFor(() => {
      const descriptionInput = screen.getByTestId("test-case-description");
      userEvent.type(descriptionInput, "testtestsetse");
    });

    await waitFor(() => {
      const saveButton = getByRole("button", { name: "Save" });
      expect(saveButton).toBeEnabled();
    });
    const saveButton = getByRole("button", { name: "Save" });
    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error-toast")).toHaveTextContent(
        "Test Case Title can not contain special characters"
      );
    });
  });

  it("should display tooltip with title error when title is cleared and form is dirty", async () => {
    testCase.json = JSON.stringify(testCaseJson);
    await waitFor(() => renderEditTestCaseComponent());

    const detailsTab = getByRole("tab", { name: "Details tab panel" });
    act(() => {
      fireEvent.click(detailsTab);
    });
    await waitFor(() => {
      expect(detailsTab).toHaveAttribute("aria-selected", "true");
    });

    const tcTitle = await screen.findByTestId("test-case-title");
    expect(tcTitle).toHaveValue(testCase.title);

    // Clear the title to trigger validation error
    userEvent.clear(tcTitle);
    await waitFor(() => {
      expect(tcTitle).toHaveValue("");
    });
    fireEvent.blur(tcTitle);

    const saveButton = getByRole("button", { name: "Save" });
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
    testCase.json = JSON.stringify(testCaseJson);
    await waitFor(() => renderEditTestCaseComponent());

    const detailsTab = getByRole("tab", { name: "Details tab panel" });
    act(() => {
      fireEvent.click(detailsTab);
    });
    await waitFor(() => {
      expect(detailsTab).toHaveAttribute("aria-selected", "true");
    });

    const descriptionInput = screen.getByTestId("test-case-description");
    const longDescription = "a".repeat(251);
    fireEvent.change(descriptionInput, {
      target: { value: longDescription },
    });
    fireEvent.blur(descriptionInput);

    const saveButton = getByRole("button", { name: "Save" });
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
    testCase.json = JSON.stringify(testCaseJson);
    await waitFor(() => renderEditTestCaseComponent());

    // Make a change to enable the Save button (change race dropdown)
    const raceSelector = screen.getByRole("combobox", { name: "Race" });
    userEvent.click(raceSelector);
    const raceOptions = await screen.findAllByRole("option");
    userEvent.click(raceOptions[3]);
    expect(raceSelector).toHaveTextContent("White");

    const saveButton = getByRole("button", { name: "Save" });
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

  describe("validator", () => {
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
        QDMPatientSchemaValidator.validateSync(tc);
        fail("Expected an error");
      } catch (error) {
        expectedError = error;
      }

      expect(expectedError).toBeTruthy();
      expect(expectedError.message).toEqual(
        "Decimals values cannot be entered in the population expected values"
      );
    });

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
        QDMPatientSchemaValidator.validateSync(tc);
        fail("Expected an error");
      } catch (error) {
        expectedError = error;
      }

      expect(expectedError).toBeTruthy();
      expect(expectedError.message).toEqual(
        "Expected value type must match population basis type"
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
        QDMPatientSchemaValidator.validateSync(tc);
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
});

describe("EditTestCase QDM Component when test case is locked by another user", () => {
  const { getByRole } = screen;

  beforeEach(() => {
    const lockedTestCase = { ...testCase, testCaseLock: "another.user" };
    const useTestCaseServiceMockResolved = {
      getTestCase: jest.fn().mockResolvedValue(lockedTestCase),
      getTestCaseSeriesForMeasure: jest
        .fn()
        .mockResolvedValue(["Series 1", "Series 2"]),
      lockTestCase: jest.fn().mockResolvedValue(lockInfo),
      unlockTestCase: jest.fn().mockResolvedValue(lockInfo),
    } as unknown as TestCaseServiceApi;

    useTestCaseServiceMock.mockImplementation(() => {
      return useTestCaseServiceMockResolved;
    });
  });

  it("should disable edit when test case is locked by another user", async () => {
    await waitFor(() => renderEditTestCaseComponent());

    const detailsTab = getByRole("tab", { name: "Details tab panel" });
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
