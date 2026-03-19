import * as React from "react";
import { render, screen } from "@testing-library/react";
import TestCaseLanding from "./TestCaseLanding";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import {
  GroupPopulation,
  Measure,
  MeasureScoring,
  Model,
  PopulationExpectedValue,
  TestCase,
  ValidationStatus,
} from "@madie/madie-models";
import { Bundle, ValueSet } from "fhir/r4";
import { ExecutionContextProvider } from "../../routes/qiCore/ExecutionContext";
// @ts-ignore
import { checkUserCanEdit } from "@madie/madie-util";
import useFhirDefinitionsServiceApi from "../../../api/useFhirDefinitionsService";

const serviceConfig = {
  measureService: {
    baseUrl: "measure.url",
  },
  terminologyService: {
    baseUrl: "http.com",
  },
  excelExportService: {
    baseUrl: "excelexport.com",
  },
} as ServiceConfig;

const MEASURE_CREATEDBY = "testuser";

const testCases = [
  {
    id: "1",
    description: "Test IPP",
    title: "WhenAllGood",
    series: "IPP_Pass",
    lastModifiedAt: "2024-09-10T09:56:14.382Z",
    validResource: true,
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: true,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
    validationStatus: ValidationStatus.VALID,
  },
  {
    id: "2",
    description: "Test IPP Fail when something is wrong",
    title: "WhenSomethingIsWrong",
    series: "IPP_Fail",
    lastModifiedAt: "2024-09-10T09:57:14.382Z",
    validResource: true,
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: false,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
    validationStatus: ValidationStatus.VALID,
  },
] as TestCase[];

const measure = {
  id: "m1234",
  createdBy: MEASURE_CREATEDBY,
  measurementPeriodStart: "2023-01-01",
  measurementPeriodEnd: "2023-12-31",
  model: Model.QICORE,
} as unknown as Measure;

const measureBundle = {} as Bundle;
const valueSets = [] as ValueSet[];
const setMeasure = jest.fn();
const setMeasureBundle = jest.fn();
const setValueSets = jest.fn();
const setExecuting = jest.fn();
const setError = jest.fn();

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  useFeatureFlags: jest.fn().mockImplementation(() => ({
    applyDefaults: false,
  })),
}));

jest.mock("../common/copyTestCases/CopyTestCaseDialog", () => ({
  __esModule: true,
  default: () => (
    <div data-testid="copy-test-case-dialog">Copy Test Case Dialog</div>
  ),
}));

jest.mock("../../../api/useFhirDefinitionsService");
const useFhirDefinitionsServiceMock = useFhirDefinitionsServiceApi as jest.Mock;

const fhirDefinitionsServiceMockResolved = {
  getTestCaseExecutionBundle: jest.fn().mockResolvedValue({
    testCases,
    modifiedTestCaseIds: testCases.map((tc) => tc.id),
  }),
} as unknown as ReturnType<typeof useFhirDefinitionsServiceApi>;

describe("TestCaseLanding component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  useFhirDefinitionsServiceMock.mockImplementation(() => {
    return fhirDefinitionsServiceMockResolved;
  });

  function renderTestCaseLandingComponent(measure: Measure) {
    return render(
      <MemoryRouter initialEntries={["/measures/m1234/edit/test-cases"]}>
        <ApiContextProvider value={serviceConfig}>
          <ExecutionContextProvider
            value={{
              measureState: [measure, setMeasure],
              bundleState: [measureBundle, setMeasureBundle],
              valueSetsState: [valueSets, setValueSets],
              executionContextReady: true,
              executing: false,
              setExecuting: setExecuting,
            }}
          >
            <Routes>
              <Route
                path="/measures/:measureId/edit/test-cases"
                element={<TestCaseLanding errors={[]} setErrors={setError} />}
              />
            </Routes>
          </ExecutionContextProvider>
        </ApiContextProvider>
      </MemoryRouter>
    );
  }

  it("should render the landing component with a button to create New Case", async () => {
    renderTestCaseLandingComponent(measure);

    const newTestCase = await screen.findByRole("button", {
      name: "New Case",
    });
    expect(newTestCase).toBeInTheDocument();
  });

  it("should render the landing component without create New Case button if user is not the owner of the measure", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => {
      return false;
    });
    const readOnlyMeasure = { ...measure, createdBy: "not me" };
    renderTestCaseLandingComponent(readOnlyMeasure);
    const newTestCase = await screen.queryByRole("button", {
      name: "New Case",
    });
    expect(newTestCase).not.toBeInTheDocument();
  });
});
