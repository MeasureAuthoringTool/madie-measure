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
        variant: "cyan",
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
              This measure is currently edited by HARP ID {measureLockedBy}. You
              will be unable to make changes until it's saved.
            </div>
          </Typography>
        </div>
      </DialogContent>
    </MadieDialog>
  );
};

export default MeasureLockedPopup;
