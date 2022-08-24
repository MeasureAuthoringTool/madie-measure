import React from "react";
import tw from "twin.macro";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Checkbox, Link, ListItemText } from "@mui/material";

const FieldLabel = tw.label`block capitalize text-sm font-medium text-gray-700`;

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function MultipleSelectDropDown(props: {
  values: string[];
  selectedValues: string[];
  formControl: any;
  label: string;
  id: string;
  clearAll: any;
  canEdit: boolean;
}) {
  // To handle clearAll, since clear is considered as an option in Select
  const handleOnchange = (event) => {
    if (event.target.value.includes("clear")) {
      return props.clearAll();
    }
    return props.formControl.onChange(event);
  };

  return (
    <div>
      <FormControl sx={{ width: 300, mt: 3 }}>
        <FieldLabel htmlFor="multiple-select-dropdown">
          Measure Group type *
        </FieldLabel>
        {props.canEdit && (
          <Select
            labelId="multiple-select-dropdown"
            data-testid={`${props.id}-dropdown`}
            multiple
            displayEmpty
            {...props.formControl}
            onChange={handleOnchange}
            input={
              <OutlinedInput
                id="select-multiple-dropdown"
                label={props.label}
              />
            }
            renderValue={(selected: any) => {
              if (selected.length === 0) {
                return <em>Select all that apply</em>;
              }
              return selected.join(", ");
            }}
            native={false}
            MenuProps={MenuProps}
          >
            <MenuItem disabled value="">
              <em>Select all that apply</em>
            </MenuItem>
            {props.values.map((value) => (
              <MenuItem key={value} value={value}>
                <Checkbox checked={props.selectedValues.indexOf(value) > -1} />
                <ListItemText primary={value} />
              </MenuItem>
            ))}
            <MenuItem value="clear">
              <Link underline="always">Clear</Link>
            </MenuItem>
          </Select>
        )}
        {!props.canEdit && props.selectedValues.join(", ")}
      </FormControl>
    </div>
  );
}
