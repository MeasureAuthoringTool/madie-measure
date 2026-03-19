import React, { useEffect, useState, useCallback } from "react";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import SwapVertOutlinedIcon from "@mui/icons-material/SwapVertOutlined";
import {
  checkUserCanEdit,
  useFeatureFlags,
  useUserRoles,
} from "@madie/madie-util";

interface PropTypes {
  measures: Measure[];
  onClick: () => void;
  activeTab: number;
}

const isOwnerOfSelectedMeasure = (measures) => {
  return (
    measures &&
    measures.every((measure) => {
      return checkUserCanEdit(measure?.measureSet?.owner, []);
    })
  );
};

export const NOTHING_SELECTED = "Select a measure to transfer";
export const CANNOT_TRANSFER = "You cannot transfer a measure you do not own";
export const MORE_THAN_ONE_NOT_OWNED =
  "You cannot transfer a measure you do not own, you have selected at least 1 measure that you do not own";
export const TRANSFER = "Transfer";

export default function TransferAction(props: PropTypes) {
  const { measures, activeTab } = props;
  const [disableTransferBtn, setDisableTransferBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const featureFlags = useFeatureFlags();
  const userRoles = useUserRoles();

  const validateTransferActionState = useCallback(() => {
    setDisableTransferBtn(false);
    setTooltipMessage(TRANSFER);

    // If no measures selected, disable the button
    if (measures?.length === 0) {
      setDisableTransferBtn(true);
      setTooltipMessage(NOTHING_SELECTED);
      return;
    }

    // Admin users with feature flag enabled can transfer any measure
    const isAdminTransferEnabled =
      featureFlags?.AdminTransferMeasure && userRoles?.isAdmin;
    if (isAdminTransferEnabled) {
      setDisableTransferBtn(false);
      setTooltipMessage(TRANSFER);
      return;
    }

    // Non-admin users: apply existing business rules
    if (activeTab === 1) {
      // Shared Measures tab - cannot transfer
      setTooltipMessage(CANNOT_TRANSFER);
      setDisableTransferBtn(true);
    } else if (activeTab === 2) {
      // All Measures tab - must be owner of all selected
      if (!isOwnerOfSelectedMeasure(measures)) {
        setTooltipMessage(MORE_THAN_ONE_NOT_OWNED);
        setDisableTransferBtn(true);
      }
    }
  }, [measures, activeTab, featureFlags, userRoles]);

  useEffect(() => {
    validateTransferActionState();
  }, [measures, validateTransferActionState, activeTab]);

  return (
    <Tooltip
      data-testid="transfer-action-tooltip"
      title={tooltipMessage}
      arrow
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
      <span>
        <IconButton
          onClick={props.onClick}
          disabled={disableTransferBtn}
          data-testid="transfer-action-btn"
        >
          <SwapVertOutlinedIcon style={{ transform: "rotate(90deg)" }} />
        </IconButton>
      </span>
    </Tooltip>
  );
}
