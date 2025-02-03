import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { Icon } from "@iconify-icon/react";

import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
}

export const NOTHING_SELECTED = "Select measure to view human readable";
export const VIEW_HUMANREADABLE = "View human readable";

export default function ViewHRAction(props: PropTypes) {
  const { measures, onClick } = props;
  const [disableViewHRBtn, setDisableViewHRBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateViewHRActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableViewHRBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (measures?.length === 1) {
      setDisableViewHRBtn(false);
      setTooltipMessage(VIEW_HUMANREADABLE);
    }
  }, [measures]);

  useEffect(() => {
    validateViewHRActionState();
  }, [measures, validateViewHRActionState]);

  return (
    <Tooltip
      data-testid="view-hr-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateViewHRActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableViewHRBtn}
          data-testid="view-hr-action-btn"
        >
          <Icon
            icon="lucide:file-text"
            data-testid={`view-hr-action-iconify-btn`}
            style={
              disableViewHRBtn ? { color: grey[500] } : { color: blue[700] }
            }
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
