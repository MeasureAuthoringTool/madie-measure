import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompositeMeasureNavTabs, {
  COMPOSITE_TAB_VALUES,
} from "./CompositeMeasureNavTabs";
import { CompositeScores } from "./compositeScores";

const getValidationResultsDisplay = (label: string) => <div>{label}(3/4)</div>;

const renderNavTabs = (
  activeTab = "compositeScore",
  compositeScores?: CompositeScores,
  setActiveTab = jest.fn()
) =>
  render(
    <CompositeMeasureNavTabs
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      getValidationResultsDisplay={getValidationResultsDisplay}
      compositeScores={compositeScores}
    />
  );

describe("CompositeMeasureNavTabs", () => {
  it("renders all composite tabs", () => {
    renderNavTabs();
    expect(screen.getByTestId("composite-score-tab")).toBeInTheDocument();
    expect(screen.getByTestId("denominator-score-tab")).toBeInTheDocument();
    expect(screen.getByTestId("numerator-score-tab")).toBeInTheDocument();
    expect(screen.getByTestId("validation-tab")).toBeInTheDocument();
  });

  it("exposes the expected tab values", () => {
    expect(COMPOSITE_TAB_VALUES).toEqual([
      "compositeScore",
      "denominatorScore",
      "numeratorScore",
      "validation",
    ]);
  });

  it("shows placeholder dashes when no scores are available", () => {
    renderNavTabs("compositeScore", undefined);
    expect(screen.getByTestId("composite-score-tab")).toHaveTextContent(
      "-Composite Score"
    );
    expect(screen.getByTestId("denominator-score-tab")).toHaveTextContent(
      "-Denominator Score"
    );
    expect(screen.getByTestId("numerator-score-tab")).toHaveTextContent(
      "-Numerator Score"
    );
  });

  it("renders the composite score as a percentage and counts as raw numbers", () => {
    renderNavTabs("compositeScore", {
      compositeScore: 25,
      denominatorScore: 4,
      numeratorScore: 1,
    });
    expect(screen.getByTestId("composite-score-tab")).toHaveTextContent(
      "25%Composite Score"
    );
    expect(screen.getByTestId("denominator-score-tab")).toHaveTextContent(
      "4Denominator Score"
    );
    expect(screen.getByTestId("numerator-score-tab")).toHaveTextContent(
      "1Numerator Score"
    );
  });

  it("renders zero scores rather than falling back to a dash", () => {
    renderNavTabs("compositeScore", {
      compositeScore: 0,
      denominatorScore: 0,
      numeratorScore: 0,
    });
    expect(screen.getByTestId("composite-score-tab")).toHaveTextContent(
      "0%Composite Score"
    );
    expect(screen.getByTestId("denominator-score-tab")).toHaveTextContent(
      "0Denominator Score"
    );
    expect(screen.getByTestId("numerator-score-tab")).toHaveTextContent(
      "0Numerator Score"
    );
  });

  it("renders the validation display supplied by the parent", () => {
    renderNavTabs();
    expect(screen.getByTestId("validation-tab")).toHaveTextContent(
      "Valid(3/4)"
    );
  });

  it("changes to a score tab via setActiveTab when clicked", () => {
    const setActiveTab = jest.fn();
    renderNavTabs("compositeScore", undefined, setActiveTab);
    userEvent.click(screen.getByTestId("denominator-score-tab"));
    expect(setActiveTab).toHaveBeenCalledWith("denominatorScore");
  });

  it("does not switch to the display-only validation tab when clicked", () => {
    const setActiveTab = jest.fn();
    renderNavTabs("compositeScore", undefined, setActiveTab);
    userEvent.click(screen.getByTestId("validation-tab"));
    expect(setActiveTab).not.toHaveBeenCalled();
  });

  it("falls back to the composite score tab for an unknown active tab", () => {
    renderNavTabs("coverage", undefined);
    expect(screen.getByTestId("composite-score-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
