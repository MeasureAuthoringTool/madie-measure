import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import { Measure } from "@madie/madie-models";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

interface PropTypes {
  measures: Measure[];
  onClick: (exportType: string) => void;
}

export const NOTHING_SELECTED = "Select measure to export";
export const EXPORT_MEASURE = "Export measure";

export default function ExportAction(props: PropTypes) {
  const { measures, onClick } = props;

  const [disableExportBtn, setDisableExportBtn] = useState(true);
  const [tooltipMessage, setTooltipMessage] = useState(NOTHING_SELECTED);
  const [open, setOpen] = useState(false);
  // move anchorElement to a stable reference that does not change across renders.
  const anchorRef = useRef<HTMLButtonElement>(null);

  const validateExportActionState = useCallback(() => {
    // set button state to disabled by default
    setDisableExportBtn(true);
    setTooltipMessage(NOTHING_SELECTED);
    if (measures?.length === 1) {
      setDisableExportBtn(false);
      setTooltipMessage(EXPORT_MEASURE);
    }
  }, [measures]);

  useEffect(() => {
    validateExportActionState();
  }, [measures, validateExportActionState]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disableExportBtn) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOptionClick = (option: "Export" | "Export for Publishing") => {
    onClick(option);
    handleClose();
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <>
      <Tooltip
        data-testid="export-action-tooltip"
        title={tooltipMessage}
        onMouseOver={validateExportActionState}
        arrow
      >
        <span>
          <IconButton
            onClick={handleClick}
            disabled={disableExportBtn}
            data-testid="export-action-btn"
            ref={anchorRef}
          >
            <FileUploadOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement="bottom-start"
        transition
        disablePortal
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
                  <MenuItem
                    data-testId="export-option"
                    onClick={(e) => {
                      handleOptionClick("Export");
                    }}
                  >
                    Export
                  </MenuItem>
                  <MenuItem
                    data-testId="export-publishing-option"
                    onClick={(e) => {
                      handleOptionClick("Export for Publishing");
                    }}
                  >
                    Export for Publishing
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}
