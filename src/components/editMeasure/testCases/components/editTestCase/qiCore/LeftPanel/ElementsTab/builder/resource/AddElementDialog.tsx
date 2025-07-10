import React, { useCallback, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, DialogActions, Divider } from "@mui/material";
import ElementSelector, { getOptionLabel } from "../element/ElementSelector";
import { ElementDefinition } from "fhir/r4";
import { MadieDialog as Dialog } from "@madie/madie-design-system";

export interface AddElementDialogProps {
  open: boolean;
  onClose: any;
  basePath: string;
  options: ElementDefinition[];
  value: ElementDefinition[];
  saveElements: Function;
}

const AddElementDialog = (props: AddElementDialogProps) => {
  const { open, onClose, basePath, options, value, saveElements } = props;

  const [newValues, setNewValues] = useState<ElementDefinition[]>([]);
  useEffect(() => {
    setNewValues(value);
  }, [value]);
  const handleChange = useCallback(
    (event, newValue: ElementDefinition[] | null) => {
      newValue[newValue.length - 1].path =
        basePath +
        "." +
        getOptionLabel(newValue[newValue.length - 1], basePath);
      setNewValues(newValue);
    },
    [value]
  );
  const handleClose = useCallback(() => {
    setNewValues(value);
    onClose();
  }, [onClose, value]);
  const handleSave = useCallback(() => {
    saveElements(newValues);
    onClose();
  }, [newValues, onClose, saveElements]);

  return (
    <Dialog
      title="Add Attribute(s)"
      dialogProps={{
        open,
        onClose,
        maxWidth: "sm",
        fullWidth: true,
        sx: {
          "& .MuiDialog-paper": {
            height: "70vh",
            maxHeight: "900px",
          },
        },
      }}
      cancelButtonProps={{
        id: "discardBtn",
        "data-testid": "cancel-add-element-button",
        "aria-label": "discard button",
        variant: "action",
        onClick: handleClose,
        cancelText: "Discard Changes",
      }}
      continueButtonProps={{
        id: "saveBtn",
        "data-testid": "add-element-button-2",
        "aria-label": "save button",
        variant: "primary",
        onClick: handleSave,
        continueText: "Save",
      }}
      sx={{
        display: "flex",
        flexDirection: "column",
        "& .MuiDialog-paper": {
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
        ".message": {
          flex: "1 1 auto",
          overflow: "hidden",
          mt: 2,
          mx: 3.75,
          mb: 2,
          position: "relative",
          "& .MuiAutocomplete-root": {
            height: "100%",
          },
          "& .MuiAutocomplete-inputRoot": {
            maxHeight: "calc(100% - 32px)",
            overflow: "auto",
          },
        },
        ".MuiDialogActions-root": {
          flex: "0 0 auto",
          py: 2,
          px: 4.25,
          borderTop: "1px solid #E0E0E0",
          ".qpp-c-button": {
            ml: 2.375,
          },
        },
      }}
    >
      <p className="message">
        <ElementSelector
          basePath={basePath}
          options={options}
          value={value}
          newValues={newValues}
          onChange={handleChange}
        />
      </p>
    </Dialog>
  );
};

export default AddElementDialog;
