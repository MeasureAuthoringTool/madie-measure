import React, { useCallback, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import LoadingButton from "@mui/lab/LoadingButton";
import { Popover } from "@madie/madie-design-system";

interface MenuItem {
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
  menuItems: MenuItem[];
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
  const [anchorEl, setAnchorEl] = useState(null);

  const handleShowOptions = useCallback((event) => {
    setAnchorEl(event.currentTarget);
    setShowOptions(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowOptions(false);
    setAnchorEl(null);
  }, []);

  return (
    <>
      <LoadingButton
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
      <Popover
        optionsOpen={showOptions}
        anchorEl={anchorEl}
        handleClose={handleClose}
        additionalSelectOptionProps={menuItems}
        onClick={handleClose}
        dataTestId="overlapping-codes-popover"
      />
    </>
  );
}
