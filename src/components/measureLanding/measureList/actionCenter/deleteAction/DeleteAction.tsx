import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to delete";
export const DEL_MEASURE = "Delete measure";

export default function DeleteAction(props: PropTypes) {
  const { measures, canEdit } = props;
  const [disableDeleteBtn, setDisableDeleteBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const validateDeleteActionState = useCallback(() => {
    // set button state to disabled by default

    setDisableDeleteBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures?.length === 1 &&
      canEdit &&
      measures[0]?.measureMetaData?.draft
    ) {
      setDisableDeleteBtn(false);
      setTooltipMessage(DEL_MEASURE);
    }
  }, [measures, canEdit]);

  useEffect(() => {
    validateDeleteActionState();
  }, [measures, validateDeleteActionState]);

  return (
    <Tooltip
      data-testid="delete-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateDeleteActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={() => props.onClick()}
          disabled={disableDeleteBtn}
          data-testid="delete-action-btn"
          className="DeleteClass"
        >
          <DeleteOutlinedIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
