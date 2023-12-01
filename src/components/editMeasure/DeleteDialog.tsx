import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@madie/madie-design-system/dist/react";
import { Dialog, IconButton, DialogActions, Divider } from "@mui/material";

export interface DeleteDialogProps {
  open: boolean;
  onClose: any;
  measureName: String;
  deleteMeasure: Function;
}

const DeleteDialog = (props: DeleteDialogProps) => {
  const { open, onClose, measureName, deleteMeasure } = props;
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      sx={{
        display: "flex",
        flexDirection: "column",
        ".top-row": {
          display: "flex",
          flexDirection: "row",
          flexGrow: 1,
          justifyContent: "space-between",
          px: 4,
          py: 3,
          h3: {
            color: "#222222",
            mb: 0,
            mt: 1,
          },
          ".MuiButtonBase-root": {
            ".MuiSvgIcon-root": {
              color: "#242424",
            },
          },
        },
        ".message": {
          mt: 4.5,
          mx: 3.75,
          mb: 12.5,
          fontSize: 16,
        },
        ".MuiDialogActions-root": {
          py: 2,
          px: 4.25,
          ".qpp-c-button": {
            ml: 2.375,
          },
        },
      }}
    >
      <div className="top-row">
        <h3>Delete Measure</h3>
        <IconButton
          onClick={onClose}
          data-testid="delete-measure-dialog-button"
        >
          <CloseIcon />
        </IconButton>
      </div>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <p className="message">
        Are you sure you want to delete <strong>{measureName}?</strong>
      </p>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <DialogActions>
        <Button
          variant="secondary"
          onClick={onClose}
          data-testid="cancel-delete-measure-button"
        >
          Cancel
        </Button>
        <Button
          variant="danger-primary"
          onClick={deleteMeasure}
          data-testid="delete-measure-button-2"
        >
          Yes, Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
