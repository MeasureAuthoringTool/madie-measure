import React, { useCallback, useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@madie/madie-design-system/dist/react";
import { Dialog, IconButton, DialogActions, Divider } from "@mui/material";
import ElementSelector from "../element/ElementSelector";
import { ElementDefinition } from "fhir/r4";

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
  const handleChange = useCallback((event, newValue: ElementDefinition[] | null) => {
    const filteredValues =
      newValue?.filter((option) => !value.includes(option)) ?? [];
      setNewValues((prev) => [...prev, ...filteredValues]);
  },[value]); 
  const handleClose = useCallback(() => {
    setNewValues(value); // Reset to initial values
    onClose();
  },[onClose, value]);
  const handleSave = useCallback(() => {
    saveElements(newValues);
    onClose();
  }, [newValues, onClose, saveElements]);

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
        <h3>Add Attribute(s)</h3>
        <IconButton
          onClick={handleClose}
          data-testid="add-element-close-dialog-button"
        >
          <CloseIcon />
        </IconButton>
      </div>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <p className="message">
        <ElementSelector
          basePath={basePath}
          options={options}
          value={value}
          newValues={newValues}
          onChange={handleChange}
        />
      </p>
      <Divider sx={{ borderColor: "#8c8c8c" }} />
      <DialogActions>
        <Button
          variant="action"
          onClick={handleClose}
          data-testid="cancel-add-element-button"
        >
          Discard Changes
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          data-testid="add-element-button-2"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddElementDialog;
