import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CompositeProfilesViews from "./CompositeProfilesViews";

// Mock child components to isolate behavior
jest.mock("./CompositeMeasuresTable", () => ({
  __esModule: true,
  default: ({ measures }) => (
    <div data-testid="composite-table">{measures?.length || 0} measures</div>
  ),
}));

jest.mock("../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks", () => ({
  __esModule: true,
  default: ({ isOpen }) => (
    <div data-testid="how-it-works">{isOpen ? "open" : "closed"}</div>
  ),
}));

describe("CompositeProfileViews", () => {
  const defaultProps = {
    howItWorksOpen: false,
    setAvailableTab: jest.fn(),
    setHowItWorksOpen: jest.fn(),
    compositeMeasures: [{ id: 1 }, { id: 2 }],
    completedMeasureCount: 1,
    handleSelectTestCase: jest.fn(),
  };

  it("renders header text", () => {
    render(<CompositeProfilesViews {...defaultProps} />);

    expect(
      screen.getByText(
        /Select Which Measures to choose Test Case Profiles from:/i
      )
    ).toBeInTheDocument();
  });

  it("renders measure completion text", () => {
    render(<CompositeProfilesViews {...defaultProps} />);

    expect(
      screen.getByText("1 of 2 Measures (Components) complete")
    ).toBeInTheDocument();
  });

  it("renders CompositeMeasuresTable", () => {
    render(<CompositeProfilesViews {...defaultProps} />);

    expect(screen.getByTestId("composite-table")).toBeInTheDocument();
    expect(screen.getByText("2 measures")).toBeInTheDocument();
  });

  it("calls setAvailableTab when back button is clicked", () => {
    render(<CompositeProfilesViews {...defaultProps} />);

    const button = screen.getByTestId("back-to-all-profiles-button");
    fireEvent.click(button);

    expect(defaultProps.setAvailableTab).toHaveBeenCalledWith("profiles");
  });

  it("applies class when howItWorksOpen is true", () => {
    render(<CompositeProfilesViews {...defaultProps} howItWorksOpen={true} />);

    const container = screen
      .getByTestId("back-to-all-profiles-button")
      .closest("div");

    expect(container).toHaveClass("how-it-works-flush-left");
  });

  it("does not render completion text when no measures", () => {
    render(<CompositeProfilesViews {...defaultProps} compositeMeasures={[]} />);

    expect(
      screen.queryByText(/Measures \(Components\) complete/i)
    ).not.toBeInTheDocument();
  });
});
