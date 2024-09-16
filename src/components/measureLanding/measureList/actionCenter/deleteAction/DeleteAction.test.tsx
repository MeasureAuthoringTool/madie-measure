import * as React from "react";
import { render, screen } from "@testing-library/react";
import DeleteAction, { DEL_MEASURE, NOTHING_SELECTED } from "./DeleteAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";
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
} as Measure;

const qiCoreMeasure = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

describe("DeleteAction", () => {
  it("Should disable action btn if no measure selected", () => {
    render(<DeleteAction measures={[]} onClick={() => {}} canEdit={true} />);
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user select one measure ", () => {
    render(
      <DeleteAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      DEL_MEASURE
    );
  });
  it("Should disable action btn if user cannot edit ", () => {
    render(
      <DeleteAction
        measures={[qdmMeasure]}
        onClick={() => {}}
        canEdit={false}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <DeleteAction
        measures={[qdmMeasure, measure2]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
});
