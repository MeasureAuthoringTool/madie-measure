import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PopulationCriteriaHome from "./PopulationCriteriaHome";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";

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
  features: {
    export: false,
    measureVersioning: false,
    populationCriteriaTabs: true,
  },
};

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure) => measure,
    state: {
      id: "testMeasureId",
      measureName: "the measure for testing",
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
    subscribe: (set) => {
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
    subscribe: (set) => {
      // set(measure)
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
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
  it("should render Measure Groups component with group from measure along with side nav", async () => {
    renderPopulationCriteriaHomeComponent();
    expect(screen.getByText("Population Criteria")).toBeInTheDocument();
    expect(screen.getByText("Criteria 1")).toBeInTheDocument();
    expect(screen.getByText("test description")).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-group-population-input")
    ).toHaveValue("Initial Population");
    expect(screen.getByText("Supplemental Data")).toBeInTheDocument();
    expect(screen.getByText("Risk Adjustment")).toBeInTheDocument();
  });

  it("should render Supplemnetal Data component", async () => {
    renderPopulationCriteriaHomeComponent();
    expect(screen.getByText("Population Criteria")).toBeInTheDocument();
    expect(screen.getByText("Criteria 1")).toBeInTheDocument();
    expect(screen.getByText("test description")).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-group-population-input")
    ).toHaveValue("Initial Population");
    expect(screen.getByText("Supplemental Data")).toBeInTheDocument();
    expect(screen.getByText("Risk Adjustment")).toBeInTheDocument();
  });
});
