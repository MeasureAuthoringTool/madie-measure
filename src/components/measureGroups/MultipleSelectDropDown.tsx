import React from "react";
import { Theme, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";

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

function getStyles(
  value: string,
  selectedList: readonly string[],
  theme: Theme
) {
  return {
    fontWeight:
      selectedList.indexOf(value) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export default function MultipleSelectDropDown(props: {
  values: string[];
  selectedValues: string[];
  formControl: any;
  label: string;
  id: string;
}) {
  const theme = useTheme();
  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel variant="outlined" id="multiple-select-dropdown">
          Measure Group Type
        </InputLabel>
        <Select
          labelId="multiple-select-dropdown"
          data-testid={`${props.id}-dropdown`}
          multiple
          {...props.formControl}
          input={
            <OutlinedInput id="select-multiple-dropdown" label={props.label} />
          }
          renderValue={(selected: any) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          native={false}
          MenuProps={MenuProps}
        >
          {props.values.map((value) => (
            <MenuItem
              key={value}
              value={value}
              style={getStyles(value, props.selectedValues, theme)}
            >
              {value}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
