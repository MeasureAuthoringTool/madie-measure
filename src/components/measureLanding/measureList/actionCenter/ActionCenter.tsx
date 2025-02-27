import React, { useCallback, useEffect, useState } from "react";
import { Measure } from "@madie/madie-models";
import DeleteAction from "./deleteAction/DeleteAction";
import ExportAction from "./exportAction/ExportAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import AssociateCmsIdAction from "./associateCmsIdAction/AccociateCmsIdAction";
import ViewHRAction from "./viewHumanReadableAction/ViewHRAction";
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";
import ShareAction from "./shareAction/ShareAction";

interface PropTypes {
  measures: Measure[];
  associateCmsId: any;
  exportMeasure: () => void;
  updateTargetMeasure: (Measure) => void;
  setCreateVersionDialog: any;
  setDraftMeasureDialog: any;
  setDeleteMeasureDialog: any;
  setShareDialog: any;
  deleteMeasure: () => void;
  setViewHumanReadableModal: any;
}
export default function ActionCenter(props: PropTypes) {
  const [canEdit, setCanEdit] = useState<boolean>(false);
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

  const exportMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.exportMeasure();
    }
  }, [props.measures, props.exportMeasure, props.updateTargetMeasure]);

  const deleteMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setDeleteMeasureDialog(true);
    }
  }, [props.measures, props.updateTargetMeasure, props.setDeleteMeasureDialog]);

  const shareMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setShareDialog(true);
    }
  }, [props.measures, props.updateTargetMeasure, props.setShareDialog]);

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

  useEffect(() => {
    setCanEdit(isSelectedMeasureEditable(props.measures));
  }, [props.measures]);

  return (
    <div data-testid="action-center">
      <DeleteAction
        measures={props.measures}
        onClick={deleteMeasure}
        canEdit={canEdit}
      />
      <ExportAction measures={props.measures} onClick={exportMeasure} />

      {featureFlags?.ShareMeasure && (
        <ShareAction
          measures={props.measures}
          onClick={shareMeasure}
          canEdit={canEdit}
        />
      )}

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
    </div>
  );
}
