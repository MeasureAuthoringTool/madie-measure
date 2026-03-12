import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  IconButton,
  MenuList,
  MenuItem,
  Popper,
  Grow,
  ClickAwayListener,
  Paper,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import { useFeatureFlags, useUserRoles } from "@madie/madie-util";
import ShareIcon from "../../../../common/ShareIcon";

interface PropTypes {
  measures: Measure[];
  onClick: (option: string) => void;
  isOwner: boolean;
  isSharedWithUser: boolean;
  activeTab: number;
}

// Tooltips that show on My Measures and All Measures tabs
export const NOTHING_SELECTED = "Select a measure to share/unshare";
export const INVALID_SHARE_MEASURE =
  "You cannot share/unshare a measure you do not own";
export const VALID_SHARE_MEASURE = "Share/Unshare";

// Tooltips that show on Shared Measures tabs
export const SHARED_TAB_NOTHING_SELECTED = "Select a measure to unshare";
export const SHARED_TAB_INVALID_UNSHARE_MEASURE =
  "You cannot unshare a measure that you do not have shared access to";
export const SHARED_TAB_UNSHARE = "Unshare";

export default function ShareAction(props: PropTypes) {
  const { measures, isOwner, isSharedWithUser, activeTab, onClick } = props;
  const featureFlags = useFeatureFlags();
  const userRoles = useUserRoles();
  const isAdminShareEnabled =
    featureFlags?.AdminShareMeasures && userRoles?.isAdmin;

  const [disableShareBtn, setDisableShareBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(
    activeTab === 1 ? SHARED_TAB_NOTHING_SELECTED : NOTHING_SELECTED
  );
  const [open, setOpen] = useState(false);
  // move anchorElement to a stable reference that does not change across renders.
  const anchorRef = useRef<HTMLButtonElement>(null);

  const options = activeTab === 1 ? ["Unshare"] : ["Share With", "Unshare"];

  const validateShareActionState = useCallback(() => {
    setDisableShareBtn(true);

    // Admin users with feature flag can share/unshare any measure
    if (isAdminShareEnabled && measures?.length > 0) {
      setDisableShareBtn(false);
      if (activeTab === 1) {
        setTooltipMessage(SHARED_TAB_UNSHARE);
      } else {
        setTooltipMessage(VALID_SHARE_MEASURE);
      }
      return;
    }

    // Non-admin users follow existing logic
    if (activeTab === 1) {
      if (measures?.length === 0) {
        setTooltipMessage(SHARED_TAB_NOTHING_SELECTED);
      } else if (isSharedWithUser) {
        setDisableShareBtn(false);
        setTooltipMessage(SHARED_TAB_UNSHARE);
      } else {
        setTooltipMessage(SHARED_TAB_INVALID_UNSHARE_MEASURE);
      }
    } else if (activeTab === 0 || activeTab === 2) {
      if (measures?.length === 0) {
        setTooltipMessage(NOTHING_SELECTED);
      } else if (isOwner) {
        setDisableShareBtn(false);
        setTooltipMessage(VALID_SHARE_MEASURE);
      } else {
        setTooltipMessage(INVALID_SHARE_MEASURE);
      }
    }
  }, [measures, isOwner, isSharedWithUser, activeTab, isAdminShareEnabled]);

  useEffect(() => {
    validateShareActionState();
  }, [measures, validateShareActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setTooltipMessage(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMenuItemClick = (option: string) => {
    handleClose();
    onClick(option);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Tooltip
      data-testid="share-action-tooltip"
      title={tooltipMessage}
      onMouseOver={validateShareActionState}
      placement="top"
      arrow
    >
      <span>
        <IconButton
          onClick={handleClick}
          disabled={disableShareBtn}
          data-testid="share-action-btn"
          ref={anchorRef}
        >
          <ShareIcon />
        </IconButton>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-start"
          transition
          sx={{
            zIndex: 99,
          }}
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin: "left top",
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="share-menu"
                    onKeyDown={handleListKeyDown}
                  >
                    {options.map((option, i) => (
                      <MenuItem
                        data-testid={`${option}-option`}
                        key={option}
                        onClick={() => handleMenuItemClick(option)}
                      >
                        {option}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </span>
    </Tooltip>
  );
}
