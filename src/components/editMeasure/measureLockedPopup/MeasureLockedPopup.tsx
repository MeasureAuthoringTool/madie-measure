import React from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { DialogContent, Typography } from "@mui/material";

const MeasureLockedPopup = ({
  measureLockedBy,
  lockedMeasurePopupOpen,
  setLockedMeasurePopupOpen,
}) => {
  return (
    <MadieDialog
      title="Measure currently In-Use"
      dialogProps={{
        onClose: () => setLockedMeasurePopupOpen(false),
        open: lockedMeasurePopupOpen,
      }}
      cancelButtonProps={{
        class: "qpp-c-button qpp-c-button--outline-filled",
        cancelText: "Close",
        "data-testid": "measure-locked-popup-close-button",
        maxWidth: "sm",
        showRequiredFieldMessage: true,
      }}
      continueButtonProps={""}
    >
      <DialogContent>
        <div data-testid="measure-locked-popup-message">
          <Typography>
            <div>
              This measure is currently edited by HARP ID {measureLockedBy}.
              <br></br>You will be unable to make changes until the measure has
              been saved.
            </div>
          </Typography>
        </div>
      </DialogContent>
    </MadieDialog>
  );
};

export default MeasureLockedPopup;
