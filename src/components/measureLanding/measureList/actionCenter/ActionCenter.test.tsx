import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionCenter from "./ActionCenter";
import { Measure, MeasureSet, Model } from "@madie/madie-models";
import {
  checkUserCanEdit,
  useOktaTokens,
  checkUserCanDelete,
  MeasureServiceApi,
  useFeatureFlags,
} from "@madie/madie-util";

const mockMeasureServiceApi = {
  deleteMeasure: jest.fn().mockResolvedValue({}),
  checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),

  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({
    "1": true,
    "2": true,
    "3": true,
  }),
  getMeasureExport: jest
    .fn()
    .mockResolvedValue({ size: 635581, type: "application/octet-stream" }),
  getSharedMeasures: jest.fn().mockResolvedValue({
    measureId1: ["userId1"],
    measureId2: ["userId1", "userId2"],
  }),
  getMeasuresByMeasureSetId: jest
    .fn()
    .mockResolvedValue([{ model: Model.QICORE }, { model: Model.QICORE }]),
  transferMeasures: jest.fn().mockResolvedValue({
    status: 200,
    data: [],
  }),
} as unknown as MeasureServiceApi;

const mockGetUserName = jest.fn(() => "test user");
const mockCheckUserCanEdit = jest.fn();
const setViewHumanReadableModal = jest.fn();
const mockCheckUserCanDelete = jest.fn();

const mockMeasureReviewServiceApi = {
  getMeasureReview: jest.fn().mockResolvedValue(null),
  createMeasureReview: jest.fn().mockResolvedValue({ id: "new-review-id" }),
  updateMeasureReview: jest
    .fn()
    .mockResolvedValue({ id: "existing-review-id" }),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useMeasureReviewServiceApi: jest.fn(() => mockMeasureReviewServiceApi),
  useUserServiceApi: jest.fn(() => ({ getOwnerDetails: jest.fn() })),
  checkUserCanEdit: jest.fn(),
  useUserRoles: jest.fn().mockReturnValue({
    roles: [],
    isAdmin: false,
  }),
  useOktaTokens: jest.fn(),
  useFeatureFlags: jest.fn().mockReturnValue({
    MeasureReviewStatus: true,
  }),
  fetchMeasureDraftStatuses: jest.fn(),
  checkUserCanDelete: jest.fn(),
}));

const mockMeasureSet = {
  cmsId: "124",
  measureSetId: "1-2-3-4",
  owner: "test user",
} as unknown as MeasureSet;

const qdmMeasure = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: true },
} as Measure;

const qdmMeasureVersion = {
  model: Model.QDM_5_6,
  measureSet: mockMeasureSet,
  measureSetId: "1-2-3-4",
  measureMetaData: { draft: false },
} as Measure;

describe("ActionCenter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useOktaTokens as jest.Mock).mockReturnValue({
      getUserName: mockGetUserName,
    });
    (checkUserCanEdit as jest.Mock).mockImplementation(mockCheckUserCanEdit);
    (checkUserCanDelete as jest.Mock).mockImplementation(
      mockCheckUserCanDelete
    );
    (useFeatureFlags as jest.Mock).mockReturnValue({
      MeasureReviewStatus: true,
    });
  });

  it("should not render review action when MeasureReviewStatus flag is disabled", () => {
    mockCheckUserCanEdit.mockReturnValue(true);
    (useFeatureFlags as jest.Mock).mockReturnValue({
      MeasureReviewStatus: false,
    });

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    expect(screen.queryByTestId("review-action-btn")).not.toBeInTheDocument();
  });

  it("should render all action components", () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    expect(screen.getByTestId("action-center")).toBeInTheDocument();
    expect(screen.getByTestId("delete-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("share-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("export-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("draft-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("version-action-btn")).toBeInTheDocument();
    expect(
      screen.getByTestId("associate-cms-id-action-btn")
    ).toBeInTheDocument();
    expect(screen.getByTestId("view-hr-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("transfer-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("review-action-btn")).toBeInTheDocument();
  });

  it("should call updateTargetMeasure and setCreateVersionDialog when version action is triggered", async () => {
    const updateTargetMeasure = jest.fn();
    const setCreateVersionDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={setCreateVersionDialog}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={1}
        setTransferDialog={jest.fn()}
      />
    );

    await userEvent.click(screen.getByTestId("version-action-btn"));

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);
    expect(setCreateVersionDialog).toHaveBeenCalledWith({
      open: true,
      measureId: qdmMeasure.measureSetId,
    });
  });

  it("should call updateTargetMeasure and setReviewDialog when review action is triggered", async () => {
    const setReviewDialog = jest.fn();
    const updateTargetMeasure = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
        setReviewDialog={setReviewDialog}
      />
    );

    const reviewButton = await screen.findByTestId("review-action-btn");
    expect(reviewButton).toBeEnabled();
    userEvent.click(reviewButton);

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);

    expect(setReviewDialog).toHaveBeenCalledWith({
      open: true,
      measureId: qdmMeasure.id,
    });
  });

  it("should call updateTargetMeasure and setDraftMeasureDialog when draft action is triggered", async () => {
    const updateTargetMeasure = jest.fn();
    const setDraftMeasureDialog = jest.fn();
    const fetchMeasureDraftStatuses = jest.fn().mockResolvedValue({
      "1-2-3-4": true,
    });
    mockMeasureServiceApi.fetchMeasureDraftStatuses = fetchMeasureDraftStatuses;

    render(
      <ActionCenter
        measures={[qdmMeasureVersion]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={setDraftMeasureDialog}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={2}
        setTransferDialog={jest.fn()}
      />
    );

    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).toBeEnabled();
    await userEvent.click(draftButton);

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasureVersion);
    expect(setDraftMeasureDialog).toHaveBeenCalledWith({
      open: true,
    });
  });

  it("should call updateTargetMeasure and setDeleteMeasureDialog when delete action is triggered", async () => {
    const updateTargetMeasure = jest.fn();
    const setDeleteMeasureDialog = jest.fn();
    const deleteMeasure = jest.fn();
    mockCheckUserCanDelete.mockReturnValue(true);

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={setDeleteMeasureDialog}
        setShareDialog={jest.fn}
        deleteMeasure={deleteMeasure}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).toBeEnabled();
    await userEvent.click(deleteButton);

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);
    expect(setDeleteMeasureDialog).toHaveBeenCalledWith(true);
  });

  it("should call exportMeasure with severity Error when publishable export action is triggered", async () => {
    const exportMeasure = jest.fn();
    const updateTargetMeasure = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={exportMeasure}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    userEvent.click(await screen.findByTestId("export-action-btn"));

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);
    expect(exportMeasure).toHaveBeenCalledWith("Error");
  });

  it("should call exportMeasure with severity info when export action is triggered", async () => {
    const exportMeasure = jest.fn();
    const updateTargetMeasure = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={exportMeasure}
        updateTargetMeasure={updateTargetMeasure}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    userEvent.click(await screen.findByTestId("export-action-btn"));

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export",
    });
    userEvent.click(exportForPublishingButton);

    expect(updateTargetMeasure).toHaveBeenCalledWith(qdmMeasure);
    expect(exportMeasure).toHaveBeenCalledWith("Info");
  });

  it("should disable actions based on permissions except of view human readable", () => {
    mockCheckUserCanEdit.mockReturnValue(false);

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    expect(screen.getByTestId("delete-action-btn")).toBeDisabled();
    expect(screen.getByTestId("export-action-btn")).not.toBeDisabled();
    expect(screen.getByTestId("share-action-btn")).toBeDisabled();
    expect(screen.getByTestId("draft-action-btn")).toBeDisabled();
    expect(screen.getByTestId("version-action-btn")).toBeDisabled();
    expect(screen.getByTestId("view-hr-action-btn")).toBeEnabled();
    expect(screen.getByTestId("review-action-btn")).toBeDisabled();
  });

  it("should call view human readable when view human readable action is triggered", async () => {
    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={setViewHumanReadableModal}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    const viewHRBtn = screen.getByTestId("view-hr-action-btn");
    await userEvent.click(viewHRBtn);

    await waitFor(() => {
      expect(setViewHumanReadableModal).toHaveBeenCalledWith({
        open: true,
        measureId: qdmMeasure.measureSetId,
      });
    });
  });

  it("should call setShareDialog with 'Share With' option when share action button is clicked and a measure is passed into ActionCenter", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setShareDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={setShareDialog}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    const shareButton = await screen.findByTestId("share-action-btn");
    expect(shareButton).toBeEnabled();
    await userEvent.click(shareButton);
    await userEvent.click(screen.getByRole("menuitem", { name: "Share With" }));

    expect(setShareDialog).toHaveBeenCalledWith({
      open: true,
      option: "Share With",
    });
  });

  it("should call setShareDialog with 'Unshare' option when share action button is clicked and a measure is passed into ActionCenter", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setShareDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={setShareDialog}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    const shareButton = await screen.findByTestId("share-action-btn");
    expect(shareButton).toBeEnabled();
    await userEvent.click(shareButton);
    await userEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));

    expect(setShareDialog).toHaveBeenCalledWith({
      open: true,
      option: "Unshare",
    });
  });

  it("should call setShareDialog with 'Unshare' option when share action button is clicked and activeTab is set to 0 (Owned Measure Tab) and a measure is passed into ActionCenter", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setShareDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={setShareDialog}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    const shareButton = await screen.findByTestId("share-action-btn");
    expect(shareButton).toBeEnabled();
    await userEvent.click(shareButton);
    await userEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));

    expect(setShareDialog).toHaveBeenCalledWith({
      open: true,
      option: "Unshare",
    });
  });

  it("should call setShareDialog with 'Unshare' option when share action button is clicked and activeTab is set to 2 (All Measure Tab) and a measure is passed into ActionCenter", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setShareDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={setShareDialog}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={2}
        setTransferDialog={jest.fn()}
      />
    );

    const shareButton = await screen.findByTestId("share-action-btn");
    expect(shareButton).toBeEnabled();
    await userEvent.click(shareButton);
    await userEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));

    expect(setShareDialog).toHaveBeenCalledWith({
      open: true,
      option: "Unshare",
    });
  });

  it("should call setShareDialog with 'UnshareFromMe' option when share action button is clicked and activeTab is set to 1 (Shared Measure Tab) and a measure is passed into ActionCenter", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setShareDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={setShareDialog}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={1}
        setTransferDialog={jest.fn()}
      />
    );

    const shareButton = await screen.findByTestId("share-action-btn");
    expect(shareButton).toBeEnabled();
    await userEvent.click(shareButton);
    await userEvent.click(screen.getByRole("menuitem", { name: "Unshare" }));

    expect(setShareDialog).toHaveBeenCalledWith({
      open: true,
      option: "UnshareFromMe",
    });
  });

  it("should not call setShareDialog when no measure is passed into ActionCenter and the share action button should be disabled", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setShareDialog = jest.fn();

    render(
      <ActionCenter
        measures={[]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={setShareDialog}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    const shareButton = await screen.findByTestId("share-action-btn");

    // Wait for the component's useEffect to complete and button to be properly disabled
    await waitFor(() => {
      expect(shareButton).toBeDisabled();
    });

    expect(setShareDialog).not.toHaveBeenCalledWith(true);
  });

  it("should call setTransferDialog", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setTransferDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn()}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={setTransferDialog}
      />
    );

    const transferButton = await screen.findByTestId("transfer-action-btn");
    expect(transferButton).toBeEnabled();
    await userEvent.click(transferButton);

    expect(setTransferDialog).toHaveBeenCalledWith({
      open: true,
      isAdminTransfer: false,
    });
  });

  it("should not call setTransferDialog when no measures passed in", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setTransferDialog = jest.fn();

    render(
      <ActionCenter
        measures={[]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn()}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        activeTab={0}
        setTransferDialog={setTransferDialog}
      />
    );

    const transferButton = await screen.findByTestId("transfer-action-btn");
    expect(transferButton).not.toBeEnabled();
    await fireEvent.click(transferButton); // userEvent.click does not work on disabled button

    expect(setTransferDialog).not.toHaveBeenCalledWith({
      open: true,
    });
  });

  it("should render compare versions action", () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn()}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        setViewMeasureHistoryDialog={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
      />
    );

    expect(screen.getByTestId("action-center")).toBeInTheDocument();
    expect(
      screen.getByTestId("compare-versions-action-btn")
    ).toBeInTheDocument();
  });

  it("should call setCompareVersionsDialog when compare versions action is clicked", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setCompareVersionsDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure, qdmMeasureVersion]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn()}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        setViewMeasureHistoryDialog={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
        setCompareVersionsDialog={setCompareVersionsDialog}
      />
    );

    const compareButton = await screen.findByTestId(
      "compare-versions-action-btn"
    );
    expect(compareButton).toBeEnabled();
    await userEvent.click(compareButton);

    expect(setCompareVersionsDialog).toHaveBeenCalled();
  });

  it("should keep compare versions button disabled when measures length !== 2", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setCompareVersionsDialog = jest.fn();

    render(
      <ActionCenter
        measures={[qdmMeasure]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn()}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        setViewMeasureHistoryDialog={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
        setCompareVersionsDialog={setCompareVersionsDialog}
      />
    );

    const compareButton = await screen.findByTestId(
      "compare-versions-action-btn"
    );

    expect(compareButton).toBeDisabled();
    expect(setCompareVersionsDialog).not.toHaveBeenCalled();
  });

  it("should keep compare versions button disabled when measures are from different measure sets", async () => {
    mockCheckUserCanEdit.mockReturnValue(true);

    const setCompareVersionsDialog = jest.fn();

    const measureWithDifferentMeasureSetId = {
      ...qdmMeasureVersion,
      measureSetId: "different-measure-set",
    };

    render(
      <ActionCenter
        measures={[qdmMeasure, measureWithDifferentMeasureSetId]}
        associateCmsId={jest.fn()}
        exportMeasure={jest.fn()}
        updateTargetMeasure={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        setDraftMeasureDialog={jest.fn()}
        setDeleteMeasureDialog={jest.fn()}
        setShareDialog={jest.fn()}
        deleteMeasure={jest.fn()}
        setViewHumanReadableModal={jest.fn()}
        setViewMeasureHistoryDialog={jest.fn()}
        activeTab={0}
        setTransferDialog={jest.fn()}
        setCompareVersionsDialog={setCompareVersionsDialog}
      />
    );

    const compareButton = await screen.findByTestId(
      "compare-versions-action-btn"
    );

    expect(compareButton).toBeDisabled();
    expect(setCompareVersionsDialog).not.toHaveBeenCalled();
  });
});
