import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import MeasureGroups, { MeasureGroupProps } from "./QDMMeasureGroups";
import {
  Group,
  GroupScoring,
  Measure,
  MeasureScoring,
  PopulationType,
  Model,
} from "@madie/madie-models";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../api/ServiceContext";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ELM_JSON, MeasureCQL } from "../../../../common/MeasureCQL";
import userEvent from "@testing-library/user-event";
import { measureStore, MeasureServiceApi } from "@madie/madie-util";

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
    baseUrl: "test-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as ServiceConfig;

const getEmptyStrat = () => ({
  cqlDefinition: "",
  description: "",
  association: null,
  id: "",
});

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec

const mockMeasureServiceApi = {
  getReturnTypesForAllCqlFunctions: jest.fn(),
  getReturnTypesForAllCqlDefinitions: jest.fn(),
  fetchMeasure: jest.fn(),
  updateMeasure: jest.fn(),
  updateGroup: jest.fn(),
  deleteMeasureGroup: jest.fn(),
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
  isTestCaseLocked: false,
  checkTestCasesLockStatus: jest.fn(),
};

const renderMeasureGroupComponent = (customProps = props) => {
  const mergedProps = { ...props, ...customProps };
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: "/measures/test-measure/edit/groups/1" }]}
    >
      <ApiContextProvider value={serviceConfig}>
        <Routes>
          <Route
            path="/measures/test-measure/edit/groups/:groupNumber"
            element={<MeasureGroups {...mergedProps} measureCanEdit={true} />}
          />
        </Routes>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

describe("QDMStratifications", () => {
  let measure: Measure;
  let group: Group;

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  beforeEach(() => {
    measure = {
      id: "test-measure",
      measureName: "Bthe measure for testing",
      cql: MeasureCQL,
      elmJson: ELM_JSON,
      createdBy: MEASURE_CREATEDBY,
      scoring: GroupScoring.COHORT,
      groups: [{ groupDescription: "Bthe group for testing" }],
      baseConfigurationTypes: ["Outcome", "Patient Reported Outcome"],
      patientBasis: true,
      model: Model.QDM_5_6,
    } as Measure;
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
    };

    measureStore.state.mockImplementationOnce(() => measure);

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

    mockMeasureServiceApi.getReturnTypesForAllCqlFunctions = jest
      .fn()
      .mockReturnValue({ fun: "Encounter" });
    mockMeasureServiceApi.getReturnTypesForAllCqlDefinitions = jest
      .fn()
      .mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicationAdministration",
      });
    mockMeasureServiceApi.fetchMeasure = jest.fn().mockResolvedValue(measure);
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.updateGroup = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });
    mockMeasureServiceApi.deleteMeasureGroup = jest.fn().mockResolvedValue({});
  });

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
    renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const helperText = await screen.findByText("CQL Definition is required.");
    expect(helperText).toBeInTheDocument();
  });

  test("Stratifications Should Not Have Remove Button if there are only two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();
    userEvent.click(screen.getByTestId("stratifications-tab"));
    const removeButton = screen.queryByTestId("remove-strat-button");
    await waitFor(() => expect(removeButton).not.toBeInTheDocument());
  });

  test("Stratifications should have remove button if there are more than two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
      { ...getEmptyStrat(), id: "id-3" },
      { ...getEmptyStrat(), id: "id-4" },
      { ...getEmptyStrat(), id: "id-5" },
      { ...getEmptyStrat(), id: "id-6" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();
    expect(screen.getByTestId("stratifications-tab")).toBeInTheDocument();
    act(() => {
      userEvent.click(screen.getByTestId("stratifications-tab"));
    });
    const removeButton = screen.getAllByTestId("remove-strat-button")[0];
    await waitFor(() => expect(removeButton).toBeInTheDocument());
  }, 10000);

  test("Stratifications should no longer have remove button the stratifications are reduced to two", async () => {
    group.id = "7p03-5r29-7O0I";
    group.groupDescription = "Description Text";
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
      { ...getEmptyStrat(), id: "id-3" },
    ];
    measure.groups = [group];
    renderMeasureGroupComponent();
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
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [
      { ...getEmptyStrat(), id: "id-1" },
      { ...getEmptyStrat(), id: "id-2" },
    ];
    measure.groups = [group];
    const { queryByTestId } = renderMeasureGroupComponent();
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
    group.improvementNotation = "Increased score indicates improvement";
    group.stratifications = [];
    measure.groups = [group];
    renderMeasureGroupComponent();
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
});
