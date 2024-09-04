import * as React from "react";
import { render, screen } from "@testing-library/react";
import VersionAction, {
  VERSION_MEASURE,
  NOTHING_SELECTED,
} from "./VersionAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

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
  measureMetaData: { draft: true },
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;
const qiCoreMeasureVersioned = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: false },
} as Measure;

describe("VersionAction", () => {
  it("Should disable action btn if no measure selected", () => {
    render(<VersionAction measures={[]} onClick={() => {}} canEdit={true} />);
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one draft measure", () => {
    render(
      <VersionAction
        measures={[qdmMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      VERSION_MEASURE
    );
  });
  it("Should disable action btn if user select one versioned measure", () => {
    render(
      <VersionAction
        measures={[qiCoreMeasureVersioned]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
  it("Should disable action btn if user cannot edit ", () => {
    render(
      <VersionAction
        measures={[qdmMeasure]}
        onClick={() => {}}
        canEdit={false}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <VersionAction
        measures={[qdmMeasure, measure2]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
});
