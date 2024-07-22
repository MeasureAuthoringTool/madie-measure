import React from "react";
import PropTypes from "prop-types";
import ErrorIcon from "@mui/icons-material/Error";
import { MadieDialog } from "@madie/madie-design-system/dist/react";

const AssociateCmsIdConfirmationDialog = ({ open, onClose, onContinue }) => (
  <MadieDialog
    title="Are you sure?"
    dialogProps={{
      open: open,
      onClose,
      "data-testid": "associate-cms-identifier-confirming-dialog",
    }}
    cancelButtonProps={{
      onClick: onClose,
      cancelText: "Cancel",
      "data-testid": "associate-cms-identifier-confirming-dialog-cancel-button",
    }}
    continueButtonProps={{
      type: "submit",
      "data-testid":
        "associate-cms-identifier-confirming-dialog-continue-button",
      continueText: "Associate Measures",
      onClick: onContinue,
    }}
  >
    <div id="discard-changes-dialog-body">
      <section className="dialog-warning-body">
        <p>You are about to associate measures.</p>
      </section>
      <section className="dialog-warning-action">
        <ErrorIcon />
        <p>This Action cannot be undone.</p>
      </section>
    </div>
  </MadieDialog>
);

AssociateCmsIdConfirmationDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onContinue: PropTypes.func,
};

export default AssociateCmsIdConfirmationDialog;
