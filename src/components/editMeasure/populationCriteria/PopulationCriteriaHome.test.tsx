import * as React from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PopulationCriteriaHome from "./PopulationCriteriaHome";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import { measureStore } from "@madie/madie-util";
import { Model } from "@madie/madie-models";

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
  model: Model.QDM_5_6,
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
    state: {
      id: "testMeasureId",
      measureName: "the measure for testing",
      model: "QI-Core v4.1.1",
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
    },
    initialState: jest.fn().mockImplementation(() => null),
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
  useFeatureFlags: () => ({
    populationCriteriaTabs: true,
  }),
}));

const renderPopulationCriteriaHomeComponent = () => {
  render(
    <MemoryRouter
      initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
    >
      <ApiContextProvider value={serviceConfig}>
        <Route path={["/measures/testMeasureId/edit/groups"]}>
          <PopulationCriteriaHome />
        </Route>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

describe("PopulationCriteriaHome", () => {
  it("should render Measure Groups component with group from measure along with side nav", () => {
    renderPopulationCriteriaHomeComponent();
    expect(
      screen.getByRole("button", {
        name: /Population Criteria/i,
      })
    ).toBeInTheDocument();

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

  it("should render Supplemental Data component", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/supplemental-data" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/supplemental-data"]}>
            <PopulationCriteriaHome />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
    // verifies if the side nav is created
    expect(
      screen.getByRole("button", {
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

  it("should render Risk Adjustment component", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/risk-adjustment" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/risk-adjustment"]}>
            <PopulationCriteriaHome />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
    // verifies if the side nav is created
    expect(
      screen.getByRole("button", {
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

  it("should render a new form for population criteria, onclick of Add Population Criteria link", () => {
    renderPopulationCriteriaHomeComponent();
    const criteria1 = screen.getByRole("tab", {
      name: /Criteria 1/i,
    });
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
    expect(screen.getByTestId("groupDescriptionInput")).toHaveTextContent("");
  });

  it("should not render Reporting component for non-QDM measures", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/reporting" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/reporting"]}>
            <PopulationCriteriaHome />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
    // verifies if the side nav is created and Reportin is not available
    expect(
      screen.queryByRole("tab", {
        name: /Reporting/i,
      })
    ).toBeNull();
  });

  it("should not render base configuration component for non-QDM measures", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/base-configuration" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/base-configuration"]}>
            <PopulationCriteriaHome />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
    // verifies if the side nav is created and base configuration is not available
    expect(
      screen.queryByRole("tab", {
        name: /Base Configuration/i,
      })
    ).toBeNull();
  });

  // tests for QDM measures, since this test case uses a mock which returns QDM measure
  // all further test cases will have QDMMeasure being returned from Measure store.
  it("should render Reporting component only for QDM measures", () => {
    const mockedMeasureState = measureStore as jest.Mocked<{ state }>;
    mockedMeasureState.state = { ...qdmMeasure };
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/reporting" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/reporting"]}>
            <PopulationCriteriaHome />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
    // verifies if the side nav is created and reporting tab is available
    const reportingTab = screen.getByRole("tab", {
      name: /Reporting/i,
    });
    expect(reportingTab).toBeInTheDocument();
    // verifies if the Reporting component is loaded and the left nav link is active
    expect(
      screen.getByText("Reporting for QDM. Coming Soon!!")
    ).toBeInTheDocument();
    expect(reportingTab).toHaveAttribute("aria-selected", "true");
  });

  it("should render base configuration component only for QDM measures", () => {
    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/base-configuration" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/base-configuration"]}>
            <PopulationCriteriaHome />
          </Route>
        </ApiContextProvider>
      </MemoryRouter>
    );
    // verifies if the side nav is created and reporting tab is available
    const baseConfigurationTab = screen.getByRole("tab", {
      name: /Base Configuration/i,
    });
    expect(baseConfigurationTab).toBeInTheDocument();
    // verifies if the left nav link is active
    expect(baseConfigurationTab).toHaveAttribute("aria-selected", "true");
  });
});
