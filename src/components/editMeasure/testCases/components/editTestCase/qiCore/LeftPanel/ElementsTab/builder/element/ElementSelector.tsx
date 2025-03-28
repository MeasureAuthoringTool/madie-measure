import React from "react";
// import Autocomplete from "@mui/material/Autocomplete";
import { AutoComplete } from "@madie/madie-design-system/dist/react";
import { Checkbox, TextField, Chip } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { ElementDefinition } from "fhir/r4";

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
const getOptionLabel = (option: ElementDefinition, basePath: string) => {
  const label = option.path?.substring(basePath.length + 1);
  if (option.sliceName) {
    return `${label}:${option.sliceName}`;
  }
  return label;
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
        getOptionDisabled={(option) => value.includes(option)}
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
            const { key, onDelete, ...tagProps } = getTagProps({ index });
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
                onDelete={isDisabled ? undefined : onDelete}
                deleteIcon={isDisabled ? null : undefined}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField {...params} placeholder="Attributes" />
        )}
      />
    </>
  );
};

export default ElementSelector;
