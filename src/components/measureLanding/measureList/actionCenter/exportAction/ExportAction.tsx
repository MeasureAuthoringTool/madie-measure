import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { grey, blue } from "@mui/material/colors";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
}

export const NOTHING_SELECTED = "Select measure to export";
export const EXPORT_MEASURE = "Export measure";

export default function ExportAction(props: PropTypes) {
  const { measures } = props;
  const [disableExportBtn, setDisableExportBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);

  const validateExportActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableExportBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (measures.length) {
      setDisableExportBtn(false);
      setTooltipMessage(EXPORT_MEASURE);
    }
  }, [measures]);

  useEffect(() => {
    validateExportActionState();
  }, [measures, validateExportActionState]);

  return (
    <Tooltip
      data-testid="export_measure_tooltip"
      title={tooltipMessage}
      onMouseOver={validateExportActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableExportBtn}
          data-testid="export_measure_btn"
        >
          <FileUploadOutlinedIcon
            sx={disableExportBtn ? { color: grey[500] } : { color: blue[500] }}
          />
        </IconButton>
      </span>
    </Tooltip>
  );
}
