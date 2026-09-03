import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { Trash2 } from "lucide-react";
interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select a measure to delete";
export const DELETE_MEASURE = "Delete measure";
const UNABLE_TO_DELETE = "Unable to delete measure.";
export const MEASURE_LOCKED_MESSAGE =
  UNABLE_TO_DELETE + " Locked while being edited by";
export const TEST_CASES_LOCKED_MESSAGE =
  UNABLE_TO_DELETE + " One or more test cases are locked by another user.";

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
      if (measures[0].measureLock?.lockedBy) {
        setDisableDeleteBtn(true);
        setTooltipMessage(
          `${MEASURE_LOCKED_MESSAGE} ${measures[0].measureLock.lockedBy}`
        );
      } else if (measures[0].hasLockedTestCases) {
        setDisableDeleteBtn(true);
        setTooltipMessage(TEST_CASES_LOCKED_MESSAGE);
      } else {
        setDisableDeleteBtn(false);
        setTooltipMessage(DELETE_MEASURE);
      }
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
      placement="top"
      slotProps={{
        tooltip: {
          sx: {
            zIndex: 99,
            backgroundColor: "#333",
            "& .MuiTooltip-arrow": {
              color: "#333",
            },
          },
        },
      }}
    >
      <div role="group" style={{ display: "inline-block" }}>
        <IconButton
          onClick={() => props.onClick()}
          disabled={disableDeleteBtn}
          data-testid="delete-action-btn"
          className="DeleteClass"
          aria-label={DELETE_MEASURE}
        >
          <Trash2 size={20} />
        </IconButton>
      </div>
    </Tooltip>
  );
}
