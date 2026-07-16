import React from "react";
import { MadieDialog } from "@madie/madie-design-system/dist/react";
import { DialogContent, Typography } from "@mui/material";
import { useOwnerName } from "@madie/madie-util";

const capitalizeFirstLetter = (string) => {
  if (!string) return ""; // Handle empty or null strings
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const LockedMessageModal = ({
  lockedType,
  lockedBy,
  lockedModalOpen,
  setLockedModalOpen,
}) => {
  const displayName = useOwnerName(lockedBy);
  const hasName = displayName !== lockedBy;
  return (
    <MadieDialog
      title={`${capitalizeFirstLetter(lockedType)} currently In-Use`}
      dialogProps={{
        onClose: () => setLockedModalOpen(false),
        open: lockedModalOpen,
      }}
      cancelButtonProps={{
        class: "qpp-c-button qpp-c-button--outline-filled",
        cancelText: "Close",
        "data-testid": `${lockedType}-locked-modal-close-button`,
        maxWidth: "sm",
      }}
      continueButtonProps={""}
    >
      <DialogContent>
        <div data-testid={`${lockedType}-locked-modal-message`}>
          <Typography>
            <div aria-describedby={`${lockedType}-locked-modal-message`}>
              This {lockedType} is currently being edited by{" "}
              {hasName ? `${displayName} (${lockedBy})` : `${lockedBy}`}.
              <br></br>You will be unable to make changes at this time.
            </div>
          </Typography>
        </div>
      </DialogContent>
    </MadieDialog>
  );
};

export default LockedMessageModal;
