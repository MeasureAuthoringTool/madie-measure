import React from "react";
import PropTypes from "prop-types";
import ErrorIcon from "@mui/icons-material/Error";
import { MadieDialog } from "@madie/madie-design-system/dist/react";

const CMSIdentifierPopup = ({ open, onClose, onContinue }) => (
  <MadieDialog
    title="Add a CMS ID?"
    dialogProps={{
      open: open,
      onClose,
      "data-testid": "cms-identifier-dialog",
    }}
    cancelButtonProps={{
      variant: "secondary",
      onClick: onClose,
      cancelText: "No",
      "data-testid": "cms-identifier-dialog-cancel-button",
    }}
    continueButtonProps={{
      variant: "primary",
      type: "submit",
      "data-testid": "cms-identifier-dialog-continue-button",
      continueText: "Yes, Add CMS Identifier",
      onClick: onContinue,
    }}
  >
    <div id="discard-changes-dialog-body">
      <section className="dialog-warning-body">
        {/* <p>This will add .</p> */}
        <p className="strong">
          Are you sure you want to add a CMS ID to this measure?
        </p>
      </section>
      <section className="dialog-warning-action">
        <ErrorIcon />
        <p>This Action cannot be undone.</p>
      </section>
    </div>
  </MadieDialog>
);

CMSIdentifierPopup.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onContinue: PropTypes.func,
};

export default CMSIdentifierPopup;
