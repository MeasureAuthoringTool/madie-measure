import * as React from "react";
import { render, screen } from "@testing-library/react";
import DeleteAction, {
  DELETE_MEASURE,
  MEASURE_LOCKED_MESSAGE,
  NOTHING_SELECTED,
  TEST_CASES_LOCKED_MESSAGE,
} from "./DeleteAction";
import { Measure, MeasureLock, MeasureSet, Model } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
  useFeatureFlags: jest.fn().mockReturnValue({
    Locking: false,
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
      DELETE_MEASURE
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

  it("Should disable button if measure is locked", () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const lockedByUser = "another user";
    render(
      <DeleteAction
        measures={[
          {
            ...qiCoreMeasure,
            measureLock: { lockedBy: lockedByUser } as MeasureLock,
          },
        ]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      MEASURE_LOCKED_MESSAGE + " " + lockedByUser
    );
  });

  it("Should disable button if measure has test cases that are locked by other users", () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const lockedByUser = "another user";
    render(
      <DeleteAction
        measures={[
          {
            ...qiCoreMeasure,
            hasLockedTestCases: true,
          },
        ]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      TEST_CASES_LOCKED_MESSAGE
    );
  });

  it("Should enable button if measure is not locked and no locked test cases present", () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    render(
      <DeleteAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("delete-action-btn")).toBeEnabled();
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      DELETE_MEASURE
    );
  });
});
