import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";

import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to draft";
export const DRAFT_MEASURE = "Draft measure";

export default function DraftAction(props: PropTypes) {
  const { measures } = props;
  const [disableDraftBtn, setDisableDraftBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const validateDraftActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableDraftBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures.length === 1 &&
      !measures[0].measureMetaData.draft &&
      props.canEdit
      /* && check if there is not already a draft for that measure set*/
    ) {
      setDisableDraftBtn(false);
      setTooltipMessage(DRAFT_MEASURE);
    }
  }, [measures, userName]);

  useEffect(() => {
    validateDraftActionState();
  }, [measures, validateDraftActionState]);

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
