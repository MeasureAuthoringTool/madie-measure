import React from "react";
import { Box } from "@mui/system";
import { Button } from "@madie/madie-design-system/dist/react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
} from "@mui/material";
import ExportIcon from "../exportDialog/ExportIcon";

import "../exportDialog/ExportDialog.scss";
const InvalidMeasureNameDialog = ({
  invalidLibraryDialogOpen,
  measureName,
  invalidLibraryErrors,
  onInvalidLibraryNameDialogClose,
}) => {
  return (
    <Dialog
      open={invalidLibraryDialogOpen}
      disableEnforceFocus
      sx={{
        "& .MuiDialog-paper": {
          position: "relative",
          overflow: "visible",
          marginTop: "-20px",
        },
      }}
      maxWidth="sm"
      fullWidth
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "32px 32px 16px 32px",
        }}
      >
        <DialogTitle
          sx={{
            fontFamily: "Rubik",
            fontSize: 24,
            padding: 0,
          }}
        >
          We're sorry!
        </DialogTitle>
      </Box>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <DialogContent sx={{ padding: "32px" }}>
        <div id="invalid-measure-dialog-content">
          <div className="loading-title">
            <span>
              Versioning could <b>not</b> be completed
            </span>
          </div>
          <div className="spinner" style={{ border: "solid 1px #8c8c8c" }}>
            <ExportIcon downloadState="failure" />
            <div>
              <span style={{ fontSize: 14 }}>{measureName}</span>
            </div>
          </div>
          <span className="error-message" data-testid="error-message">
            Measure CQL Library Name is invalid
            <ul>
              {invalidLibraryErrors.map((miss) => (
                <li>{miss}</li>
              ))}
            </ul>
          </span>
        </div>
      </DialogContent>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <DialogActions
        sx={{
          padding: "16px",
          "& >:not(:first-of-type)": {
            marginLeft: "16px",
          },
        }}
      >
        <Button
          onClick={onInvalidLibraryNameDialogClose}
          variant="action"
          style={{ marginTop: 0 }}
          data-testid="invalid-cancel"
        >
          <span>Cancel</span>
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvalidMeasureNameDialog;
