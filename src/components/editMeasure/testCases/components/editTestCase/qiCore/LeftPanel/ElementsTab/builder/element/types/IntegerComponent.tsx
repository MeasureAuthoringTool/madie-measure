import React from "react";
import { TextField } from "@madie/madie-design-system/dist/react/";
import "twin.macro";
import "styled-components/macro";
import { TypeComponentProps } from "./TypeComponentProps";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";
import { IconButton, Tooltip } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { getMultipleCardinalityLabel } from "./TypeUtil";
import { useFormikContext } from "formik";
import { IntegerType } from "../typesValidations/FhirNumbers";

interface IntegerComponentProps extends TypeComponentProps {
  integerType: IntegerType;
}

const IntegerComponent = ({
  canEdit,
  fieldRequired,
  label = "Integer",
  integerType,
  helperText,
  error,
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  showDeleteButton = false,
  handleDeleteElement,
  ...props
}: IntegerComponentProps) => {
  const { name, value } = props;

  const formik = useFormikContext();
  // Use name for test IDs in array scenarios (when it contains '['), otherwise use original label
  const formattedLabel = getMultipleCardinalityLabel(label);
  const testIdBase = name && name.includes("[") ? name : label;

  return (
    <div
      className="element-editor-add-row"
      data-component-type="IntegerComponent"
    >
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`integer-field-${formattedLabel}`}
        label={formattedLabel}
        inputProps={{
          "data-testid": `integer-field-input-${testIdBase}`,
          "aria-describedby": `integer-field-input-helper-text-${testIdBase}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`integer-field-${testIdBase}`}
        size="small"
        fullWidth
        error={error}
        helperText={error}
        onChange={(e) => {
          const inputValue = e.target.value;

          // Allow clearing the field
          if (inputValue === "") {
            formik.setFieldValue(name, null);
            return;
          }

          // Signed integers: allow "-" to be entered
          if (integerType === IntegerType.SIGNED && inputValue === "-") {
            formik.setFieldValue(name, inputValue);
            return;
          }

          // Convert to number
          const numericValue = Number(inputValue);

          // For invalid input (like letters), store raw string and form validation will catch
          if (Number.isNaN(numericValue)) {
            formik.setFieldValue(name, inputValue);
          } else {
            formik.setFieldValue(name, numericValue);
          }
        }}
        value={value ?? ""}
      />
      {canEdit && (
        <div tw="mt-5 flex items-center">
          {showDeleteButton && (
            <Tooltip title="Delete" placement="top" arrow>
              <span>
                <IconButton
                  onClick={handleDeleteElement}
                  data-testid={`delete-button-${label}`}
                  aria-label={`delete ${label}`}
                  size="small"
                >
                  <DeleteOutlineIcon fontSize="small" color="error" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {showAddAttributeButton && (
            <AddElementButton name={addTitle} onClick={handleAddElement} />
          )}
        </div>
      )}
    </div>
  );
};

export default IntegerComponent;
