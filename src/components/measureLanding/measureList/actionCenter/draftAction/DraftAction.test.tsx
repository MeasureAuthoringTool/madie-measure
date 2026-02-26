import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DraftAction, {
  DRAFT_MEASURE,
  NOTHING_SELECTED,
  MODEL_MISMATCH,
} from "./DraftAction";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import { MeasureServiceApi } from "@madie/madie-util";

const mockUser = "test user";
jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
}));
const mockMeasureServiceApi = {
  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({ "1-2-3-4": true }),
  getMeasuresByMeasureSetId: jest
    .fn()
    .mockResolvedValue([{ model: Model.QICORE }, { model: Model.QICORE }]),
} as unknown as MeasureServiceApi;
jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => mockUser,
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  checkUserCanDelete: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
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

const QICore6MeasureVersioned = {
  model: Model.QICORE_6_0_0,
  measureSet: { ...mockMeasureSet, cmsId: null },
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: false },
};

describe("DraftAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should disable action btn if no measure selected", () => {
    render(<DraftAction measures={[]} onClick={() => {}} canEdit={true} />);
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should enable action btn if user selects one 4.1 measure and there are no 6.0 measures in MeasureSet", async () => {
    render(
      <DraftAction
        measures={[qiCoreMeasureVersioned]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("draft-action-btn")).not.toBeDisabled();
      expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
        "aria-label",
        DRAFT_MEASURE
      );
    });
  });

  it("Should disable action btn if user selects a 4.1.1 versioned measure and there are QI-core-6", async () => {
    mockMeasureServiceApi.fetchMeasureDraftStatuses = jest
      .fn()
      .mockResolvedValue({ "1-2-3-4": true });
    mockMeasureServiceApi.getMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([
        { model: Model.QICORE_6_0_0 },
        { model: Model.QICORE },
      ]);

    render(
      <DraftAction
        measures={[qiCoreMeasureVersioned]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
      expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
        "aria-label",
        MODEL_MISMATCH
      );
    });
  });

  it("Should enable action btn if user selects one versioned QI-Core6 measure", async () => {
    mockMeasureServiceApi.fetchMeasureDraftStatuses = jest
      .fn()
      .mockResolvedValue({ "1-2-3-4": true });
    mockMeasureServiceApi.getMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([
        { model: Model.QICORE_6_0_0 },
        { model: Model.QICORE },
      ]);

    render(
      <DraftAction
        measures={[QICore6MeasureVersioned]}
        onClick={() => {}}
        canEdit={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("draft-action-btn")).not.toBeDisabled();
      expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
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
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should disable action btn if user cannot edit", () => {
    render(
      <DraftAction measures={[qdmMeasure]} onClick={() => {}} canEdit={false} />
    );
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
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
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-tooltip")).toHaveAttribute(
      "aria-label",
      NOTHING_SELECTED
    );
  });

  it("Should show an error toast if API call fails", async () => {
    mockMeasureServiceApi.fetchMeasureDraftStatuses = jest
      .fn()
      .mockRejectedValue(new Error("Network Error"));

    render(
      <DraftAction
        measures={[qiCoreMeasure]}
        onClick={() => {}}
        canEdit={true}
      />
    );
    await waitFor(() => {
      expect(
        screen.getByTestId("draft-button-error-toast-text")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("draft-button-error-toast-text")
      ).toHaveTextContent(
        "Error fetching draft statuses: Error: Network Error"
      );
    });
  });
});
