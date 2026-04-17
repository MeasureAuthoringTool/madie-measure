import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TestCaseRoutes from "./TestCaseRoutes";
import userEvent from "@testing-library/user-event";
import axios from "../../../../../../api/axios-instance";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import {
  MeasureErrorType,
  MeasureScoring,
  PopulationType,
} from "@madie/madie-models";
import { getExampleValueSet } from "../../../util/CalculationTestHelpers";
import { Bundle } from "fhir/r4";
import { act } from "react-dom/test-utils";
import NotFound from "../../notfound/NotFound";
// @ts-ignore
import { MeasureServiceApi } from "@madie/madie-util";

// mock the editor cause we don't care for this test and it gets rid of errors
jest.mock("../../editor/Editor", () => () => <div>editor contents</div>);

jest.mock("../../testCaseLanding/qiCore/TestCaseLanding", () => (props) => (
  <div data-testid="test-case-landing">Test Case Landing</div>
));
jest.mock("../../testCaseConfiguration/rav/RAVPage", () => () => (
  <div data-testid="rav-option-radio-buttons-group">Mock RAV Component</div>
));
jest.mock("../../../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const serviceConfig = {
  qdmElmTranslationService: { baseUrl: "qdm/translator" },
  fhirElmTranslationService: { baseUrl: "fhir/translator" },
  excelExportService: {
    baseUrl: "excelexport.com",
  },
  measureService: {
    baseUrl: "measure.url",
  },
  terminologyService: {
    baseUrl: "something.com",
  },
} as ServiceConfig;

const MEASURE_CREATEDBY = "testuser";
const measureBundle = {} as Bundle;
const valueSets = [getExampleValueSet()];
const mockMeasure = {
  id: "m1234",
  model: "QI-Core v4.1.1",
  cqlLibraryName: "CM527Library",
  measurementPeriodStart: "01/05/2022",
  measurementPeriodEnd: "03/07/2022",
  active: true,
  cqlErrors: false,
  errors: [],
  elmJson: "Fak3",
  groups: [
    {
      id: null,
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
        },
      ],
      groupDescription: "",
      measureGroupTypes: [],
      populationBasis: "boolean",
      scoringUnit: "",
    },
  ],
  createdBy: MEASURE_CREATEDBY,
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    updateTestCases: jest.fn().mockImplementation(() => {}),
    state: null,
    initialState: null,
    subscribe: (set) => {
      set(mockMeasure);
      return { unsubscribe: () => null };
    },
    unsubscribe: () => null,
  },
  useFeatureFlags: jest.fn().mockImplementation(() => ({
    applyDefaults: false,
  })),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => MEASURE_CREATEDBY,
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  routeHandlerStore: {
    subscribe: (set) => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));
const mockMeasureServiceApi: MeasureServiceApi = {
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  fetchMeasure: jest.fn(() => Promise.resolve(mockMeasure)),
  fetchMeasureBundle: jest.fn(),
  updateMeasure: jest.fn(),
  updateGroup: jest.fn(),
  deleteMeasureGroup: jest.fn(),
} as unknown as MeasureServiceApi;
describe("TestCaseRoutes", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockMeasure.errors = [];
    measureBundle.entry = undefined;
    (mockMeasure as any).measureMetaData = undefined;
    mockMeasure.cqlErrors = false;
    mockMeasure.elmJson = "Fak3";
    mockMeasure.groups = [
      {
        id: null,
        scoring: "Cohort",
        populations: [
          {
            id: "id-1",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population",
          },
        ],
        groupDescription: "",
        measureGroupTypes: [],
        populationBasis: "boolean",
        scoringUnit: "",
      },
    ];
  });

  it("should render the landing component first", async () => {
    const bundle = {
      id: "m1234",
      createdBy: "testuser",
      measureScoring: "Cohort",
      measurementPeriodStart: "2023-01-01",
      measurementPeriodEnd: "2023-12-31",
    };
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(bundle);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(mockMeasure);
    const testCase = {
      data: [
        {
          id: "id1",
          title: "TC1",
          description: "Desc1",
          series: "IPP_Pass",
          lastModifiedAt: "2024-09-10T09:19:14.382Z",
          status: null,
        },
      ],
    } as any;
    mockedAxios.get.mockImplementation((args) => {
      return Promise.resolve(testCase);
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    const testCaseTitle = await screen.getByTestId("test-case-landing-wrapper");
  });

  it("should show error message for CQL return type error on measure", async () => {
    mockMeasure.errors = [
      MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES,
    ];
    mockedAxios.get.mockImplementation((args) => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    const testCaseTitle = await screen.getByTestId("test-case-landing-wrapper");
    expect(testCaseTitle).toBeInTheDocument();
  });

  it("should not show CQL or population criteria errors for composite measures", async () => {
    (mockMeasure as any).measureMetaData = { composite: true };
    mockMeasure.cqlErrors = true;
    mockMeasure.elmJson = undefined;
    mockMeasure.groups = [];
    mockMeasure.errors = [];
    const bundle = {
      id: "m1234",
      createdBy: "testuser",
      measureScoring: "Cohort",
      measurementPeriodStart: "2023-01-01",
      measurementPeriodEnd: "2023-12-31",
    };
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(bundle);
    mockedAxios.get.mockImplementation((args) => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await screen.findByTestId("test-case-landing-wrapper");
    expect(
      screen.queryByText(
        "An error exists with the measure CQL, please review the CQL Editor tab."
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /No Population Criteria is associated with this measure/
      )
    ).not.toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasureBundle).toHaveBeenCalled();
  });

  it("should show CQL error when measure has cqlErrors", async () => {
    mockMeasure.cqlErrors = true;
    mockMeasure.errors = [];
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        "An error exists with the measure CQL, please review the CQL Editor tab."
      )
    ).toBeInTheDocument();
  });

  it("should show population criteria error when measure has no groups", async () => {
    mockMeasure.groups = [];
    mockMeasure.errors = [];
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        "No Population Criteria is associated with this measure. Please review the Population Criteria tab."
      )
    ).toBeInTheDocument();
  });

  it("should show SDE/RAV error for supplemental data mismatch", async () => {
    mockMeasure.errors = [MeasureErrorType.MISMATCH_CQL_SUPPLEMENTAL_DATA];
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    expect(
      await screen.findByText(
        /Supplemental Data Elements or Risk Adjustment Variables/
      )
    ).toBeInTheDocument();
  });

  it("should allow navigation to create test case dialog from landing page ", async () => {
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(measureBundle);
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (
        args &&
        args.startsWith(serviceConfig.measureService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            id: "m1234",
            createdBy: MEASURE_CREATEDBY,
            measureScoring: MeasureScoring.COHORT,
            measurementPeriodStart: "2023-01-01",
            measurementPeriodEnd: "2023-12-31",
          },
        });
      } else if (args && args.endsWith("test-cases")) {
        return Promise.resolve({
          data: [
            {
              id: "id1",
              title: "TC1",
              description: "Desc1",
              series: "IPP_Pass",
              lastModifiedAt: "2024-09-10T09:19:14.382Z",
              status: null,
            },
          ],
        });
      }
      return Promise.resolve({ data: null });
    });

    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          {" "}
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId("test-case-landing")).toBeInTheDocument();
  });

  it("should allow navigation to create test case dialog page, then back to landing page ", async () => {
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(measureBundle);
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (
        args &&
        args.startsWith(serviceConfig.measureService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            id: "m1234",
            createdBy: MEASURE_CREATEDBY,
            measureScoring: MeasureScoring.COHORT,
            measurementPeriodStart: "2023-01-01",
            measurementPeriodEnd: "2023-12-31",
          },
        });
      } else if (args && args.endsWith("test-cases")) {
        return Promise.resolve({
          data: [
            {
              id: "id1",
              title: "TC1",
              description: "Desc1",
              series: "IPP_Pass",
              lastModifiedAt: "2024-09-10T09:19:14.382Z",
              status: null,
            },
          ],
        });
      }
      return Promise.resolve({ data: null });
    });

    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          {" "}
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    const testCaseTitle = await screen.getByTestId("test-case-landing-wrapper");
  });

  it("should save test case successfully", async () => {
    jest.useFakeTimers("modern");
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (args && args.endsWith("test-cases")) {
        return Promise.resolve({
          data: [
            {
              id: "id1",
              title: "TC1",
              description: "Desc1",
              series: "IPP_Pass",
              lastModifiedAt: "2024-09-10T09:19:14.382Z",
              status: null,
            },
          ],
        });
      } else if (args?.endsWith("/bundle")) {
        return Promise.resolve({ data: measureBundle });
      } else if (args?.endsWith("/value-sets/searches")) {
        return Promise.resolve({ data: [valueSets] });
      }
    });

    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          {" "}
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    mockedAxios.post.mockResolvedValue({
      data: {
        id: "testID",
        title: "TC2",
        createdBy: MEASURE_CREATEDBY,
      },
    });

    expect(await screen.findByTestId("test-case-landing")).toBeInTheDocument();
  });

  it.skip("save test case failed", async () => {
    jest.useFakeTimers("modern");
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (args && args.endsWith("test-cases")) {
        return Promise.resolve({
          data: [
            {
              id: "id1",
              title: "TC1",
              description: "Desc1",
              series: "IPP_Pass",
              lastModifiedAt: "2024-09-10T09:19:14.382Z",
              status: null,
            },
          ],
        });
      } else if (args?.endsWith("/bundle")) {
        return Promise.resolve({ data: measureBundle });
      } else if (args?.endsWith("/value-sets/searches")) {
        return Promise.resolve({ data: [valueSets] });
      }
    });

    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          {" "}
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    mockedAxios.post.mockRejectedValue({
      data: {
        error: "error",
      },
    });

    const testCaseTitle = await screen.findByText("TC1");
    expect(testCaseTitle).toBeInTheDocument();
    const newBtn = screen.getByRole("button", { name: "New Case" });
    await act(async () => {
      userEvent.click(newBtn);
    });

    const createTestCaseDialog = await screen.findByTestId(
      "create-test-case-dialog"
    );
    expect(createTestCaseDialog).toBeInTheDocument();
    const testcaseTitle = await screen.findByTestId(
      "create-test-case-title-input"
    );
    expect(testcaseTitle).toBeInTheDocument();
    const testcaseDescription = await screen.findByTestId(
      "create-test-case-description"
    );
    expect(testcaseDescription).toBeInTheDocument();
    const testcaseSeries = await screen.findByTestId("test-case-series");
    expect(testcaseSeries).toBeInTheDocument();
    const saveButton = await screen.findByTestId(
      "create-test-case-save-button"
    );
    expect(saveButton).toBeInTheDocument();
    const cancelButton = await screen.findByTestId(
      "create-test-case-cancel-button"
    );
    expect(cancelButton).toBeInTheDocument();

    userEvent.type(testcaseTitle, "TC2");
    await waitFor(() => {
      expect(testcaseTitle).toHaveValue("TC2");
    });

    const createBtn = screen.getByRole("button", { name: "Save" });
    await act(async () => {
      userEvent.click(createBtn);
    });

    expect(await screen.findByTestId("server-error-alerts")).toBeTruthy();
    // findBy* queries shouldn't need to be wrapped in waitFor (they already are),
    // but if removed from the next line, the suite sill fail with the following errors:
    //   TypeError: Cannot read properties of null (reading 'createEvent')
    //   Jest worker encountered 4 child process exceptions, exceeding retry limit
    await waitFor(() => {
      expect(
        screen.findByText(
          "An error occurred while creating the test case: Unable to create new test case"
        )
      ).toBeTruthy();
    });
    expect(await screen.findByTestId("close-error-button")).toBeTruthy();
  });

  it.skip("should display duplicate test case name error", async () => {
    const errorMessage = "duplicate test case name";
    jest.useFakeTimers("modern");
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (args && args.endsWith("test-cases")) {
        return Promise.resolve({
          data: [
            {
              id: "id1",
              title: "TC1",
              description: "Desc1",
              lastModifiedAt: "2024-09-10T09:19:14.382Z",
              series: null,
              status: null,
            },
          ],
        });
      } else if (args?.endsWith("/bundle")) {
        return Promise.resolve({ data: measureBundle });
      } else if (args?.endsWith("/value-sets/searches")) {
        return Promise.resolve({ data: [valueSets] });
      }
    });

    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          {" "}
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    const testCaseTitle = await screen.findByText("TC1");
    expect(testCaseTitle).toBeInTheDocument();

    const newBtn = screen.getByRole("button", { name: "New Case" });
    // await act(async () => {
    userEvent.click(newBtn);
    // });
    const createTestCaseDialog = await screen.findByTestId(
      "create-test-case-dialog"
    );
    expect(createTestCaseDialog).toBeInTheDocument();

    const testcaseTitle = await screen.findByTestId(
      "create-test-case-title-input"
    );
    expect(testcaseTitle).toBeInTheDocument();

    userEvent.type(testcaseTitle, "TC1");
    await waitFor(() => {
      expect(testcaseTitle).toHaveValue("TC1");
    });

    mockedAxios.post.mockRejectedValue({
      response: {
        status: 400,
        data: {
          message: errorMessage,
        },
      },
    });

    const createBtn = screen.getByRole("button", { name: "Save" });
    await act(async () => {
      userEvent.click(createBtn);
    });

    expect(await screen.findByTestId("server-error-alerts")).toBeTruthy();
    expect(
      await screen.findByText(errorMessage, { exact: false })
    ).toBeTruthy();
  });

  it("should display value sets error", async () => {
    measureBundle.entry = [
      {
        resource: {
          resourceType: "Library",
          relatedArtifact: [
            {
              type: "depends-on",
              resource:
                "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1029.213",
            },
          ],
        } as any,
      },
    ];
    const bundle = {
      id: "m1234",
      createdBy: "testuser",
      measureScoring: "Cohort",
      measurementPeriodStart: "2023-01-01",
      measurementPeriodEnd: "2023-12-31",
    };
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(measureBundle);
    mockedAxios.get.mockImplementation((args) => {
      if (args?.endsWith("/bundle")) {
        return Promise.resolve({ data: measureBundle });
      } else if (args?.endsWith("/value-sets/searches")) {
        return Promise.reject(new Error("VALUE SET ERRORS"));
      }
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });

    mockedAxios.put.mockRejectedValue(new Error("VALUE SET ERRORS"));
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );
    expect(
      await screen.findByText(
        "An error occurred, please try again. If the error persists, please contact the help desk. (003)"
      )
    ).toBeInTheDocument();
  });

  it("Fetch measure bundle on Routes load", async () => {
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(measureBundle);
    mockedAxios.get.mockImplementation((args) => {
      if (args?.endsWith("/bundle")) {
        return Promise.resolve({ data: measureBundle });
      } else if (args?.endsWith("/value-sets/searches")) {
        return Promise.resolve({ data: [valueSets] });
      }
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            lastModifiedAt: "2024-09-10T09:19:14.382Z",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    const runAllTestsButton = await screen.getByTestId(
      "test-case-landing-wrapper"
    );
  });

  it.skip("should show error if failed to load measure bundle", async () => {
    mockedAxios.get.mockImplementation((args) => {
      if (args?.endsWith("/bundle")) {
        return Promise.reject({
          status: 500,
          data: "failure",
        });
      }
      return Promise.resolve({
        data: [],
      });
    });
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          {" "}
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    });
  });

  it("should render 404 page", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/measures/m1234/edit/invalid-url"]}>
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    expect(getByTestId("404-page")).toBeInTheDocument();
    expect(getByTestId("404-page-link")).toBeInTheDocument();
  });

  it.skip("should display error message when fetch test cases fails", async () => {
    mockedAxios.get.mockImplementation((args) => {
      if (args && args.endsWith("series")) {
        return Promise.resolve({ data: ["SeriesA"] });
      } else if (
        args &&
        args.startsWith(serviceConfig.measureService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            id: "m1234",
            createdBy: MEASURE_CREATEDBY,
            measureScoring: MeasureScoring.COHORT,
            measurementPeriodStart: "2023-01-01",
            measurementPeriodEnd: "2023-12-31",
          },
        });
      } else if (args && args.endsWith("test-cases")) {
        return Promise.reject({
          error: {
            message: "Unable to retrieve test cases, please try later",
          },
        });
      }
      return Promise.resolve({ data: null });
    });

    const { getByTestId } = render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const error = getByTestId("execution_context_loading_errors");
      expect(error).toBeInTheDocument();
    });
  });

  it("should render the RAVPage", async () => {
    const bundle = {
      id: "m1234",
      createdBy: "testuser",
      measureScoring: "Cohort",
      measurementPeriodStart: "2023-01-01",
      measurementPeriodEnd: "2023-12-31",
    };
    mockMeasureServiceApi.fetchMeasureBundle.mockResolvedValue(bundle);
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC12",
            description: "Desc1",
            series: "IPP_Pass",
            status: null,
          },
        ],
      });
    });
    const { unmount } = render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page/rav"]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/test-cases/*"
              element={<TestCaseRoutes />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );
    screen.debug();
    expect(
      screen.queryByTestId("rav-option-radio-buttons-group")
    ).toBeInTheDocument();
    unmount();
  });
});
