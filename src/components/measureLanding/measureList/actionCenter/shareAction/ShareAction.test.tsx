import * as React from "react";
import { render, screen } from "@testing-library/react";
import ShareAction, { SHARE_MEASURE, NOTHING_SELECTED } from "./ShareAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

describe("ShareAction", () => {
  it("Should disable share action btn if no measure selected", () => {
    render(<ShareAction measures={[]} onClick={() => {}} canEdit={false} />);
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable share action btn if user select one measure ", () => {
    render(
      <ShareAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("share-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      SHARE_MEASURE
    );
  });

  it("Should disable btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <ShareAction
        measures={[qdmMeasure, measure2]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("share-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
});
