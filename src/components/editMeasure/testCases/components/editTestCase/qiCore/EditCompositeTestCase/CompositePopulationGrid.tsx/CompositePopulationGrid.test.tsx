// CompositePopulationGrid.test.tsx

import React from "react";
import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import CompositePopulationGrid from "./CompositePopulationGrid";

// Mock icon component so we can inspect props
jest.mock("../../../../populations/TestCasePopulationList", () => ({
  StyledIcon: ({ errors }: any) => (
    <div
      data-testid="test-population-icon-scoring"
      data-errors={errors ? "true" : "false"}
    />
  ),
}));

const renderComponent = ({
  group,
  values,
  errors = {},
  isTestCaseExecuted = false,
  disabled = false,
  index = 0,
}: any) =>
  render(
    <Formik initialValues={values} initialErrors={errors} onSubmit={jest.fn()}>
      <CompositePopulationGrid
        group={group}
        isTestCaseExecuted={isTestCaseExecuted}
        disabled={disabled}
        index={index}
      />
    </Formik>
  );

describe("CompositePopulationGrid", () => {
  const baseGroup = {
    groupId: "g1",
    displayId: "Group_1",
    name: "Group 1",
    scores: {
      denominatorScore: 10,
      numeratorScore: 5,
      compositeScore: 50,
    },
  };

  const matchingValues = {
    groupPopulations: [
      {
        groupId: "g1",
        populationBasis: "performance_rate",
        compositeScoreValues: {
          denominatorScore: { expected: 10 },
          numeratorScore: { expected: 5 },
          compositeScore: { expected: 50 },
        },
      },
    ],
  };

  it("renders basic table content", () => {
    renderComponent({
      group: baseGroup,
      values: matchingValues,
    });

    expect(screen.getByText("Denominator")).toBeInTheDocument();
    expect(screen.getByText("Numerator")).toBeInTheDocument();
    expect(screen.getByText("Composite Score")).toBeInTheDocument();

    expect(screen.getByText("Measure Group 1")).toBeInTheDocument();
    expect(screen.getByText(/Performance Rate/i)).toBeInTheDocument();

    expect(
      screen.getByTestId("composite-denominator-score-Group_1")
    ).toHaveTextContent("10");

    expect(
      screen.getByTestId("composite-numerator-score-Group_1")
    ).toHaveTextContent("5");

    expect(
      screen.getByTestId("composite-composite-score-Group_1")
    ).toHaveTextContent("50%");
  });

  it("renders pass icon when all values match", () => {
    renderComponent({
      group: baseGroup,
      values: matchingValues,
      isTestCaseExecuted: true,
    });

    const icon = screen.getByTestId("test-population-icon-scoring");

    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("data-errors", "false");
  });

  it("renders fail icon when denominator does not match", () => {
    renderComponent({
      group: baseGroup,
      isTestCaseExecuted: true,
      values: {
        groupPopulations: [
          {
            groupId: "g1",
            populationBasis: "performance_rate",
            compositeScoreValues: {
              denominatorScore: { expected: 999 },
              numeratorScore: { expected: 5 },
              compositeScore: { expected: 50 },
            },
          },
        ],
      },
    });

    expect(screen.getByTestId("test-population-icon-scoring")).toHaveAttribute(
      "data-errors",
      "true"
    );
  });

  it("renders fail icon when numerator does not match", () => {
    renderComponent({
      group: baseGroup,
      isTestCaseExecuted: true,
      values: {
        groupPopulations: [
          {
            groupId: "g1",
            populationBasis: "performance_rate",
            compositeScoreValues: {
              denominatorScore: { expected: 10 },
              numeratorScore: { expected: 999 },
              compositeScore: { expected: 50 },
            },
          },
        ],
      },
    });

    expect(screen.getByTestId("test-population-icon-scoring")).toHaveAttribute(
      "data-errors",
      "true"
    );
  });

  it("renders fail icon when composite score does not match", () => {
    renderComponent({
      group: baseGroup,
      isTestCaseExecuted: true,
      values: {
        groupPopulations: [
          {
            groupId: "g1",
            populationBasis: "performance_rate",
            compositeScoreValues: {
              denominatorScore: { expected: 10 },
              numeratorScore: { expected: 5 },
              compositeScore: { expected: 999 },
            },
          },
        ],
      },
    });

    expect(screen.getByTestId("test-population-icon-scoring")).toHaveAttribute(
      "data-errors",
      "true"
    );
  });

  it("does not render icon when test case has not been executed", () => {
    renderComponent({
      group: baseGroup,
      values: matchingValues,
      isTestCaseExecuted: false,
    });

    expect(
      screen.queryByTestId("test-population-icon-scoring")
    ).not.toBeInTheDocument();
  });

  it("renders all validation error messages", () => {
    renderComponent({
      group: baseGroup,
      values: matchingValues,
      errors: {
        groupPopulations: [
          {
            compositeScoreValues: {
              denominatorScore: {
                expected: "Denominator error",
              },
              numeratorScore: {
                expected: "Numerator error",
              },
              compositeScore: {
                expected: "Composite error",
              },
            },
          },
        ],
      },
    });

    expect(screen.getByText("Denominator error")).toBeInTheDocument();
    expect(screen.getByText("Numerator error")).toBeInTheDocument();
    expect(screen.getByText("Composite error")).toBeInTheDocument();
  });

  it("applies disabled styles and aria attributes", () => {
    renderComponent({
      group: baseGroup,
      values: matchingValues,
      disabled: true,
    });

    const inputs = screen.getAllByRole("textbox");

    inputs.forEach((input) => {
      expect(input).toHaveAttribute("aria-disabled", "true");
    });
  });

  it('renders "-" when scores are null or undefined', () => {
    renderComponent({
      group: {
        ...baseGroup,
        scores: {
          denominatorScore: null,
          numeratorScore: undefined,
          compositeScore: null,
        },
      },
      values: matchingValues,
    });

    expect(
      screen.getByTestId("composite-denominator-score-Group_1")
    ).toHaveTextContent("-");

    expect(
      screen.getByTestId("composite-numerator-score-Group_1")
    ).toHaveTextContent("-");

    expect(
      screen.getByTestId("composite-composite-score-Group_1")
    ).toHaveTextContent("-");
  });

  it("handles missing matching population and empty population basis", () => {
    renderComponent({
      group: baseGroup,
      values: {
        groupPopulations: [],
      },
    });

    expect(screen.getByTestId("Group_1-scoring-unit-1")).toHaveTextContent("-");
  });

  it("uses a non-Group displayId unchanged", () => {
    renderComponent({
      group: {
        ...baseGroup,
        displayId: "CustomGroup",
      },
      values: {
        groupPopulations: [
          {
            groupId: "g1",
            populationBasis: "measure_observation",
            compositeScoreValues: {
              denominatorScore: { expected: 10 },
              numeratorScore: { expected: 5 },
              compositeScore: { expected: 50 },
            },
          },
        ],
      },
    });

    expect(screen.getByText("CustomGroup")).toBeInTheDocument();
    expect(screen.getByText(/Measure Observation/i)).toBeInTheDocument();
  });
});
