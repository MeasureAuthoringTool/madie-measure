import React from "react";
import { TypeComponentProps } from "./TypeComponentProps";
import { TextField } from "@madie/madie-design-system/dist/react/";
import AddElementButton from "../../../../../../../common/UIOnlyModelAgnostic/AddElementButton";

const UrlComponent = ({
  canEdit,
  fieldRequired,
  label = "URL",
  showAddAttributeButton,
  addTitle,
  handleAddElement,
  ...rest
}: TypeComponentProps) => {
  return (
    <div className="element-editor-add-row">
      <TextField
        required={fieldRequired}
        readOnly={!canEdit}
        id={`url-field-${label}`}
        label={label}
        placeholder={label}
        inputProps={{
          "data-testid": `url-input-field-${label}`,
          "aria-describedby": `url-input-field-helper-text-${label}`,
          required: fieldRequired,
          "aria-required": fieldRequired,
        }}
        data-testid={`url-field-${label}`}
        size="small"
        fullWidth
        {...rest}
      />
      {showAddAttributeButton && addTitle && (
        <AddElementButton name={addTitle} onClick={handleAddElement} />
      )}
    </div>
  );
};

export default UrlComponent;
