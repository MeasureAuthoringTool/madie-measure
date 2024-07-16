import React from "react";
import PropTypes from "prop-types";
import ErrorIcon from "@mui/icons-material/Error";
import { MadieDialog } from "@madie/madie-design-system/dist/react";

const CMSIdentifierPopup = ({ open, onClose, onContinue }) => (
  <MadieDialog
    title="Generate CMS ID"
    dialogProps={{
      open: open,
      onClose,
      "data-testid": "cms-identifier-dialog",
    }}
    cancelButtonProps={{
      variant: "secondary",
      onClick: onClose,
      cancelText: "Cancel",
      "data-testid": "cms-identifier-dialog-cancel-button",
    }}
    continueButtonProps={{
      variant: "primary",
      type: "submit",
      "data-testid": "cms-identifier-dialog-continue-button",
      continueText: "Yes, Generate",
      onClick: onContinue,
    }}
  >
    <div id="discard-changes-dialog-body">
      <section className="dialog-warning-body">
        {/* <p>This will add .</p> */}
        <p className="strong">Are you sure you wish to generate a CMS ID?</p>
      </section>
      <section className="dialog-warning-action"></section>
    </div>
  </MadieDialog>
);

CMSIdentifierPopup.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onContinue: PropTypes.func,
};

export default CMSIdentifierPopup;
