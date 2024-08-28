import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DraftAction, { DRAFT_MEASURE, NOTHING_SELECTED } from "./DraftAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));

jest.mock("../../../../../api/useMeasureServiceApi");
const mockedUseMeasureServiceApi = useMeasureServiceApi as jest.MockedFunction<
  typeof useMeasureServiceApi
>;

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: mockUser,
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: false },
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

describe("DraftAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should disable action btn if no measure selected", () => {
    render(<DraftAction measures={[]} onClick={() => {}} canEdit={true} />);
    expect(screen.getByTestId("draft_measure_btn")).toBeDisabled();
    expect(screen.getByTestId("draft_measure_tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user selects one versioned measure", async () => {
    mockedUseMeasureServiceApi.mockReturnValue({
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1-2-3-4": true }),
    });

    render(
      <DraftAction
        measures={[qiCoreMeasureVersioned]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("draft_measure_btn")).not.toBeDisabled();
      expect(screen.getByTestId("draft_measure_tooltip")).toHaveAttribute(
        "aria-label",
        DRAFT_MEASURE
      );
    });
  });

  it("Should disable action btn if user selects one draft measure", () => {
    render(
      <DraftAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("draft_measure_btn")).toBeDisabled();
    expect(screen.getByTestId("draft_measure_tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if user cannot edit", () => {
    render(
      <DraftAction measures={[qdmMeasure]} onClick={() => {}} canEdit={false} />
    );
    expect(screen.getByTestId("draft_measure_btn")).toBeDisabled();
    expect(screen.getByTestId("draft_measure_tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if user selects two measures", () => {
    const measure2 = { ...qiCoreMeasure, model: Model.QDM_5_6 };
    render(
      <DraftAction
        measures={[qdmMeasure, measure2]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    expect(screen.getByTestId("draft_measure_btn")).toBeDisabled();
    expect(screen.getByTestId("draft_measure_tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });
});
