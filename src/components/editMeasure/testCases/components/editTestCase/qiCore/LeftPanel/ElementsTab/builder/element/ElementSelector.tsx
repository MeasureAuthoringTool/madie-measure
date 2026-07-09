import React, { useMemo } from "react";
import { AutoComplete } from "@madie/madie-design-system/dist/react";
import { Checkbox, TextField, Chip } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { ElementDefinition } from "fhir/r4";
import { stripAllIndexes } from "../../../../../../../api/fhirDefinitionServiceUtilities";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface ElementSelectorProps {
  basePath: string;
  options: ElementDefinition[];
  selectedElements: ElementDefinition[];
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
    return label;
  }
  return label;
};

//helper to get the base label for choice types
export const getChoiceBaseLabel = (
  option: ElementDefinition,
  basePath: string
) => {
  const label = option.id?.substring(basePath.length + 1);

  // If this is an original choice type definition with [x]
  if (label.endsWith("[x]")) {
    return label.substring(0, label.length - 3);
  }
  return null;
};

const ElementSelector = ({
  basePath,
  options,
  selectedElements,
  onChange,
}: ElementSelectorProps) => {
  // Create a map of selected element IDs for efficient lookup
  const selectedOptions = useMemo(() => {
    const ids = new Map<string, ElementDefinition>();
    selectedElements.forEach((v) => {
      if (v.id) {
        const id = stripAllIndexes(v.id);
        ids.set(id, v);
      }
    });
    return ids;
  }, [selectedElements]);

  const isInValue = (option: ElementDefinition) => {
    if (!option.id || !selectedOptions.has(option.id)) {
      return false;
    }
    // for choice types, multiple choices share the same id, therefore need to check type as well
    if (option.id.includes("[x]")) {
      const selectedOption = selectedOptions.get(option.id);
      return selectedOption?.type === option?.type;
    }
    return true;
  };

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
                color: "#5b5b5b !important",
                "& .MuiCheckbox-root": {
                  color: "#5b5b5b !important",
                },
              },
              "& .MuiAutocomplete-option[aria-disabled='true'][aria-selected='true']":
                {
                  backgroundColor: "#FFF !important",
                },
            },
          },
        }}
        disableClearable={true}
        multiple
        open={true}
        label="Attribute Selector"
        helperText="To delete attributes, use the Attribute Action Center located within the Attribute Edit Card."
        fullWidth
        limitTags={2}
        id="resource-element-selector-autocomplete"
        options={options}
        value={selectedElements}
        onChange={onChange}
        disableCloseOnSelect
        getOptionLabel={(option) => getOptionLabel(option, basePath)}
        getOptionDisabled={(option) => {
          if (isInValue(option)) return true;
          // Disable if another choice type with same base is selected
          if (option.min === 1) {
            return true;
          }
          if (option.id.includes("[x]")) {
            const base = getChoiceBaseLabel(option, basePath);
            // if any other option with same base is selected, and this option is not selected, disable
            // find if any selected option with same base but different code
            const isOtherSelected = selectedElements.some(
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
          const isDisabled = isInValue(option);
          const isChecked = selected || isDisabled;
          return (
            <li
              {...props}
              style={{
                ...props.style,
                color: isDisabled ? "#5b5b5b" : undefined,
                opacity: isDisabled ? 1 : undefined,
              }}
              aria-label={
                isDisabled
                  ? `${getOptionLabel(
                      option,
                      basePath
                    )} - previously saved and cannot be modified`
                  : undefined
              }
            >
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={isChecked}
                disabled={isDisabled}
                aria-label={
                  isDisabled
                    ? `${getOptionLabel(
                        option,
                        basePath
                      )} checkbox - already selected`
                    : undefined
                }
              />
              {getOptionLabel(option, basePath)}
            </li>
          );
        }}
        renderTags={(tagValue, getTagProps) => {
          const seenPaths = new Set<string>();
          return tagValue
            .filter((option) => {
              const path = option?.path;
              if (seenPaths.has(path)) {
                return false;
              }
              seenPaths.add(path);
              return true;
            })
            .map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const isDisabled = isInValue(option);
              return (
                <Chip
                  sx={
                    isDisabled
                      ? { opacity: "1.0 !important" }
                      : {
                          backgroundColor: "#2a8cdb !important",
                          color: "white",
                        }
                  }
                  key={key}
                  label={getOptionLabel(option, basePath)}
                  {...tagProps}
                  disabled={isDisabled}
                  onDelete={isDisabled ? null : tagProps.onDelete}
                  deleteIcon={isDisabled ? null : undefined}
                  data-testid={`${
                    isDisabled ? "disabled-" : ""
                  }element-selector-${getOptionLabel(option, basePath)}-chip`}
                />
              );
            });
        }}
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
                selectedElements.length > 0
              ) {
                const lastChip = selectedElements[selectedElements.length - 1];
                if (isInValue(lastChip)) {
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
