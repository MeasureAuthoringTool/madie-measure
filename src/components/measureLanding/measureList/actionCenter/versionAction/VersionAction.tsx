import React, { useCallback, useEffect, useState } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure, Model } from "@madie/madie-models";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import { useFeatureFlags } from "@madie/madie-util";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  canEdit: boolean;
}
export const NOTHING_SELECTED = "Select measure to version";
export const VERSION_MEASURE = "Version measure";
const UNABLE_TO_VERSION = "Unable to version measure.";
export const MEASURE_LOCKED_MESSAGE =
  UNABLE_TO_VERSION + " Locked while being edited by";
export const TEST_CASES_LOCKED_MESSAGE =
  UNABLE_TO_VERSION + " One or more test cases are locked by another user.";

export default function VersionAction(props: PropTypes) {
  const { measures, canEdit, onClick } = props;
  const [disableVersionBtn, setDisableVersionBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const featureFlags = useFeatureFlags();

  const validateVersionActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableVersionBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (
      measures?.length === 1 &&
      measures[0]?.measureMetaData?.draft &&
      canEdit
      /* check if there is not already a Version for that measure set*/
    ) {
      if (featureFlags.Locking) {
        if (measures[0].measureLock?.lockedBy) {
          setDisableVersionBtn(true);
          setTooltipMessage(
            `${MEASURE_LOCKED_MESSAGE} ${measures[0].measureLock.lockedBy}`
          );
        } else if (measures[0].hasLockedTestCases) {
          setDisableVersionBtn(true);
          setTooltipMessage(TEST_CASES_LOCKED_MESSAGE);
        } else {
          setDisableVersionBtn(false);
          setTooltipMessage(VERSION_MEASURE);
        }
      } else {
        setDisableVersionBtn(false);
        setTooltipMessage(VERSION_MEASURE);
      }
    }
  }, [measures, canEdit]);

  useEffect(() => {
    validateVersionActionState();
  }, [measures, validateVersionActionState]);

  return (
    <Tooltip
      data-testid="version-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateVersionActionState}
      arrow
    >
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableVersionBtn}
          data-testid="version-action-btn"
        >
          <AccountTreeOutlinedIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
