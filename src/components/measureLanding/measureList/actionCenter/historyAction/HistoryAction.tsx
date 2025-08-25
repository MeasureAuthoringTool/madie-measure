import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import HistoryIcon from "@mui/icons-material/History";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
}

export const NOTHING_SELECTED = "Select a measure to view history";
export const VALID_HISTORY_MEASURE = "View History";

export default function HistoryAction(props: PropTypes) {
  const { measures } = props;
  const [disableHistoryBtn, setDisableHistoryBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateHistoryActionState = useCallback(() => {
    setDisableHistoryBtn(true);

    if (measures?.length === 1) {
      setTooltipMessage(VALID_HISTORY_MEASURE);
      setDisableHistoryBtn(false);
    } else {
      setTooltipMessage(NOTHING_SELECTED);
    }
  }, [measures]);

  useEffect(() => {
    validateHistoryActionState();
  }, [measures, validateHistoryActionState]);

  const handleClick = () => {
    props.onClick();
  };

  return (
    <Tooltip
      data-testid="history-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateHistoryActionState}
      placement="top"
      arrow
    >
      <span>
        <IconButton
          onClick={handleClick}
          disabled={disableHistoryBtn}
          data-testid="history-action-btn"
        >
          <HistoryIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
