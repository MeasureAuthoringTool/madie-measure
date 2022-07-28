import React from "react";
import tw, { styled } from "twin.macro";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Checkbox, Link, ListItemText } from "@mui/material";

const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;

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
}) {
  return (
    <div>
      <FormControl sx={{ width: 300, mt: 1 }}>
        <SoftLabel htmlFor="multiple-select-dropdown">
          Measure Group type:
        </SoftLabel>
        <Select
          labelId="multiple-select-dropdown"
          data-testid={`${props.id}-dropdown`}
          multiple
          displayEmpty
          {...props.formControl}
          input={
            <OutlinedInput id="select-multiple-dropdown" label={props.label} />
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
          <MenuItem value="">
            <Link underline="always" onClick={props.clearAll}>
              Clear
            </Link>
          </MenuItem>
        </Select>
      </FormControl>
    </div>
  );
}
