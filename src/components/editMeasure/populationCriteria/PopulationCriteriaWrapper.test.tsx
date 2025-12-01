import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import PopulationCriteriaWrapper from "./PopulationCriteriaWrapper";
import { Measure } from "@madie/madie-models";

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
  useMeasureServiceApi: jest.fn(() => {}),
  useDocumentTitle: jest.fn(),
  measureStore: {
    updateMeasure: (measure: Measure) => measure,
    state: QiCoreMeasure,
    initialState: QiCoreMeasure,
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useFeatureFlags: () => mockFeatureFlags,
}));

describe("PopulationCriteriaWrapper", () => {
  it("renders PopulationCriteriaWrapper when measure is not locked", () => {
    render(
      <MemoryRouter>
        <PopulationCriteriaWrapper measureCanEdit={true} />
      </MemoryRouter>
    );

    expect(screen.getByText("Population Criteria")).toBeInTheDocument();
  });

  it("renders PopulationCriteriaWrapper when measure is locked", async () => {
    mockFeatureFlags = { Locking: true };
    render(
      <MemoryRouter>
        <PopulationCriteriaWrapper
          measureCanEdit={true}
          measureLockedBy={"user123"}
        />
      </MemoryRouter>
    );

    const message = screen.getByTestId("measure-locked-modal-message");
    expect(message).toHaveTextContent(
      /This measure is currently edited by HARP ID/i
    );
    expect(message).toHaveTextContent("user123");

    userEvent.click(screen.getByText("Close"));

    await waitFor(() => {
      expect(
        screen.queryByText("Measure currently In-Use")
      ).not.toBeInTheDocument();
    });
  });

  it("does not render locked measure popup when displayLockedMeasurePopup is false", () => {
    mockFeatureFlags = { Locking: true };
    render(
      <MemoryRouter>
        <PopulationCriteriaWrapper
          measureCanEdit={true}
          measureLockedBy={"user123"}
          displayLockedMeasurePopup={false}
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByText("This measure is currently edited by HARP ID")
    ).not.toBeInTheDocument();
  });
});
