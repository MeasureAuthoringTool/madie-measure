import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import { Measure, Model } from "@madie/madie-models";
import DeleteAction from "./deleteAction/DeleteAction";
import ExportAction from "./exportAction/ExportAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import AssociateCmsIdAction from "./associateCmsIdAction/AccociateCmsIdAction";
import {
  checkUserCanEdit,
  useFeatureFlags,
  useOktaTokens,
} from "@madie/madie-util";

interface PropTypes {
  measures: Measure[];
  associateCmsId: any;
  exportMeasure: () => void;
  updateTargetMeasure: (Measure) => void;
  setCreateVersionDialog: any;
  setDraftMeasureDialog: any;
}
export default function ActionCenter(props: PropTypes) {
  const featureFlags = useFeatureFlags();
  const { getUserName } = useOktaTokens();
  const [canEdit, setCanEdit] = useState<boolean>(false);

  const versionMeasure = useCallback(() => {
    if (props.measures?.length === 1) {
      props.updateTargetMeasure(props.measures[0]);
      props.setCreateVersionDialog({
        open: true,
        measureId: props.measures[0]?.measureSetId,
      });
    }
  }, [props.measures, props.setCreateVersionDialog, props.updateTargetMeasure]);

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
        onClick={() => {}}
        canEdit={canEdit}
      />
      <ExportAction measures={props.measures} onClick={exportMeasure} />
      <DraftAction
        measures={props.measures}
        onClick={draftMeasure}
        canEdit={canEdit}
      />
      <VersionAction
        measures={props.measures}
        onClick={versionMeasure}
        canEdit={canEdit}
      />
      {featureFlags.MeasureListCheckboxes && featureFlags.associateMeasures && (
        <AssociateCmsIdAction
          measures={props.measures}
          onClick={props.associateCmsId}
        />
      )}
    </div>
  );
}
