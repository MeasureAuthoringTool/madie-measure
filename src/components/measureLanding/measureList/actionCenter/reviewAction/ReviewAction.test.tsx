import * as React from "react";
import { render, screen } from "@testing-library/react";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import ReviewAction, {
  REVIEW,
  SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS,
} from "./ReviewAction";

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: "test user",
} as unknown as MeasureSet;

const measure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
} as Measure;

describe("ReviewAction", () => {
  it("disables the action when no measures are selected", () => {
    render(<ReviewAction measures={[]} onClick={() => {}} canEdit={false} />);

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("disables the action when more than one measure is selected", () => {
    render(
      <ReviewAction
        measures={[measure, { ...measure, measureSetId: "2-3-4-5" }]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("disables the action when one measure is selected but the user cannot edit it", () => {
    render(
      <ReviewAction measures={[measure]} onClick={() => {}} canEdit={false} />
    );

    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      SELECT_MEASURE_TO_UPDATE_REVIEW_STATUS
    );
  });

  it("enables the action when one editable measure is selected", () => {
    render(
      <ReviewAction measures={[measure]} onClick={() => {}} canEdit={true} />
    );

    expect(screen.getByTestId("review-action-btn")).toBeEnabled();
    expect(screen.getByTestId("review-action-tooltip")).toHaveAttribute(
      "aria-label",
      REVIEW
    );
  });
});
