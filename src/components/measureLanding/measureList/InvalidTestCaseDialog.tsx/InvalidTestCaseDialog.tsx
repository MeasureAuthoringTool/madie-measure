import React from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import ErrorIcon from "@mui/icons-material/Error";

interface InvalidTestCaseDialogProps {
  open: boolean;
  onClose: Function;
  onContinue: Function;
}
const InvalidTestCaseDialog = (props: InvalidTestCaseDialogProps) => {
  const { open, onClose, onContinue } = props;
  return (
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
        "data-testid": "discard-dialog-cancel-button",
      }}
      continueButtonProps={{
        variant: "primary",
        type: "submit",
        "data-testid": "discard-dialog-continue-button",
        continueText: "Yes, Version My Measure",
        onClick: onContinue,
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
    </MadieDialog>
  );
};

export default InvalidTestCaseDialog;
