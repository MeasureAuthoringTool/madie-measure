import React, { useCallback, useEffect, useState } from "react";
import ElementSelector, { getOptionLabel } from "../element/ElementSelector";
import { ElementDefinition } from "fhir/r4";
import { MadieDialog as Dialog } from "@madie/madie-design-system/dist/react";

export interface AddElementDialogProps {
  open: boolean;
  onClose: any;
  basePath: string;
  options: ElementDefinition[];
  value: ElementDefinition[];
  addElements: Function;
}

const AddElementDialog = (props: AddElementDialogProps) => {
  const { open, onClose, basePath, options, value, addElements } = props;
  const [selectedElements, setSelectedElements] = useState<ElementDefinition[]>(
    []
  );
  useEffect(() => {
    setSelectedElements(value);
  }, [value]);
  const handleChange = useCallback(
    (event, newValue: ElementDefinition[] | null) => {
      const lastElement = newValue[newValue.length - 1];
      // For choice-type elements (path ends with [x]), preserve the original path so
      // buildElementPath can correctly derive the concrete key (e.g. effectiveDateTime).
      if (!lastElement.path?.endsWith("[x]")) {
        lastElement.path =
          basePath + "." + getOptionLabel(lastElement, basePath);
      }
      setSelectedElements(newValue);
    },
    [basePath]
  );
  const handleClose = useCallback(() => {
    setSelectedElements(value);
    onClose();
  }, [onClose, value]);
  const handleAddElements = useCallback(() => {
    addElements(selectedElements);
    onClose();
  }, [selectedElements, onClose, addElements]);

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
        id: "applyBtn",
        "data-testid": "add-element-button-2",
        "aria-label": "apply button",
        variant: "primary",
        onClick: handleAddElements,
        continueText: "Apply",
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
          selectedElements={selectedElements}
          onChange={handleChange}
        />
      </p>
    </Dialog>
  );
};

export default AddElementDialog;
