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

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: jest.fn().mockImplementation(() => ({
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
    })),
    initialState: jest.fn().mockImplementation(() => ({
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
    })),
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
    qdm: true,
  }),
}));

const renderPopulationCriteriaHomeComponent = async () => {
  await render(
    <MemoryRouter
      initialEntries={[{ pathname: "/measures/testMeasureId/edit/groups" }]}
    >
      <ApiContextProvider value={serviceConfig}>
        <Route path={["/measures/testMeasureId/edit/groups"]}>
          <PopulationCriteriaWrapper />
        </Route>
      </ApiContextProvider>
    </MemoryRouter>
  );
};

describe("PopulationCriteriaHome", () => {
  const { findByTestId } = screen;
  it("should render Measure Groups component with group from measure along with side nav", async () => {
    renderPopulationCriteriaHomeComponent();

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
    await render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/supplemental-data" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/supplemental-data"]}>
            <PopulationCriteriaWrapper />
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

  it("should render Risk Adjustment component", async () => {
    await render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/measures/testMeasureId/edit/risk-adjustment" },
        ]}
      >
        <ApiContextProvider value={serviceConfig}>
          <Route path={["/measures/testMeasureId/edit/risk-adjustment"]}>
            <PopulationCriteriaWrapper />
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

  it("should render a new form for population criteria, onclick of Add Population Criteria link", async () => {
    renderPopulationCriteriaHomeComponent();
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
    expect(screen.getByTestId("groupDescriptionInput")).toHaveTextContent("");
  });

  it("Should render a QDM specific page for QDM measures", async () => {
    renderPopulationCriteriaHomeComponent();
    const QDMPage = await findByTestId("qdm-groups");
    expect(QDMPage).toBeInTheDocument();
  });

  it("Should render a QI-Core specific page for QI-Core measures", async () => {
    measureStore.state.mockImplementationOnce(() => ({
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
    }));
    renderPopulationCriteriaHomeComponent();
    const QICorePage = await findByTestId("qi-core-groups");
    expect(QICorePage).toBeInTheDocument();
  });
});
