import React, { useCallback, useEffect, useState } from "react";
import { Measure } from "@madie/madie-models";
import DeleteAction from "./deleteAction/DeleteAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import AssociateCmsIdAction from "./associateCmsIdAction/AccociateCmsIdAction";
import {
  checkUserCanEdit,
  checkUserCanDelete,
  useUserRoles,
  useFeatureFlags,
  ExportAction,
  ViewHRAction,
  HistoryAction,
  CompareVersionsAction,
  ShareAction,
  TransferAction,
} from "@madie/madie-util";
import ReviewAction from "./reviewAction/ReviewAction";

export const ALL_REVIEWS_TAB = 3;
export const MY_REVIEWS_TAB = 4;

// Helper to check if user owns all selected measures
const isOwnerOfAllMeasures = (measures: Measure[]) => {
  return (
    measures &&
    measures.every((measure) =>
      checkUserCanEdit(measure?.measureSet?.owner ?? "", [])
    )
  );
};

interface PropTypes {
  measures: Measure[];
  associateCmsId: any;
  exportMeasure: (elmErrorSeverity: string) => void;
  updateTargetMeasure: (measure: Measure) => void;
  setCreateVersionDialog: any;
  setDraftMeasureDialog: any;
  setDeleteMeasureDialog: any;
  setViewMeasureHistoryDialog?: any;
  setShareDialog: any;
  deleteMeasure: () => void;
  setViewHumanReadableModal: any;
  activeTab: number;
  setTransferDialog: any;
  setCompareVersionsDialog?: any;
  setReviewDialog?: any;
}
export default function ActionCenter(props: PropTypes) {
  const {
    measures,
    activeTab,
    associateCmsId,
    exportMeasure: onExportMeasure,
    setCompareVersionsDialog,
    setCreateVersionDialog,
    setDeleteMeasureDialog,
    setDraftMeasureDialog,
    setShareDialog,
    setTransferDialog,
    setViewHumanReadableModal,
    setViewMeasureHistoryDialog,
    setReviewDialog,
    updateTargetMeasure,
  } = props;
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isSharedWithUser, setIsSharedWithUser] = useState<boolean>(false);
  const userRoles = useUserRoles();

  const featureFlags = useFeatureFlags();

  const versionMeasure = useCallback(() => {
    if (measures?.length === 1) {
      updateTargetMeasure(measures[0]);
      setCreateVersionDialog({
        open: true,
        measureId: measures[0]?.measureSetId,
      });
    }
  }, [measures, setCreateVersionDialog, updateTargetMeasure]);

  const viewHumanReadable = useCallback(() => {
    if (measures?.length === 1) {
      updateTargetMeasure(measures[0]);
      setViewHumanReadableModal({
        open: true,
        measureId: measures[0]?.measureSetId,
      });
    }
  }, [measures, setViewHumanReadableModal, updateTargetMeasure]);

  const draftMeasure = useCallback(() => {
    if (measures?.length === 1) {
      updateTargetMeasure(measures[0]);
      setDraftMeasureDialog({
        open: true,
      });
    }
  }, [measures, setDraftMeasureDialog, updateTargetMeasure]);

  const transferMeasure = useCallback(() => {
    if (measures?.length > 0) {
      // Use admin transfer if user is admin and doesn't own all selected measures
      const isAdminTransferEnabled = userRoles?.isAdmin;
      const needsAdminTransfer =
        isAdminTransferEnabled && !isOwnerOfAllMeasures(measures);
      setTransferDialog({
        open: true,
        isAdminTransfer: needsAdminTransfer,
      });
    }
  }, [measures, setTransferDialog, userRoles]);

  const exportMeasure = useCallback(
    (exportType: string) => {
      const elmErrorSeverity =
        exportType === "Executable Export" ? "Info" : "Error";
      if (measures?.length === 1) {
        updateTargetMeasure(measures[0]);
        onExportMeasure(elmErrorSeverity);
      }
    },
    [measures, onExportMeasure, updateTargetMeasure]
  );

  const deleteMeasure = useCallback(() => {
    if (measures?.length === 1) {
      updateTargetMeasure(measures[0]);
      setDeleteMeasureDialog(true);
    }
  }, [measures, updateTargetMeasure, setDeleteMeasureDialog]);

  const shareMeasure = useCallback(
    (actionType: string) => {
      const shareOption =
        actionType === "Unshare" && activeTab === 1
          ? "UnshareFromMe"
          : actionType;

      setShareDialog({ open: true, option: shareOption });
    },
    [setShareDialog, activeTab]
  );

  const viewMeasureHistory = useCallback(() => {
    if (measures?.length === 1) {
      setViewMeasureHistoryDialog?.(true);
    }
  }, [measures, setViewMeasureHistoryDialog]);

  const compareVersions = useCallback(() => {
    if (measures?.length === 2) {
      setCompareVersionsDialog?.(true);
    }
  }, [measures, setCompareVersionsDialog]);

  const reviewMeasure = useCallback(() => {
    if (measures?.length === 1) {
      updateTargetMeasure(measures[0]);
      setReviewDialog?.({
        open: true,
        measureId: measures[0]?.id,
      });
    }
  }, [measures, setReviewDialog, updateTargetMeasure]);

  const isSelectedMeasureEditable = (measures) => {
    return (
      measures &&
      measures.every((measure) => {
        return checkUserCanEdit(
          measure?.measureSet?.owner,
          measure?.measureSet?.acls
        );
      })
    );
  };

  const isOwnerOfSelectedMeasures = (measures) => {
    return (
      measures &&
      measures.every((measure) => {
        return checkUserCanEdit(measure?.measureSet?.owner, []);
      })
    );
  };

  const isSelectedMeasuresSharedWithUser = (measures) => {
    return (
      measures &&
      measures.every((measure) => {
        return checkUserCanEdit(null, measure?.measureSet?.acls);
      })
    );
  };

  useEffect(() => {
    setCanEdit(isSelectedMeasureEditable(measures));
    setIsOwner(isOwnerOfSelectedMeasures(measures));
    setIsSharedWithUser(isSelectedMeasuresSharedWithUser(measures));
  }, [measures]);

  const isReviewTab =
    activeTab === ALL_REVIEWS_TAB || activeTab === MY_REVIEWS_TAB;

  const canReview = (isReviewTab && !!userRoles?.isReviewer) || canEdit;
  const PipeSeparator = () => (
    <span
      aria-hidden="true"
      style={{ color: "#8C8C8C", display: "inline-flex", alignItems: "center" }}
    >
      |
    </span>
  );

  const reviewAction = featureFlags?.MeasureReviewStatus && (
    <ReviewAction
      measures={measures}
      onClick={reviewMeasure}
      canReview={canReview}
    />
  );

  return (
    <div data-testid="action-center">
      {!isReviewTab && (
        <>
          <DeleteAction
            measures={measures}
            onClick={deleteMeasure}
            canEdit={
              canEdit &&
              checkUserCanDelete(
                measures?.[0]?.measureSet?.owner,
                measures?.[0]?.measureMetaData?.draft
              )
            }
          />
          <ExportAction measures={measures} onClick={exportMeasure} />

          <ShareAction
            measures={measures}
            onClick={shareMeasure}
            isOwner={isOwner}
            isSharedWithUser={isSharedWithUser}
            activeTab={activeTab}
          />

          <TransferAction
            measures={measures}
            onClick={transferMeasure}
            activeTab={activeTab}
          />

          <AssociateCmsIdAction measures={measures} onClick={associateCmsId} />

          <PipeSeparator />

          <VersionAction
            measures={measures}
            onClick={versionMeasure}
            canEdit={canEdit}
          />
          <DraftAction
            measures={measures}
            onClick={draftMeasure}
            canEdit={canEdit}
          />

          <PipeSeparator />

          <ViewHRAction measures={measures} onClick={viewHumanReadable} />
          <HistoryAction measures={measures} onClick={viewMeasureHistory} />
          <CompareVersionsAction
            measures={measures}
            onClick={compareVersions}
          />

          {reviewAction && <PipeSeparator />}
        </>
      )}

      {reviewAction}
    </div>
  );
}
