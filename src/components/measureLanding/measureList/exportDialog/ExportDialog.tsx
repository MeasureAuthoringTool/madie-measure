import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Divider,
} from "@mui/material";
import { Box } from "@mui/system";

import { Button } from "@madie/madie-design-system/dist/react";
import ExportIcon from "./ExportIcon";
import "./ExportDialog.scss";

const ExportDialog = ({
  downloadState = "downloading",
  failureMessage,
  measureName,
  open,
  handleContinueDialog,
  handleCancelDialog,
}) => {
  // downloadState will be of "downloading" "success" or "failure"
  // header will be of Export, Success, or We're sorry
  const headerMap = {
    downloading: "Exporting",
    success: "Success",
    warning: "Success",
    failure: "We're sorry!",
  };
  const messageMap = {
    downloading: <span>Please wait! this shouldn't take long.</span>,
    success: <span>Your download has been completed</span>,
    warning: <span>Your download has been completed using the latest translator version instead of the version used at the time the measure was versioned.</span>,
    failure: (
      <span>
        Your download could <b>not</b> be completed
      </span>
    ),
  };
  // loading state will be one of loading, failure, success
  return (
    <Dialog
      open={open}
      disableEnforceFocus // this is required to play nicely with the popup that's already on the page
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
          {headerMap[downloadState]}
        </DialogTitle>
      </Box>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <DialogContent sx={{ padding: "32px" }}>
        <div id="export-dialog-content">
          <div className="loading-title">{messageMap[downloadState]}</div>
          <div className="spinner" style={{ border: "solid 1px #8c8c8c" }}>
            <ExportIcon downloadState={downloadState} />
            <div>
              {/* below appears in one mockup but not UAT */}
              {/* {downloadState === 'downloading' && (
                    <p>Compiling...</p>)} */}
              <span style={{ fontSize: 14 }}>{measureName}</span>
            </div>
          </div>
          {typeof failureMessage == "string" && (
            <span className="error-message" data-testid="error-message">
              {failureMessage}
            </span>
          )}
          {typeof failureMessage == "object" && failureMessage && (
            <span className="error-message" data-testid="error-message">
              Unable to Export measure.
              <ul>
                {failureMessage.map((miss) => (
                  <li>{miss}</li>
                ))}
              </ul>
            </span>
          )}
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
        {(downloadState === "success" || downloadState === "warning") && (
          <Button
            onClick={handleContinueDialog}
            variant="primary"
            style={{ marginTop: 0 }}
          >
            <span>Continue</span>
          </Button>
        )}
        {(downloadState === "failure" || downloadState === "downloading") && (
          <Button
            onClick={handleCancelDialog}
            variant="action"
            style={{ marginTop: 0 }}
          >
            <span>Cancel</span>
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
