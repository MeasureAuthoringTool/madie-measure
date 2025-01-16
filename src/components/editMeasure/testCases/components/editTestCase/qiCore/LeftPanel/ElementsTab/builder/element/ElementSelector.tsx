import React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { Checkbox, TextField } from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { ElementDefinition } from "fhir/r4";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

interface ElementSelectorProps {
  basePath: string;
  options: ElementDefinition[];
  value: ElementDefinition[];
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
  onChange,
}: ElementSelectorProps) => {
  return (
    <>
      <Autocomplete
        multiple
        fullWidth
        limitTags={2}
        id="resource-element-selector-autocomplete"
        options={options}
        value={value}
        onChange={onChange}
        disableCloseOnSelect
        getOptionLabel={(option) => getOptionLabel(option, basePath)}
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              style={{ marginRight: 8 }}
              checked={selected}
            />
            {getOptionLabel(option, basePath)}
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Elements" placeholder="Elements" />
        )}
      />
    </>
  );
};

export default ElementSelector;
