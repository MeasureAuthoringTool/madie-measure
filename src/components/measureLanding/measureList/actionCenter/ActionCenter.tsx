import React, { useCallback, useEffect, useState } from "react";
import { Measure } from "@madie/madie-models";
import DeleteAction from "./deleteAction/DeleteAction";
import ExportAction from "./exportAction/ExportAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import AssociateCmsIdAction from "./associateCmsIdAction/AccociateCmsIdAction";
import ViewHRAction from "./viewHumanReadableAction/ViewHRAction";
import {
  checkUserCanEdit,
  checkUserCanDelete,
  useUserRoles,
} from "@madie/madie-util";
import ShareAction from "./shareAction/ShareAction";
import TransferAction from "./transferAction/TransferAction";
import HistoryAction from "./historyAction/HistoryAction";
import CompareVersionsAction from "./compareVersionsAction/CompareVersionsAction";
import ReviewAction from "./reviewAction/ReviewAction";

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
    updateTargetMeasure,
  } = props;
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isSharedWithUser, setIsSharedWithUser] = useState<boolean>(false);
  const userRoles = useUserRoles();

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
      const elmErrorSeverity = exportType === "Export" ? "Info" : "Error";
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
    // Review click handling, will be implemented in a follow-up story.
  }, []);

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

  return (
    <div data-testid="action-center">
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

      <AssociateCmsIdAction measures={measures} onClick={associateCmsId} />
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
      <ViewHRAction measures={measures} onClick={viewHumanReadable} />
      <TransferAction
        measures={measures}
        onClick={transferMeasure}
        activeTab={activeTab}
      />
      <HistoryAction measures={measures} onClick={viewMeasureHistory} />
      <CompareVersionsAction measures={measures} onClick={compareVersions} />
      <ReviewAction
        measures={measures}
        onClick={reviewMeasure}
        canEdit={canEdit}
      />
    </div>
  );
}
