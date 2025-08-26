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
  useFeatureFlags,
  checkUserCanDelete,
} from "@madie/madie-util";
import ShareAction from "./shareAction/ShareAction";
import TransferAction from "./transferAction/TransferAction";
import HistoryAction from "./historyAction/HistoryAction";

interface PropTypes {
  measures: Measure[];
  associateCmsId: any;
  exportMeasure: (elmErrorSeverity: string) => void;
  updateTargetMeasure: (Measure) => void;
  setCreateVersionDialog: any;
  setDraftMeasureDialog: any;
  setDeleteMeasureDialog: any;
  setShareDialog: any;
  deleteMeasure: () => void;
  setViewHumanReadableModal: any;
  activeTab: number;
  setTransferDialog: any;
}
export default function ActionCenter(props: PropTypes) {
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
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
    //to be implemented
    if (props.measures?.length > 0) {
      props.setTransferDialog({
        open: true,
      });
    }
  }, [props.measures, props.setTransferDialog]);

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
    (option: string) => {
      props.setShareDialog({
        open: true,
        option,
      });
    },
    [props.setShareDialog]
  );

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

  const isOwnerOfSelectedMeasure = (measures) => {
    return (
      measures &&
      measures.every((measure) => {
        return checkUserCanEdit(measure?.measureSet?.owner, []);
      })
    );
  };

  useEffect(() => {
    setCanEdit(isSelectedMeasureEditable(props.measures));
    setIsOwner(isOwnerOfSelectedMeasure(props.measures));
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
      {featureFlags?.TransferMeasure && (
        <TransferAction
          measures={props.measures}
          onClick={transferMeasure}
          activeTab={props?.activeTab}
        />
      )}
      {featureFlags?.MeasureHistory && (
        <HistoryAction measures={props.measures} onClick={() => {}} />
      )}
    </div>
  );
}
