import * as React from "react";
import {
  act,
  fireEvent,
  getByRole,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import PopulationCriteriaWrapper from "./PopulationCriteriaWrapper";
// @ts-ignore
import { measureStore } from "@madie/madie-util";
import { QdmMeasureCQL } from "../../common/QdmMeasureCQL";
import { Measure, MeasureErrorType } from "@madie/madie-models";
import { ELM_JSON, MeasureCQL } from "../../common/MeasureCQL";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";

const serviceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  qdmElmTranslationService: {
    baseUrl: "test-qdm-elm-service",
  },
  fhirElmTranslationService: {
    baseUrl: "test-fhir-elm-service",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as ServiceConfig;

const qdmMeasure = {
  id: "testMeasureId",
  measureName: "the measure for testing",
  model: "QDM v5.6",
  baseConfigurationTypes: ["Outcome"],
  patientBasis: true,
  improvementNotation: "Increased score indicates improvement",
  improvementNotationDescription: "test improvementNotationDescription",
  rateAggregation: "test rateAggregation",
  supplementalData: [
    {
      definition: "Initial Population",
      description: "",
    },
  ],
  supplementalDataDescription: "test supplementalDataDescription",
  riskAdjustments: [
    {
      definition: "Initial Population",
      description: "",
    },
  ],
  riskAdjustmentDescription: "test riskAdjustmentDescription",
  groups: [
    {
      id: "testGroupId",
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: "initialPopulation",
          definition: "Initial Population",
        },
      ],
      groupDescription: "test description",
      measureGroupTypes: ["Outcome"],
      populationBasis: "boolean",
      scoringUnit: "",
    },
  ],
  cql: QdmMeasureCQL,
};

const QiCoreMeasure = {
  id: "testMeasureId",
  measureName: "the measure for testing",
  model: "QI-Core v4.1.1",
  scoring: "Cohort",
  baseConfigurationTypes: ["Outcome"],
  groups: [
    {
      id: "testGroupId",
      scoring: "Cohort",
      populations: [
        {
          id: "id-1",
          name: "initialPopulation",
          definition: "Initial Population",
        },
      ],
      groupDescription: "test description",
      measureGroupTypes: ["Outcome"],
      populationBasis: "boolean",
      scoringUnit: "",
    },
  ],
} as Measure;
let mockFeatureFlags = { Locking: false };

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: QiCoreMeasure,
    initialState: QiCoreMeasure,
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
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
  useFeatureFlags: () => mockFeatureFlags,
}));

jest.mock("../../../api/useMeasureServiceApi");
const useMeasuremeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const renderPopulationCriteriaHomeComponent = async (
  routePath: string,
  browserUrlPath: string
) => {
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: `/measures/testMeasureId/edit/${browserUrlPath}` },
      ]}
    >
      <ApiContextProvider value={serviceConfig}>
        <Routes>
          <Route
            path={`/measures/testMeasureId/edit/${routePath}`}
            element={<PopulationCriteriaWrapper />}
          />
        </Routes>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

const populationBasisValues: string[] = [
  "boolean",
  "Encounter",
  "Medication Administration",
  "test-data-1",
  "test-data-2",
];

let measureServiceApiMock: MeasureServiceApi;

describe("PopulationCriteriaHome", () => {
  const { findByTestId } = screen;

  beforeEach(() => {
    measureServiceApiMock = {
      getAllPopulationBasisOptions: jest
        .fn()
        .mockResolvedValue({ data: populationBasisValues }),
      getReturnTypesForAllCqlFunctions: jest
        .fn()
        .mockReturnValue({ fun: "Encounter" }),
      getReturnTypesForAllCqlDefinitions: jest.fn().mockReturnValue({
        patient: "NA",
        sdeEthnicity: "Coding",
        sdePayer: "NA",
        sdeRace: "Coding",
        sdeSex: "Code",
        vteProphylaxisByMedicationAdministeredOrDeviceApplied:
          "MedicationAdministration",
        boolIpp: "boolean",
      }),
      updateGroup: jest.fn().mockResolvedValue({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasuremeasureServiceApiMock.mockImplementation(
      () => measureServiceApiMock
    );

    QiCoreMeasure.cql = MeasureCQL;
  });

  it.skip("should render Measure Groups component with group from measure along with side nav", async () => {
    // needs to be fixed
    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );

    const baseConfigTab = await findByTestId(
      "leftPanelMeasureBaseConfigurationTab"
    );
    expect(baseConfigTab).toBeInTheDocument();
    const populationCriteriaTab = await findByTestId(
      "leftPanelMeasurePopulationCriteriaTab"
    );
    expect(populationCriteriaTab).toBeInTheDocument();

    //by default Criteria 1 should be selected and its associated form should be displayed
    const criteria1 = screen.getByRole("tab", {
      name: /Criteria 1/i,
    });
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("test description")).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-group-population-input")
    ).toHaveValue("Initial Population");

    expect(
      screen.getByRole("tab", {
        name: /supplemental data/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: /risk adjustment/i,
      })
    ).toBeInTheDocument();
  });

  it("should render Supplemental Data component", async () => {
    await renderPopulationCriteriaHomeComponent(
      "supplemental-data",
      "supplemental-data"
    );
    // verifies if the side nav is created
    expect(
      await screen.findByRole("button", {
        name: /Population Criteria/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: /Criteria 1/i,
      })
    ).toBeInTheDocument();
    const supplementalDataButton = screen.getByRole("tab", {
      name: /supplemental data/i,
    });
    // verifies if the SD component is loaded and the left nav link is active
    expect(supplementalDataButton).toHaveAttribute("aria-selected", "true");
  });

  it("should render Risk Adjustment component", async () => {
    await renderPopulationCriteriaHomeComponent(
      "risk-adjustment",
      "risk-adjustment"
    );
    // verifies if the side nav is created
    expect(
      await screen.findByRole("button", {
        name: /Population Criteria/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", {
        name: /Criteria 1/i,
      })
    ).toBeInTheDocument();
    const riskAdjustmentButton = screen.getByRole("tab", {
      name: /risk adjustment/i,
    });
    // verifies if the Risk Adjustment component is loaded and the left nav link is active
    expect(screen.getByTestId("risk-adjustment")).toBeInTheDocument();
    expect(riskAdjustmentButton).toHaveAttribute("aria-selected", "true");
  });

  it.skip("should render a new form for population criteria, onclick of Add Population Criteria link", async () => {
    // todo, fix
    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );
    const criteria1 = await findByTestId(
      "leftPanelMeasureInformation-MeasureGroup1"
    );
    expect(criteria1).toBeInTheDocument();
    expect(criteria1).toHaveAttribute("aria-selected", "true");

    const addPopulationCriteriaLink = screen.getByRole("link", {
      name: "Add Population Criteria",
    });
    act(() => {
      userEvent.click(addPopulationCriteriaLink);
    });

    // verify if a new criteria is created and is active
    const criteria2 = screen.getByRole("tab", {
      name: /Criteria 2/i,
    });
    expect(criteria2).toBeInTheDocument();
    expect(criteria2).toHaveAttribute("aria-selected", "true");

    expect(screen.getByRole("heading")).toHaveTextContent(
      "Population Criteria 2"
    );
    expect(screen.getByTestId("groupDescriptionInput")).toHaveTextContent(
      "test description"
    );
  });

  it("Should render a QI-Core specific page for QI-Core measures", async () => {
    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );
    await findByTestId("leftPanelMeasureInformation-MeasureGroup1");
    const QICorePage = await findByTestId("qi-core-groups");
    expect(QICorePage).toBeInTheDocument();
  });

  it("should display error if there are CQL errors in the measure", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...QiCoreMeasure, cqlErrors: true };

    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );
    await findByTestId("leftPanelMeasureInformation-MeasureGroup1");
    const QICorePage = await findByTestId("qi-core-groups");
    expect(QICorePage).toBeInTheDocument();

    const cqlHasErrorsMessage = screen.getByTestId(
      "error-alerts"
    ) as HTMLInputElement;
    expect(cqlHasErrorsMessage).toBeInTheDocument();
    expect(cqlHasErrorsMessage).toHaveTextContent(
      "Please complete the CQL Editor process before continuing"
    );
  });

  test("should display error for CQL return type mismatch on load", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = {
      ...QiCoreMeasure,
      errors: [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES],
    };

    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );
    await findByTestId("leftPanelMeasureInformation-MeasureGroup1");
    const QICorePage = await findByTestId("qi-core-groups");
    expect(QICorePage).toBeInTheDocument();

    const cqlHasErrorsMessage = screen.getByTestId(
      "error-alerts"
    ) as HTMLInputElement;
    expect(cqlHasErrorsMessage).toBeInTheDocument();
    expect(cqlHasErrorsMessage).toHaveTextContent(
      "One or more Population Criteria has a mismatch with CQL return types. Test Cases cannot be executed until this is resolved."
    );
  });

  test("should display error if server fails to update population group", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = QiCoreMeasure;

    measureServiceApiMock.updateGroup = jest.fn().mockRejectedValueOnce({
      status: 500,
      message: "Failed to update the group.",
    });

    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );

    await findByTestId("leftPanelMeasureInformation-MeasureGroup1");
    const QICorePage = await findByTestId("qi-core-groups");
    expect(QICorePage).toBeInTheDocument();

    // select Initial Population from dropdown
    const groupPopulationInput = screen.getByTestId(
      "select-measure-group-population-input"
    ) as HTMLInputElement;
    fireEvent.change(groupPopulationInput, {
      target: { value: "Initial Population" },
    });
    expect(groupPopulationInput.value).toBe("Initial Population");

    // select a measure group type
    const measureGroupTypeSelect = screen.getByTestId(
      "measure-group-type-dropdown"
    );
    userEvent.click(getByRole(measureGroupTypeSelect, "combobox"));
    await waitFor(() => {
      userEvent.click(screen.getByText("Patient Reported Outcome"));
    });

    userEvent.click(screen.getByTestId("reporting-tab"));

    const improvementNotationSelect = screen.getByTestId(
      "improvement-notation-select"
    ) as HTMLInputElement;

    userEvent.click(await getByRole(improvementNotationSelect, "combobox"));
    await waitFor(() => {
      userEvent.click(
        screen.getByText("Increased score indicates improvement")
      );
    });

    // submit the form
    await waitFor(() => {
      expect(screen.getByTestId("group-form-submit-btn")).toBeEnabled();
      userEvent.click(screen.getByTestId("group-form-submit-btn"));
    });

    const alert = await screen.findByTestId("error-alerts");
    expect(alert).toHaveTextContent("Failed to update the group.");
  });

  it("should not render Reporting component for non-QDM measures", () => {
    renderPopulationCriteriaHomeComponent("reporting", "reporting");
    // verifies if the side nav is created and Reportin is not available
    expect(
      screen.queryByRole("tab", {
        name: /Reporting/i,
      })
    ).toBeNull();
  });

  it("should not render base configuration component for non-QDM measures", () => {
    renderPopulationCriteriaHomeComponent(
      "base-configuration",
      "base-configuration"
    );
    // verifies if the side nav is created and base configuration is not available
    expect(
      screen.queryByRole("tab", {
        name: /Base Configuration/i,
      })
    ).toBeNull();
  });

  // tests for QDM measures, since this test case uses a mock which returns QDM measure
  it("should render Reporting component only for QDM measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    await renderPopulationCriteriaHomeComponent("reporting", "reporting");
    // verifies if the side nav is created and reporting tab is available
    const reportingTab = screen.getByRole("tab", {
      name: /Reporting/i,
    });
    expect(reportingTab).toBeInTheDocument();
    // verifies if the Reporting component is loaded and the left nav link is active
    expect(screen.getByText("Rate Aggregation")).toBeInTheDocument();
    expect(reportingTab).toHaveAttribute("aria-selected", "true");
  });

  it("should render base configuration component only for QDM measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    await renderPopulationCriteriaHomeComponent(
      "base-configuration",
      "base-configuration"
    );
    // verifies if the side nav is created and reporting tab is available
    const baseConfigurationTab = screen.getByRole("tab", {
      name: /Base Configuration/i,
    });
    expect(baseConfigurationTab).toBeInTheDocument();
    // verifies if the left nav link is active
    expect(baseConfigurationTab).toHaveAttribute("aria-selected", "true");
  });

  it("Should render a QDM specific page for QDM measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/1"
    );
    const QDMPage = await findByTestId("qdm-groups");
    expect(QDMPage).toBeInTheDocument();
  });

  it("should render the Empty Supplemental Data page for no measure", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = undefined;
    await renderPopulationCriteriaHomeComponent(
      "supplemental-data",
      "supplemental-data"
    );
    expect(
      screen.queryByRole("textbox", { name: "Description" })
    ).not.toBeInTheDocument();
    const allComboBoxes = screen.queryAllByRole("combobox");
    expect(allComboBoxes.length).toEqual(0);
  });

  it("should render the QDM Risk Adjustment page for QDM measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    await renderPopulationCriteriaHomeComponent(
      "risk-adjustment",
      "risk-adjustment"
    );
    expect(await screen.findByRole("textbox")).toBeInTheDocument();
    const allComboBoxes = screen.getAllByRole("combobox");
    expect(allComboBoxes.length).toEqual(1);

    userEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => {
      userEvent.click(screen.getByText("SDE Ethnicity"));
    });
    expect(
      screen.getByRole("button", { name: "SDE Ethnicity" })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("SDE Ethnicity - Include in Report Type")
    ).not.toBeInTheDocument();
  });

  it("should render the Empty Risk Adjustment page for no measure", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = undefined;
    await renderPopulationCriteriaHomeComponent(
      "risk-adjustment",
      "risk-adjustment"
    );
    expect(
      screen.queryByRole("textbox", { name: "Description" })
    ).not.toBeInTheDocument();
    const allComboBoxes = screen.queryAllByRole("combobox");
    expect(allComboBoxes.length).toEqual(0);
  });

  it("Should navigate to 404", async () => {
    await renderPopulationCriteriaHomeComponent(
      "groups/:groupNumber",
      "groups/0"
    );

    const populationCriteriaTab = await screen.queryByTestId(
      "leftPanelMeasurePopulationCriteriaTab"
    );
    expect(populationCriteriaTab).not.toBeInTheDocument();
  });

  it("test no supplemental data and risk adjustment", async () => {
    qdmMeasure.rateAggregation = undefined;
    qdmMeasure.supplementalData = [];
    qdmMeasure.supplementalDataDescription = undefined;
    qdmMeasure.riskAdjustments = [];
    qdmMeasure.riskAdjustmentDescription = undefined;
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    await renderPopulationCriteriaHomeComponent("reporting", "reporting");

    const reportingTab = screen.getByRole("tab", {
      name: /Reporting/i,
    });
    expect(reportingTab).toBeInTheDocument();

    expect(screen.getByText("Rate Aggregation")).toBeInTheDocument();
    expect(reportingTab).toHaveAttribute("aria-selected", "true");
  });

  it("should trigger lock, success", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockFeatureFlags = { Locking: true };
    mockedMeasureState.state = { ...QiCoreMeasure };

    const updateMeasureLock = jest.fn().mockResolvedValueOnce({
      harpId: "test-user",
      measureId: "testMeasureId",
      createdAt: "2025-08-05T12:00:00Z",
    });
    const unlockMeasure = jest.fn();

    useMeasuremeasureServiceApiMock.mockReturnValue({
      ...measureServiceApiMock,
      updateMeasureLock,
      unlockMeasure,
    });

    render(
      <MemoryRouter initialEntries={["/measures/testMeasureId/edit/groups/1"]}>
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/groups/:groupNumber"
              element={<PopulationCriteriaWrapper />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(updateMeasureLock).toHaveBeenCalledWith("testMeasureId");
    });
  });

  it("should trigger lock, fail", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...QiCoreMeasure };
    mockFeatureFlags = { Locking: true };

    const updateMeasureLock = jest.fn().mockRejectedValue("test");
    const unlockMeasure = jest.fn();

    useMeasuremeasureServiceApiMock.mockReturnValue({
      ...measureServiceApiMock,
      updateMeasureLock,
      unlockMeasure,
    });

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/measures/testMeasureId/edit/groups/1"]}>
        <ApiContextProvider value={serviceConfig}>
          <Routes>
            <Route
              path="/measures/:measureId/edit/groups/:groupNumber"
              element={<PopulationCriteriaWrapper />}
            />
          </Routes>
        </ApiContextProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(updateMeasureLock).toHaveBeenCalled();
    });

    // You can also assert that an error was thrown
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
