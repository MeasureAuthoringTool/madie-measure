import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TestCaseRoutes from "./TestCaseRoutes";
import axios from "../../../../../../api/axios-instance";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import { Model, PopulationType } from "@madie/madie-models";
import useCqmConversionService, {
  CqmConversionService,
} from "../../../api/CqmModelConversionService";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";

jest.mock("../../../../../../api/axios-instance");
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
const mockedAxios = axios as jest.Mocked<typeof axios>;
const serviceConfig = {
  measureService: {
    baseUrl: "measure.url",
  },
  terminologyService: {
    baseUrl: "something.com",
  },
  qdmElmTranslationService: {
    baseUrl: "qdm-elmTranslationService.com",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-elmTranslationService.com",
  },
  excelExportService: {
    baseUrl: "excelexport.com",
  },
} as ServiceConfig;

const MEASURE_CREATEDBY = "testuser";
const mockMeasure = {
  id: "m1234",
  model: Model.QDM_5_6,
  cqlLibraryName: "CM527Library",
  measurementPeriodStart: "01/05/2022",
  measurementPeriodEnd: "03/07/2022",
  active: true,
  cqlErrors: false,
  errors: ["error"],
  elmJson: "Fak3",
  groups: [
    {
      id: "63d953802ac2a77f7fec4e5b",
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
jest.mock("../../testCaseConfiguration/expansion/Expansion", () => () => (
  <div data-testid="mock-expansion-form">Mock Expansion Component</div>
));
jest.mock("../../testCaseConfiguration/rav/RAVPage", () => () => (
  <div data-testid="rav-option-radio-buttons-group">Mock RAV Component</div>
));
jest.mock("../../testCaseConfiguration/sde/SDEPage", () => () => (
  <div data-testid="sde-option-radio-buttons-group">Mock SDE Component</div>
));
jest.mock(
  "../../testCaseLanding/common/copyTestCases/CopyTestCaseDialog",
  () => () =>
    <div data-testid="copy-test-case-dialog">Mock Copy Test Case Dialog</div>
);
jest.mock("@madie/madie-util", () => ({
  // useMeasureServiceApi: jest.fn(() => ( {
  //   //fetchMeasureBundle: jest.fn().mockResolvedValue({}),
  // })) ,
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
  useFeatureFlags: jest.fn(() => ({
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
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

jest.mock("use-resize-observer", () => {
  return jest.requireActual("use-resize-observer/polyfilled");
});

jest.mock("../../../api/CqmModelConversionService");
const CQMConversionMock =
  useCqmConversionService as jest.Mock<CqmConversionService>;
const useCqmConversionServiceMockResolved = {
  convertToCqmMeasure: jest.fn().mockResolvedValue(mockMeasure),
} as unknown as CqmConversionService;

CQMConversionMock.mockImplementation(() => {
  return useCqmConversionServiceMockResolved;
});

describe("TestCaseRoutes", () => {
  beforeEach(() => {
    mockedAxios.put.mockResolvedValue({ data: {} });
    mockedAxios.delete.mockResolvedValue({ data: {} });
  });

  it("should render the test case list component", async () => {
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC12",
            description: "Desc1",
            series: "IPP_Pass",
            status: null,
            lastModifiedAt: "2024-09-10T08:40:14.382Z",
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

    const testCaseListTable = (await screen.findByTestId(
      "test-case-tbl"
    )) as HTMLTableElement;
    const tBody = testCaseListTable.tBodies.item(0);
    expect(tBody.rows.length).toBe(1);
    expect(tBody.rows.item(0).cells[2]).toHaveTextContent("Invalid");
    expect(tBody.rows.item(0).cells[3]).toHaveTextContent("IPP_Pass");
    expect(tBody.rows.item(0).cells[4]).toHaveTextContent("TC12");
    expect(tBody.rows.item(0).cells[5]).toHaveTextContent("Desc1");
    expect(tBody.rows.item(0).cells[6]).toHaveTextContent("09/10/2024");
    expect(
      within(tBody.rows.item(0).cells[7]).getByTestId(
        "view-edit-test-case-button-id1"
      )
    ).toBeInTheDocument();
  });

  it("should render the SDEPage", async () => {
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
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page/sde"]}
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
      screen.getByTestId("sde-option-radio-buttons-group")
    ).toBeInTheDocument();
  });

  it("should render the RAVPage", async () => {
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
    render(
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
    expect(
      screen.queryByTestId("rav-option-radio-buttons-group")
    ).toBeInTheDocument();
  });

  it("should render the Expansion Component", async () => {
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
    render(
      <MemoryRouter
        initialEntries={["/measures/m1234/edit/test-cases/list-page/expansion"]}
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
    expect(screen.getByTestId("mock-expansion-form")).toBeInTheDocument();
  });

  it("should render the Test case data Component", async () => {
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
    render(
      <MemoryRouter
        initialEntries={[
          "/measures/m1234/edit/test-cases/list-page/test-case-data",
        ]}
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
      await screen.findByTestId("test-case-data-form")
    ).toBeInTheDocument();
  });

  it("should render the Edit test case component", async () => {
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: [
          {
            id: "id1",
            title: "TC1",
            description: "Desc1",
            series: "IPP_Pass",
            status: null,
          },
        ],
      });
    });
    render(
      <MemoryRouter initialEntries={["/measures/m1234/edit/test-cases/m1234"]}>
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

    expect(screen.getByTestId("edit-test-case-form")).toBeInTheDocument();
  });

  it("test error convertToCqmMeasure", async () => {
    const useCqmConversionServiceMockRejected = {
      convertToCqmMeasure: jest.fn().mockRejectedValueOnce({
        error: {
          message: "error convert to qdm measure",
        },
      }),
    } as unknown as CqmConversionService;

    CQMConversionMock.mockImplementation(() => {
      return useCqmConversionServiceMockRejected;
    });
    render(
      <MemoryRouter initialEntries={["/measures/m1234/edit/test-cases/m1234"]}>
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

    const runTestCaseButton = screen.getByRole("button", {
      name: "Run Test",
    });
    expect(runTestCaseButton).toBeDisabled();
  });
});
