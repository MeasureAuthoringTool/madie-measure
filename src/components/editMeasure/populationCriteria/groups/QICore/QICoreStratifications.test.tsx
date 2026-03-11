import * as React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import MeasureGroups, { MeasureGroupProps } from "./QICoreMeasureGroups";
import {
  Group,
  GroupScoring,
  Measure,
  PopulationType,
} from "@madie/madie-models";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../api/ServiceContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ELM_JSON, MeasureCQL } from "../../../../common/MeasureCQL";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { measureStore, MeasureServiceApi } from "@madie/madie-util";
import { getEmptyStrat } from "./QICoreStratifications";

global.scrollTo = jest.fn();

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.setTimeout(40000);

const serviceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  qdmElmTranslationService: {
    baseUrl: "qdm-test-elm-service",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-test-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as ServiceConfig;

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
const populationBasisValues: string[] = [
  "boolean",
  "Encounter",
  "Medication Administration",
  "test-data-1",
  "test-data-2",
];
const outerScopeMeasure: Measure = {
  id: "test-measure",
  measureName: "the measure for testing",
  cql: MeasureCQL,
  elmJson: ELM_JSON,
  createdBy: MEASURE_CREATEDBY,
} as Measure;
const outerScopeGroup: Group = {
  id: "df675##7p03-5r29-7O0I",
  scoring: "Cohort",
  populations: [
    {
      id: "id-1",
      name: PopulationType.INITIAL_POPULATION,
      definition: "Initial Population",
      description: "",
    },
  ],
  groupDescription: "",
  measureGroupTypes: [],
  populationBasis: "boolean",
  scoringUnit: "",
  scoringPrecision: "",
} as unknown as Group;
const mockMeasureServiceApi: MeasureServiceApi = {
  updateMeasure: jest.fn(),
  updateGroup: jest.fn().mockResolvedValue(outerScopeGroup),
  createGroup: jest.fn().mockResolvedValue(outerScopeGroup),
  fetchMeasure: jest.fn().mockResolvedValue(outerScopeMeasure),
  deleteMeasureGroup: jest.fn().mockResolvedValue(outerScopeMeasure),
  unlockMeasure: jest.fn(),
  updateMeasureLock: jest.fn(),
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  getAllPopulationBasisOptions: jest
    .fn()
    .mockResolvedValue(populationBasisValues),
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useFeatureFlags: jest.fn(() => ({})),
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const props: MeasureGroupProps = {
  measureGroupNumber: 0,
  setMeasureGroupNumber: jest.fn,
  setIsFormDirty: jest.fn,
  measureId: "testMeasureId",
  setAlertMessage: jest.fn,
  checkTestCasesLockStatus: jest.fn().mockResolvedValue(false),
  isTestCaseLocked: true,
  measureCanEdit: false,
};
const customProps: MeasureGroupProps = {
  ...props,
  isTestCaseLocked: false,
  measureCanEdit: true,
};

describe("QICoreStratifications", () => {
  let measure: Measure;
  let group: Group;

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    measure = {
      id: "test-measure",
      measureName: "the measure for testing",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      measureMetaData: { composite: false },
    } as Measure;
    measureStore.state.mockImplementationOnce(() => measure);
    group = {
      id: null,
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "Initial Population",
          description: "",
        },
      ],
      groupDescription: "",
      measureGroupTypes: [],
      populationBasis: "boolean",
      scoringUnit: "",
      scoringPrecision: "",
    };

    const mockUuid = require("uuid") as { v4: jest.Mock<string, []> };
    mockUuid.v4
      .mockReset()
      .mockImplementationOnce(() => "uuid-1")
      .mockImplementationOnce(() => "uuid-2")
      .mockImplementationOnce(() => "uuid-3")
      .mockImplementationOnce(() => "uuid-4")
      .mockImplementationOnce(() => "uuid-5")
      .mockImplementationOnce(() => "uuid-6")
      .mockImplementationOnce(() => "uuid-7")
      .mockImplementationOnce(() => "uuid-8")
      .mockImplementationOnce(() => "uuid-9");
  });

  const renderMeasureGroupComponent = (customPropsOverride = customProps) => {
    const mergedProps = { ...props, ...customPropsOverride };
    return render(
      <MemoryRouter
        initialEntries={[{ pathname: "/measures/test-measure/edit/groups/1" }]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/test-measure/edit/groups/:groupNumber"
              element={<MeasureGroups {...mergedProps} />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );
  };

  test("Stratifications cannot be save when cql definition is not provided", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      {
        cqlDefinition: "",
        description: "description",
        association: undefined,
        id: "id-1",
      },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent(customProps);
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const helperText = await screen.findByText("CQL Definition is required.");
    expect(helperText).toBeInTheDocument();
  });

  test("Stratifications Should Not Have Remove Button if there are only two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent(customProps);
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.queryByTestId("remove-strat-button");
    await waitFor(() => expect(removeButton).not.toBeInTheDocument());
  });

  test("Stratifications should have remove button if there are more than two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
      { ...getEmptyStrat(), id: "id-3" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent(customProps);
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.getAllByTestId("remove-strat-button")[0];
    await waitFor(() => expect(removeButton).toBeInTheDocument());
  });

  test("Stratifications should no longer have remove button the stratifications are reduced to two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
      { ...getEmptyStrat(), id: "id-3" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent(customProps);
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.getAllByTestId("remove-strat-button")[0];
    expect(removeButton).toBeInTheDocument();
    userEvent.click(removeButton);
    const removeButton2 = screen.queryByTestId("remove-strat-button");
    await waitFor(() => expect(removeButton2).not.toBeInTheDocument());
  });

  test("Stratifications should show add button if total increased to >2", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent(customProps);
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = queryByTestId("remove-strat-button");
    expect(removeButton).not.toBeInTheDocument();
    const addButton = queryByTestId("add-strat-button");
    userEvent.click(addButton);
    const removeButton2 = screen.getAllByTestId("remove-strat-button")[0];
    await waitFor(() => expect(removeButton2).toBeInTheDocument());
  });

  test("If stratification is empty, auto populate two empty stratifications", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.rateAggregation = "Rate Aggregation Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [];
    measure.groups = [group];
    renderMeasureGroupComponent(customProps);
    userEvent.click(screen.getByTestId("stratifications-tab"));
    await waitFor(() => {
      expect(group.stratifications.length == 2);
    });
    expect(group.stratifications[0]).toEqual({
      ...getEmptyStrat(),
      id: "uuid-3",
      association: null,
    });
  });

  //TODO Fix skip GAK MAT-9176
  test.skip("Stratification definitions return type validation to match population basis", async () => {
    group.id = "7p03-5r29-7O0I";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    const errorMessage =
      "The selected definition does not align with the Population Basis field selection of boolean";
    renderMeasureGroupComponent(customProps);
    // switch to stratification tab
    userEvent.click(screen.getByTestId("stratifications-tab"));
    // select Initial population from dropdown for strat 1
    const strat1 = screen.getByTestId(
      "stratification-1-input"
    ) as HTMLInputElement;
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(strat1, {
      target: { value: "Initial Population" },
    });
    expect(screen.queryByText(errorMessage)).toBeNull();
  });
});
