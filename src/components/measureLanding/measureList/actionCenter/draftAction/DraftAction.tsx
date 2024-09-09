import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";
import { Toast } from "@madie/madie-design-system/dist/react";

import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to draft";
export const DRAFT_MEASURE = "Draft measure";
export const LOOKUP_ERROR = "There was an error checking draftability. ";

export default function DraftAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableDraftBtn, setDisableDraftBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [canDraft, setCanDraft] = useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };

  const validateDraftActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableDraftBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures.length === 1 &&
      !measures[0].measureMetaData.draft &&
      canEdit &&
      canDraft
    ) {
      setDisableDraftBtn(false);
      setTooltipMessage(DRAFT_MEASURE);
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
      if (measureList?.length > 0) {
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
  }, [measures, draftLookup]);

  return (
    <Tooltip
      data-testid="draft-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateDraftActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableDraftBtn}
          data-testid="draft-action-btn"
        >
          <EditCalendarOutlinedIcon
            sx={disableDraftBtn ? { color: grey[500] } : { color: blue[500] }}
          />
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
