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
  useIsAdminTransferEnabled,
  useFeatureFlags,
} from "@madie/madie-util";
import ShareAction from "./shareAction/ShareAction";
import TransferAction from "./transferAction/TransferAction";
import HistoryAction from "./historyAction/HistoryAction";
import CompareVersionsAction from "./compareVersionsAction/CompareVersionsAction";

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
  updateTargetMeasure: (Measure) => void;
  setCreateVersionDialog: any;
  setDraftMeasureDialog: any;
  setDeleteMeasureDialog: any;
  setViewMeasureHistoryDialog: any;
  setShareDialog: any;
  deleteMeasure: () => void;
  setViewHumanReadableModal: any;
  activeTab: number;
  setTransferDialog: any;
  setCompareVersionsDialog: any;
}
export default function ActionCenter(props: PropTypes) {
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isSharedWithUser, setIsSharedWithUser] = useState<boolean>(false);
  const isAdminTransferEnabled = useIsAdminTransferEnabled?.() ?? false;
  const featureFlags = useFeatureFlags();

  const versionMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setCreateVersionDialog({
        open: true,
        measureId: props.measures[0]?.measureSetId,
      });
    }
  }, [props.measures, props.setCreateVersionDialog, props.updateTargetMeasure]);

  const viewHumanReadable = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setViewHumanReadableModal({
        open: true,
        measureId: props.measures[0]?.measureSetId,
      });
    }
  }, [
    props.measures,
    props.setViewHumanReadableModal,
    props.updateTargetMeasure,
  ]);

  const draftMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setDraftMeasureDialog({
        open: true,
      });
    }
  }, [props.measures, props.setDraftMeasureDialog, props.updateTargetMeasure]);

  const transferMeasure = useCallback(() => {
    if (props.measures?.length > 0) {
      // Use admin transfer if user is admin and doesn't own all selected measures
      const needsAdminTransfer =
        isAdminTransferEnabled && !isOwnerOfAllMeasures(props.measures);
      props.setTransferDialog({
        open: true,
        isAdminTransfer: needsAdminTransfer,
      });
    }
  }, [props.measures, props.setTransferDialog, isAdminTransferEnabled]);

  const exportMeasure = useCallback(
    (exportType: string) => {
      const elmErrorSeverity = exportType === "Export" ? "Info" : "Error";
      if (props.measures?.length === 1) {
        props.updateTargetMeasure(props.measures[0]);
        props.exportMeasure(elmErrorSeverity);
      }
    },
    [props.measures, props.exportMeasure, props.updateTargetMeasure]
  );

  const deleteMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setDeleteMeasureDialog(true);
    }
  }, [props.measures, props.updateTargetMeasure, props.setDeleteMeasureDialog]);

  const shareMeasure = useCallback(
    (actionType: string) => {
      const shareOption =
        actionType === "Unshare" && props.activeTab === 1
          ? "UnshareFromMe"
          : actionType;

      props.setShareDialog({ open: true, option: shareOption });
    },
    [props.setShareDialog, props.activeTab]
  );

  const viewMeasureHistory = useCallback(() => {
    if (props.measures?.length === 1) {
      props.setViewMeasureHistoryDialog(true);
    }
  }, [props.setViewMeasureHistoryDialog, props.measures]);

  const compareVersions = useCallback(() => {
    if (props.measures?.length === 2) {
      props.setCompareVersionsDialog(true);
    }
  }, [props.measures, props.setCompareVersionsDialog]);

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
    setCanEdit(isSelectedMeasureEditable(props.measures));
    setIsOwner(isOwnerOfSelectedMeasures(props.measures));
    setIsSharedWithUser(isSelectedMeasuresSharedWithUser(props.measures));
  }, [props.measures]);

  return (
    <div data-testid="action-center">
      <DeleteAction
        measures={props.measures}
        onClick={deleteMeasure}
        canEdit={
          canEdit &&
          checkUserCanDelete(
            props.measures?.[0]?.measureSet?.owner,
            props.measures?.[0]?.measureMetaData?.draft
          )
        }
      />
      <ExportAction measures={props.measures} onClick={exportMeasure} />

      <ShareAction
        measures={props.measures}
        onClick={shareMeasure}
        isOwner={isOwner}
        isSharedWithUser={isSharedWithUser}
        activeTab={props?.activeTab}
      />

      <AssociateCmsIdAction
        measures={props.measures}
        onClick={props.associateCmsId}
      />
      <VersionAction
        measures={props.measures}
        onClick={versionMeasure}
        canEdit={canEdit}
      />
      <DraftAction
        measures={props.measures}
        onClick={draftMeasure}
        canEdit={canEdit}
      />
      <ViewHRAction measures={props.measures} onClick={viewHumanReadable} />
      <TransferAction
        measures={props.measures}
        onClick={transferMeasure}
        activeTab={props?.activeTab}
      />
      <HistoryAction measures={props.measures} onClick={viewMeasureHistory} />
      {featureFlags?.CompareMeasureVersions && (
        <CompareVersionsAction
          measures={props.measures}
          onClick={compareVersions}
        />
      )}
    </div>
  );
}
