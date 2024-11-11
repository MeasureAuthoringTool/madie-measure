import React from "react";
import { Backdrop } from "@mui/material";
import {
  MadieDialog,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import ErrorIcon from "@mui/icons-material/Error";

interface InvalidTestCaseDialogProps {
  open: boolean;
  onClose: Function;
  onContinue: Function;
  versionType: String;
  loading: boolean;
}
const InvalidTestCaseDialog = (props: InvalidTestCaseDialogProps) => {
  const { open, onClose, onContinue, versionType, loading } = props;
  return (
    <div>
      <MadieDialog
        title="Version Measures with Invalid Test Cases?"
        dialogProps={{
          open: open,
          onClose: onClose,
          "data-testid": "invalid-test-case-dialog",
        }}
        cancelButtonProps={{
          variant: "secondary",
          onClick: onClose,
          cancelText: "No, I want to fix my Test Cases",
          "data-testid": "invalid-test-dialog-cancel-button",
        }}
        continueButtonProps={{
          variant: "primary",
          type: "submit",
          "data-testid": "invalid-test-dialog-continue-button",
          continueText: "Yes, Version My Measure",
          onClick: () => {
            onContinue(versionType);
          },
        }}
      >
        <div id="discard-changes-dialog-body">
          <section className="dialog-warning-body">
            <p>You have test cases that are invalid.</p>
            <p className="strong">
              Are you sure you want to version with invalid Test Cases?
            </p>
          </section>
          <section className="dialog-warning-action">
            <ErrorIcon />
            <p>Test cases cannot be edited after being versioned.</p>
          </section>
        </div>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
        </Backdrop>
      </MadieDialog>
    </div>
  );
};

export default InvalidTestCaseDialog;
