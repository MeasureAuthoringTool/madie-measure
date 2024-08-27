import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to version";
export const VERSION_MEASURE = "Version measure";

export default function VersionAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableVersionBtn, setDisableVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateVersionActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableVersionBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures.length === 1 &&
      measures[0].measureMetaData.draft &&
      canEdit
      /* check if there is not already a Version for that measure set*/
    ) {
      setDisableVersionBtn(false);
      setTooltipMessage(VERSION_MEASURE);
    }
  }, [measures, canEdit]);

  useEffect(() => {
    validateVersionActionState();
  }, [measures, validateVersionActionState]);

  return (
    <Tooltip
      data-testid="Version_measure_tooltip"
      title={tooltipMessage}
      onMouseOver={validateVersionActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableVersionBtn}
          data-testid="Version_measure_btn"
        >
          <AccountTreeOutlinedIcon
            sx={disableVersionBtn ? { color: grey[500] } : { color: blue[500] }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
