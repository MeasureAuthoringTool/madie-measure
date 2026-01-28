import React, { useCallback, useRef, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  ClickAwayListener,
  Grow,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";

interface MenuItemType {
  label: string;
  dataTestId: string;
  toImplementFunction: () => void;
}

interface LoadingButtonMenuProps {
  hasErrors: boolean;
  isExecutionContextReady: boolean;
  label: string;
  dataTestId?: string;
  primary?: boolean;
  menuItems: MenuItemType[];
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
}

export default function LoadingButtonWithMenu({
  hasErrors,
  isExecutionContextReady,
  dataTestId,
  label,
  menuItems,
  primary = false,
  setShowOptions,
  showOptions,
}: LoadingButtonMenuProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleShowOptions = useCallback(() => {
    setShowOptions(true);
  }, [setShowOptions]);

  const handleClose = useCallback(() => {
    setShowOptions(false);
  }, [setShowOptions]);

  return (
    <>
      <LoadingButton
        ref={anchorRef}
        sx={{
          textTransform: "none",
          color: primary ? "white" : "#0073c8",
          borderColor: "#0073c8",
          fontFamily: "Rubik, Helvetica, sans-serif",
        }}
        variant="outlined"
        size="large"
        disabled={hasErrors}
        loading={!hasErrors && !isExecutionContextReady}
        loadingPosition="start"
        startIcon={<RefreshIcon />}
        onClick={handleShowOptions}
        data-testid={dataTestId}
        classes={{
          root: `qpp-c-button ${
            primary ? "qpp-c-button--cyan" : "qpp-c-button--outline"
          }`,
        }}
      >
        {label}
      </LoadingButton>
      <Popper
        open={showOptions}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "left top" }}>
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={showOptions}>
                  {menuItems.map((item) => (
                    <MenuItem
                      key={item.dataTestId}
                      data-testid={item.dataTestId}
                      onClick={() => {
                        item.toImplementFunction();
                        handleClose();
                      }}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
