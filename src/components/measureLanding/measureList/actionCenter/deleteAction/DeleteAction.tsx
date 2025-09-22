import React, { useCallback, useEffect, useState, useRef } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useFeatureFlags } from "@madie/madie-util";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}

export const NOTHING_SELECTED = "Select measure to delete";
export const DEL_MEASURE = "Delete measure";
export const UNABLE_DELETE = "Unable to delete measure.";
export const UNABLE_DELETE_LOCKED =
  UNABLE_DELETE + " Locked while being edited by <harpID>";

export default function DeleteAction(props: PropTypes) {
  const featureFlags = useFeatureFlags();
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const { measures, canEdit } = props;
  const [disableDeleteBtn, setDisableDeleteBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const validateDeleteActionState = useCallback(async () => {
    // set button state to disabled by default
    setDisableDeleteBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures?.length === 1 &&
      canEdit &&
      measures[0]?.measureMetaData?.draft
    ) {
      if (featureFlags.Locking) {
        const lockMsg: string = await measureServiceApi.checkMeasureLocked(
          measures[0]?.id
        );
        // no locks on measure and test cases when returned message is "OK to proceed"
        if (lockMsg !== "OK to proceed") {
          setDisableDeleteBtn(true);
          // measure lock message is the harpId
          if (!lockMsg.includes("test cases")) {
            setTooltipMessage(
              UNABLE_DELETE_LOCKED.replace("<harpID>", lockMsg)
            );
          } else {
            // test case lock message is "One or more test cases are locked by another user."
            setTooltipMessage(UNABLE_DELETE + " " + lockMsg);
          }
        } else {
          setDisableDeleteBtn(false);
          setTooltipMessage(DEL_MEASURE);
        }
      } else {
        setDisableDeleteBtn(false);
        setTooltipMessage(DEL_MEASURE);
      }
    }
  }, [measures, canEdit, featureFlags.Locking]);

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
