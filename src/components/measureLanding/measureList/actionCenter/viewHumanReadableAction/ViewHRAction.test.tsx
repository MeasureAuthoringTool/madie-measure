import * as React from "react";
import { render, screen } from "@testing-library/react";
import ViewHRAction, {
  NOTHING_SELECTED,
  VIEW_HUMANREADABLE,
} from "./ViewHRAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
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
  measureMetaData: { draft: true },
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as unknown as Measure;

describe("ViewHRAction component", () => {
  it("Should disable action btn if no measure selected", () => {
    render(<ViewHRAction measures={[]} onClick={() => {}} />);
    expect(screen.getByTestId("view-hr-action-btn")).toBeDisabled();
    expect(screen.getByTestId("view-hr-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one measure", () => {
    render(<ViewHRAction measures={[qdmMeasure]} onClick={() => {}} />);
    expect(screen.getByTestId("view-hr-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("view-hr-action-tooltip")).toHaveAttribute(
      "aria-label"
    );
  });

  it("Should not disable action btn even if user cannot edit ", () => {
    render(<ViewHRAction measures={[qdmMeasure]} onClick={() => {}} />);
    expect(screen.getByTestId("view-hr-action-btn")).toBeEnabled();
    expect(screen.getByTestId("view-hr-action-tooltip")).toHaveAttribute(
      "aria-label",
      VIEW_HUMANREADABLE
    );
  });

  it("Should disable btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <ViewHRAction measures={[qdmMeasure, measure2]} onClick={() => {}} />
    );
    expect(screen.getByTestId("view-hr-action-btn")).toBeDisabled();
    expect(screen.getByTestId("view-hr-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
});
