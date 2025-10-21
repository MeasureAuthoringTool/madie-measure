import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import { useMeasureServiceApi } from "@madie/madie-util";
import { Toast } from "@madie/madie-design-system/dist/react";

import _ from "lodash";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to draft";
export const DRAFT_MEASURE = "Draft measure";
export const LOOKUP_ERROR = "There was an error checking draftability. ";
export const MODEL_MISMATCH =
  "You cannot draft a 4.1.1 measure when a 6.0.0 version is available";

export default function DraftAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableDraftBtn, setDisableDraftBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [canDraft, setCanDraft] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  // if a a QICore6 measure exists, only QICore 6 can be selected from draft dialog.
  const isQiCore6MeasuresInMeasureSet = async (measureSetId) => {
    const results = await measureServiceApi.getMeasuresByMeasureSetId(
      measureSetId
    );
    return (
      results?.some((measure) => measure.model === "QI-Core v6.0.0") ?? false
    );
  };

  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };
  const validateDraftActionState = useCallback(async () => {
    setDisableDraftBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    const selectedMeasure = measures?.[0];
    if (
      measures?.length === 1 &&
      !selectedMeasure?.measureMetaData.draft &&
      canEdit &&
      canDraft
    ) {
      // if it's a 6
      if (selectedMeasure.model === "QI-Core v6.0.0") {
        // set
        setDisableDraftBtn(false);
        setTooltipMessage(DRAFT_MEASURE);
        // we want to only allow options to include 6.0
      } else if (selectedMeasure.model === "QI-Core v4.1.1") {
        const areAnyQiCore6 = await isQiCore6MeasuresInMeasureSet(
          selectedMeasure.measureSetId
        );
        if (areAnyQiCore6) {
          setDisableDraftBtn(true);
          setTooltipMessage(MODEL_MISMATCH);
        } else {
          setDisableDraftBtn(false);
          setTooltipMessage(DRAFT_MEASURE);
        }
        // its qdm
      } else {
        setDisableDraftBtn(false);
        setTooltipMessage(DRAFT_MEASURE);
      }
    } else if (toastMessage) {
      setTooltipMessage(LOOKUP_ERROR);
    }
  }, [measures, canEdit, canDraft]);

  useEffect(() => {
    validateDraftActionState();
  }, [measures, validateDraftActionState]);

  const draftLookup = useCallback(
    async (measureList: Measure[]) => {
      const measureSetList = measureList?.map((m) => m.measureSetId);
      if (!_.isEmpty(measureList)) {
        try {
          const results = await measureServiceApi.fetchMeasureDraftStatuses(
            measureSetList
          );
          if (results) {
            setCanDraft(results[measureList[0].measureSetId] ?? false);
          }
        } catch (error) {
          console.error("Error fetching draft statuses: ", error);
          setToastMessage("Error fetching draft statuses: " + error);
          setToastOpen(true);
          setDisableDraftBtn(true);
        }
      }
    },
    [measureServiceApi]
  );

  useEffect(() => {
    draftLookup(measures);
  }, [measures.length, draftLookup]);

  return (
    <Tooltip data-testid="draft-action-tooltip" title={tooltipMessage} arrow>
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableDraftBtn}
          data-testid="draft-action-btn"
        >
          <EditCalendarOutlinedIcon />
          <Toast
            toastKey="draft-button-error-toast"
            toastType="danger"
            testId="draft-button-error-toast-text"
            open={toastOpen}
            message={toastMessage}
            onClose={onToastClose}
            autoHideDuration={6000}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
