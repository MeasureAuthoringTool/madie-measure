import React from "react";
import {
  Button,
  ReadOnlyTextField,
  DateField,
  Select,
  RadioButton,
  TextField,
} from "@madie/madie-design-system/dist/react";
import { MenuItem } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { Box } from "@mui/system";
import * as _ from "lodash";
import "../durationTab/DurationTab.scss";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.utc();
import { PRECISION_OPTIONS } from "../durationTab/DurationTab";

const ComputedDate = () => {
  const [initialDate, setInitialDate] = React.useState<string | null>(null);
  const [precision, setPrecision] = React.useState<string>("years");
  const [precisionNumber, setPrecisionNumber] = React.useState<number>();

  return (
    <div className="duration-tab-container">
      <div className="duration-tab-instructions">
        Provide a date, choose to add or subtract, enter a number, and pick a
        time unit (days, weeks, months, or years) to calculate a new date.
      </div>
      <div className="duration-tab-row">
        <div>
          <DateField
            id="initial-date"
            label="Initial Date"
            handleDateChange={setInitialDate}
            value={initialDate}
            textFieldSx={{ width: "160px" }}
            onBlur={() => {}}
          />
        </div>
        <div className="add-subtract-option">
          <RadioButton
            row
            id="add-subtract-option"
            dataTestId="add-subtract-option"
            label="Add/Subtract"
            aria-labelledby="add-subtract-option"
            options={[
              { label: "(+) Add", value: true },
              { label: "(-) Subtract", value: false },
            ]}
          />
        </div>
        <Box className="computed-date-precision-select">
          <TextField
            id="precision-number"
            type="number"
            label="Days/Weeks/Months/Years"
            value={precisionNumber}
            onChange={(e) => setPrecisionNumber(e.target.value)}
            sx={{
              width: 200,
              mt: 1, // Add margin-top to move it down
              "& .MuiInputBase-input": {
                width: 140,
                fontFamily: "Rubik",
                fontSize: 14,
                fontWeight: 400,
                color: "#515151",
                borderColor: "transparent",
                borderRadius: "3px",
                padding: "9px 14px",
                marginRight: "-9px",
                "&::placeholder": {
                  opacity: 0.6,
                },
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment
                  position="end"
                  sx={{
                    minWidth: 80,
                    borderLeft: "1px solid #ccc",
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Select
                    labelId="precision-select-label"
                    id="precision-select"
                    data-testid="precision-select"
                    inputProps={{
                      "data-testid": `precision-input`,
                    }}
                    value={precision}
                    onChange={(e) => setPrecision(e.target.value)}
                    options={PRECISION_OPTIONS}
                    variant="standard" // No border
                    disableUnderline
                    sx={{
                      "& .MuiInputBase-input": {
                        marginTop: "-35px",
                      },
                      "& .MuiSelect-icon": {
                        marginTop: "-15px",
                      },
                    }}
                  />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </div>
      <div>
        <Button
          variant="primary"
          id="calculate-computed-date"
          data-testid="calculate-computed-date"
          onClick={() => {}}
          disabled={false}
        >
          Calculate
        </Button>
      </div>
      <Box className="duration-tab-results-container">
        <div className="duration-tab-row">
          <ReadOnlyTextField
            readOnly
            label="Computed Date Result"
            placeholder="--/--/----"
            id="computed-date-result"
            data-testid="computed-date-result"
            value={"--/--/----"}
            inputProps={{
              "data-testid": "computed-date-result-input",
            }}
          />
        </div>
      </Box>
    </div>
  );
};

export default ComputedDate;
