import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import ShareIcon from "../../../../common/ShareIcon";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to share";
export const SHARE_MEASURE = "Share measure";

export default function ShareAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableShareBtn, setDisableShareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateShareActionState = useCallback(() => {
    setDisableShareBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (measures?.length === 1 && canEdit) {
      setDisableShareBtn(false);
      setTooltipMessage(SHARE_MEASURE);
    }
  }, [measures, canEdit]);

  useEffect(() => {
    validateShareActionState();
  }, [measures, validateShareActionState]);

  return (
    <Tooltip
      data-testid="share-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateShareActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={() => props.onClick()}
          disabled={disableShareBtn}
          data-testid="share-action-btn"
        >
          <ShareIcon color={disableShareBtn ? "#8C8C8C" : "#0073C8"} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
