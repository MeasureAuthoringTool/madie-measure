import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import PopulationCriteriaWrapper from "./PopulationCriteriaWrapper";
import { measureStore } from "@madie/madie-util";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
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
};

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
        <Route path={[`/measures/testMeasureId/edit/${routePath}`]}>
          <PopulationCriteriaWrapper />
        </Route>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

describe("PopulationCriteriaHome", () => {
  const { findByTestId } = screen;
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
    expect(screen.getByTestId("supplemental-data-form")).toBeInTheDocument();
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
});
