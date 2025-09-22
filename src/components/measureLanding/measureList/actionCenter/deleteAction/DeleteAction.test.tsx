import * as React from "react";
import { render, screen } from "@testing-library/react";
import DeleteAction, {
  DEL_MEASURE,
  NOTHING_SELECTED,
  UNABLE_DELETE_LOCKED,
  UNABLE_DELETE,
} from "./DeleteAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../../api/useMeasureServiceApi";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
  useFeatureFlags: jest.fn(() => ({
    Locking: false,
  })),
}));

jest.mock("../../../../../api/useMeasureServiceApi");
const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const mockMeasureServiceApi = {
  checkMeasureLocked: jest.fn().mockResolvedValue("OK to proceed."),
} as unknown as MeasureServiceApi;

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
} as unknown as Measure;

describe("DeleteAction", () => {
  beforeEach(() => {
    jest.resetModules();
    useMeasureServiceMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApi;
    });
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: false,
    }));
  });

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

  it("sets tooltip to locked message if checkMeasureLocked returns harpId", async () => {
    (useFeatureFlags as jest.Mock).mockImplementation(() => ({
      Locking: true,
    }));
    const mockMeasureServiceApi = {
      checkMeasureLocked: jest.fn().mockResolvedValue("harpId"),
    } as any;
    useMeasureServiceMock.mockImplementation(() => mockMeasureServiceApi);

    render(
      <DeleteAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    // Wait for async state update
    await screen.findByTestId("delete-action-tooltip");
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      UNABLE_DELETE_LOCKED.replace("<harpID>", "harpId")
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
  });

  it("sets tooltip to locked test cases if checkMeasureLocked returns test cases locked message", async () => {
    (useFeatureFlags as jest.Mock).mockImplementation(() => ({
      Locking: true,
    }));
    const mockMeasureServiceApi = {
      checkMeasureLocked: jest
        .fn()
        .mockResolvedValue(
          "One or more test cases are locked by another user."
        ),
    } as any;
    useMeasureServiceMock.mockImplementation(() => mockMeasureServiceApi);

    render(
      <DeleteAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    // Wait for async state update
    await screen.findByTestId("delete-action-tooltip");
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      UNABLE_DELETE + " " + "One or more test cases are locked by another user."
    );
    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
  });

  it("should enable delete when there is no lock", async () => {
    (useFeatureFlags as jest.Mock).mockImplementation(() => ({
      Locking: true,
    }));
    const mockMeasureServiceApi = {
      checkMeasureLocked: jest.fn().mockResolvedValue("OK to proceed"),
    } as any;
    useMeasureServiceMock.mockImplementation(() => mockMeasureServiceApi);

    render(
      <DeleteAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    // Wait for async state update
    await screen.findByTestId("delete-action-tooltip");
    expect(screen.getByTestId("delete-action-tooltip")).toHaveAttribute(
      "aria-label",
      DEL_MEASURE
    );
    expect(screen.getByTestId("delete-action-btn")).not.toBeDisabled();
  });
});
