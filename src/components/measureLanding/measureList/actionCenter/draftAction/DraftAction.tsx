import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";

import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to draft";
export const DRAFT_MEASURE = "Draft measure";

export default function DraftAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableDraftBtn, setDisableDraftBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [canDraftLookup, setCanDraftLookup] = useState<object>({});
  const [canDraft, setCanDraft] = useState<boolean>(false);

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
    }
  }, [measures, canEdit, canDraft]);

  useEffect(() => {
    validateDraftActionState();
  }, [measures, validateDraftActionState]);

  const draftLookup = useCallback(
    async (measureList: Measure[]) => {
      const measureSetList = measureList.map((m) => m.measureSetId);
      if (measureList.length > 0) {
        try {
          const results = await measureServiceApi.fetchMeasureDraftStatuses(
            measureSetList
          );
          if (results) {
            setCanDraft(results[measureList[0].measureSetId] ?? false);
          }
        } catch (error) {
          console.error("Error fetching draft statuses: ", error);
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
      data-testid="draft_measure_tooltip"
      title={tooltipMessage}
      onMouseOver={validateDraftActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableDraftBtn}
          data-testid="draft_measure_btn"
        >
          <EditCalendarOutlinedIcon
            sx={disableDraftBtn ? { color: grey[500] } : { color: blue[500] }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
