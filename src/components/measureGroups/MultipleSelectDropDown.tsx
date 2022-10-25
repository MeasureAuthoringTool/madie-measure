import React from "react";
import tw from "twin.macro";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { Checkbox, Link, ListItemText } from "@mui/material";
import { InputLabel } from "@madie/madie-design-system/dist/react/";

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

const dropdownStyle = {
  borderRadius: "3px",
  height: 40,
  border: "1px solid #DDDDDD",
  // remove weird line break from legend
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    "&&": {
      borderRadius: "3px",
    },
  },
  // input base selector
  "& .MuiInputBase-input": {
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 0.6,
    },
  },
  "& 	.MuiSelect-icon": {
    color: "#323232",
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
  required: boolean;
  disabled: boolean;
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
      <FormControl fullWidth sx={{ paddingRight: 2 }}>
        <InputLabel
          id={`${props.id}-label`}
          htmlFor={props.id}
          required={props.required}
        >
          {props.label}
        </InputLabel>
        {props.canEdit && (
          <Select
            id={props.id}
            sx={dropdownStyle}
            required
            data-testid={`${props.id}-dropdown`}
            multiple
            displayEmpty
            // aria-required={true}
            // inputProps={{ "aria-required" : "true", "aria-hidden" : "false"}}
            // aria-required={true}
            {...props.formControl}
            onChange={handleOnchange}
            aria-labelledby={`${props.id}-label`}
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
