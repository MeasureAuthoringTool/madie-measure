import * as React from "react";
import { render, screen } from "@testing-library/react";
import VersionAction, {
  VERSION_MEASURE,
  NOTHING_SELECTED,
  MEASURE_LOCKED_MESSAGE,
  TEST_CASES_LOCKED_MESSAGE,
} from "./VersionAction";
import { Measure, MeasureSet, Model, MeasureLock } from "@madie/madie-models";
const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({}),
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
const qiCoreMeasureVersioned = {
  model: Model.QICORE,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: false },
} as unknown as Measure;

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

  it("Should disable button if measure is locked", () => {
    const lockedByUser = "another user";
    render(
      <VersionAction
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
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      MEASURE_LOCKED_MESSAGE + " " + lockedByUser
    );
  });

  it("Should disable button if test cases are locked", () => {
    const lockedByUser = "another user";
    render(
      <VersionAction
        measures={[
          {
            ...qiCoreMeasure,
            hasLockedTestCases: true,
            measureLock: { lockedBy: null } as unknown as MeasureLock,
          },
        ]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-tooltip")).toHaveAttribute(
      "aria-label",
      TEST_CASES_LOCKED_MESSAGE
    );
  });

  it("Should enable button if neither measure nor test cases are locked", () => {
    render(
      <VersionAction
        measures={[
          {
            ...qiCoreMeasure,
            measureLock: { lockedBy: null } as MeasureLock,
            hasLockedTestCases: false,
          },
        ]}
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
});
