import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import { Measure, Model } from "@madie/madie-models";
import DeleteAction from "./deleteAction/DeleteAction";
import ExportAction from "./exportAction/ExportAction";
import DraftAction from "./draftAction/DraftAction";
import VersionAction from "./versionAction/VersionAction";
import AssociateCmsIdAction from "./associateCmsIdAction/AccociateCmsIdAction";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  checkUserCanEdit,
  useFeatureFlags,
  useOktaTokens,
} from "@madie/madie-util";

interface PropTypes {
  measures: Measure[];
  associateCmsId: any;
}
export default function ActionCenter(props: PropTypes) {
  const featureFlags = useFeatureFlags();
  const { getUserName } = useOktaTokens();
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [canDraftLookup, setCanDraftLookup] = useState<object>({});
  const canDraftRef = useRef<object>();
  canDraftRef.current = canDraftLookup;

  const isSelectedMeasureEditable = (measures) => {
    return !(measures.some = (measure) => {
      return !checkUserCanEdit(
        measure?.measureSet?.owner,
        measure?.measureSet?.acls
      );
    });
  };

  const draftLookup = useCallback(
    async (measureList) => {
      const measureSetList = measureList.map((m) => m.measureSetId);
      try {
        const results = await measureServiceApi.fetchMeasureDraftStatuses(
          measureSetList
        );
        if (results) {
          setCanDraftLookup(results);
          console.log(results.keys(0));
        }
      } catch (e) {
        console.warn("Error fetching draft statuses: ", e);
      }
    },
    [measureServiceApi]
  );

  useEffect(() => {
    setCanEdit(!isSelectedMeasureEditable(props.measures));
    draftLookup(props.measures);
    console.log(canDraftRef);
  }, [props.measures]);

  return (
    <div>
      <DeleteAction
        measures={props.measures}
        onClick={() => {}}
        canEdit={canEdit}
      />
      <ExportAction measures={props.measures} onClick={() => {}} />
      <DraftAction
        measures={props.measures}
        onClick={() => {}}
        canEdit={canEdit}
      />
      <VersionAction
        measures={props.measures}
        onClick={() => {}}
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
