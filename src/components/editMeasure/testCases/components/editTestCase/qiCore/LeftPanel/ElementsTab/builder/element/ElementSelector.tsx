import React from "react";
import { AutoComplete } from "@madie/madie-design-system/dist/react";
import { Checkbox, TextField, Chip } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { ElementDefinition } from "fhir/r4";
import * as _ from "lodash";
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface ElementSelectorProps {
  basePath: string;
  options: ElementDefinition[];
  value: ElementDefinition[];
  newValues: ElementDefinition[];
  onChange: (event, newValue: ElementDefinition[] | null) => void;
}

/**
 * Prepares the label for element selector options
 * for slice- it will be slice:sliceName. e.g. Patient.extension:race results into extension:race
 * for regular element- it will be the path of an element. e.g. Patient.gender results into gender
 */
export const getOptionLabel = (option: ElementDefinition, basePath: string) => {
  const label = option.path?.substring(basePath.length + 1);
  if (option.sliceName) {
    //to prevent label like: extension:race:race
    if (!label.includes(option.sliceName)) {
      return `${label}:${option.sliceName}`;
    } else {
      return label;
    }
  }
  if (label.endsWith("[x]")) {
    return `${label.substring(0, label.length - 3)}${_.upperFirst(
      option.type[0].code
    )}`;
  }
  return label;
};

//helper to get the base label for choice types
const getChoiceBaseLabel = (option: ElementDefinition, basePath: string) => {
  const label = option.path?.substring(basePath.length + 1);
  if (label.endsWith("[x]")) {
    return label.substring(0, label.length - 3);
  }
  // for already selected options, reconstruct base label if possible
  // e.g., performedRange -> performed
  const match = label.match(/^(.*?)[A-Z][a-zA-Z0-9]*$/);
  if (match) {
    return match[1];
  }
  return null;
};

const ElementSelector = ({
  basePath,
  options,
  value,
  newValues,
  onChange,
}: ElementSelectorProps) => {
  return (
    <>
      <AutoComplete
        sx={{
          "& .MuiAutocomplete-option[aria-disabled='true']": {
            color: "00CC00",
          },
        }}
        slotProps={{
          paper: {
            sx: {
              "& .MuiAutocomplete-option[aria-disabled='true']": {
                opacity: "1 !important",
                backgroundColor: "#FFF !important",
                color: "#767676 !important",
                "& .MuiCheckbox-root": {
                  color: "#767676 !important",
                },
              },
              "& .MuiAutocomplete-option[aria-selected='true']": {
                backgroundColor: "#FFF !important",
              },
            },
          },
        }}
        disableClearable={true}
        multiple
        open={true}
        label="Attribute Selector"
        fullWidth
        limitTags={2}
        id="resource-element-selector-autocomplete"
        options={options}
        value={newValues}
        onChange={onChange}
        disableCloseOnSelect
        getOptionLabel={(option) => getOptionLabel(option, basePath)}
        getOptionDisabled={(option) => {
          if (value.includes(option)) return true;
          // Disable if another choice type with same base is selected
          const base = getChoiceBaseLabel(option, basePath);
          if (base) {
            // if any other option with same base is selected, and this option is not selected, disable
            // find if any selected option with same base but different code
            const isOtherSelected = newValues.some(
              (value) =>
                value !== option && getChoiceBaseLabel(value, basePath) === base
            );
            if (isOtherSelected) return true;
          }
          return false;
        }}
        ListboxProps={{
          style: { height: "40vh", maxHeight: "700px" },
        }}
        renderOption={(props, option, { selected }) => {
          return (
            <li {...props}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {getOptionLabel(option, basePath)}
            </li>
          );
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index }); // Remove onDelete from destructuring
            const isDisabled = value.includes(option);
            return (
              <Chip
                sx={
                  isDisabled
                    ? { opacity: "1.0 !important" }
                    : { backgroundColor: "#2a8cdb !important", color: "white" }
                }
                key={key}
                label={getOptionLabel(option, basePath)}
                {...tagProps}
                disabled={isDisabled}
                onDelete={isDisabled ? null : tagProps.onDelete} // Use null instead of undefined
                deleteIcon={isDisabled ? null : undefined}
                data-testid={`${
                  isDisabled ? "disabled-" : ""
                }element-selector-${getOptionLabel(option, basePath)}-chip`}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Attributes"
            onKeyDown={(e) => {
              // this is to prevent backspace from removing disabled
              if (
                e.key === "Backspace" &&
                e.target instanceof HTMLInputElement &&
                e.target.value === "" &&
                newValues.length > 0
              ) {
                const lastChip = newValues[newValues.length - 1];
                if (value.includes(lastChip)) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }
            }}
          />
        )}
      />
    </>
  );
};

export default ElementSelector;
