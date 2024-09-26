import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import PopulationCriteriaWrapper from "./PopulationCriteriaWrapper";
import { measureStore } from "@madie/madie-util";
import { QdmMeasureCQL } from "../../common/QdmMeasureCQL";
import { Measure } from "@madie/madie-models";
import { MeasureCQL } from "../../common/MeasureCQL";

const serviceConfig: ServiceConfig = {
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
};

const qdmMeasure = {
  id: "testMeasureId",
  measureName: "the measure for testing",
  model: "QDM v5.6",
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
  useFeatureFlags: () => ({}),
}));

const renderPopulationCriteriaHomeComponent = async (
  routePath: string,
  browserUrlPath: string
) => {
  await render(
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

describe("PopulationCriteriaHome", () => {
  const { findByTestId } = screen;

  beforeEach(() => {
    QiCoreMeasure.cql = MeasureCQL;
  });

  it.skip("should render Measure Groups component with group from measure along with side nav", async () => {
    // needs to be fixed
    renderPopulationCriteriaHomeComponent("groups/:groupNumber", "groups/1");

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
    renderPopulationCriteriaHomeComponent(
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
    renderPopulationCriteriaHomeComponent("risk-adjustment", "risk-adjustment");
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
    renderPopulationCriteriaHomeComponent("groups/:groupNumber", "groups/1");
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
    renderPopulationCriteriaHomeComponent("groups/:groupNumber", "groups/1");
    const criteria1 = await findByTestId(
      "leftPanelMeasureInformation-MeasureGroup1"
    );
    const QICorePage = await findByTestId("qi-core-groups");
    expect(QICorePage).toBeInTheDocument();
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
    renderPopulationCriteriaHomeComponent("reporting", "reporting");
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
    renderPopulationCriteriaHomeComponent(
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
    renderPopulationCriteriaHomeComponent("groups/:groupNumber", "groups/1");
    const QDMPage = await findByTestId("qdm-groups");
    expect(QDMPage).toBeInTheDocument();
  });

  it("should render the QDM Supplemental Data page for QDM measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    await renderPopulationCriteriaHomeComponent(
      "supplemental-data",
      "supplemental-data"
    );
    expect(
      await screen.findByRole("textbox", { name: "Description" })
    ).toBeInTheDocument();
    const allComboBoxes = screen.getAllByRole("combobox");
    expect(allComboBoxes.length).toEqual(1);

    act(() => {
      userEvent.click(screen.getByRole("button", { name: "Open" }));
    });

    await waitFor(() => {
      userEvent.click(screen.getByText('"SDE Ethnicity"', { exact: false }));
    });
    expect(
      screen.getByRole("button", { name: '"SDE Ethnicity"' })
    ).toBeInTheDocument();

    expect(
      screen.queryByText("SDE Ethnicity - Include in Report Type")
    ).not.toBeInTheDocument();
  });

  it("should render the QI-Core Supplemental Data page for QI-Core measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...QiCoreMeasure };
    await renderPopulationCriteriaHomeComponent(
      "supplemental-data",
      "supplemental-data"
    );
    expect(
      await screen.findByRole("textbox", { name: "Description" })
    ).toBeInTheDocument();
    const allComboBoxes = screen.getAllByRole("combobox");
    expect(allComboBoxes.length).toEqual(1);

    userEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => {
      userEvent.click(screen.getByText('SDE."SDE Ethnicity"'));
    });
    expect(
      screen.getByRole("button", { name: 'SDE."SDE Ethnicity"' })
    ).toBeInTheDocument();

    expect(
      await screen.findByText('SDE."SDE Ethnicity" - Include in Report Type')
    ).toBeInTheDocument();

    const allComboBoxes2 = screen.getAllByRole("combobox");
    expect(allComboBoxes2.length).toEqual(2);
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
      userEvent.click(screen.getByText('"SDE Ethnicity"'));
    });
    expect(
      screen.getByRole("button", { name: '"SDE Ethnicity"' })
    ).toBeInTheDocument();

    expect(
      screen.queryByText('SDE."SDE Ethnicity" - Include in Report Type')
    ).not.toBeInTheDocument();
  });

  it("should render the QI-Core Risk Adjustment page for QI-Core measures", async () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...QiCoreMeasure };
    await renderPopulationCriteriaHomeComponent(
      "risk-adjustment",
      "risk-adjustment"
    );
    expect(
      await screen.findByRole("textbox", { name: "Description" })
    ).toBeInTheDocument();
    const allComboBoxes = screen.getAllByRole("combobox");
    expect(allComboBoxes.length).toEqual(1);

    userEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => {
      userEvent.click(screen.getByText('SDE."SDE Ethnicity"'));
    });
    expect(
      screen.getByRole("button", { name: 'SDE."SDE Ethnicity"' })
    ).toBeInTheDocument();

    expect(
      await screen.findByText('SDE."SDE Ethnicity" - Include in Report Type')
    ).toBeInTheDocument();

    const allComboBoxes2 = screen.getAllByRole("combobox");
    expect(allComboBoxes2.length).toEqual(2);
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
});
