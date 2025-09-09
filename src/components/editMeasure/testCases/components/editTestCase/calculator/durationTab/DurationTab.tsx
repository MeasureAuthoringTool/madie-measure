import React from "react";
import {
  Button,
  ReadOnlyTextField,
  DateField,
  Select,
} from "@madie/madie-design-system/dist/react";
import { Checkbox, FormControlLabel, MenuItem } from "@mui/material";
import { Box } from "@mui/system";
import * as _ from "lodash";
import "./DurationTab.scss";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
dayjs.utc();
const OPTIONS = ["years", "months", "weeks", "days"];
const PRECISION_OPTIONS = OPTIONS.map((ref, i) => (
  <MenuItem key={`${ref}-${i}`} data-testid={`${ref}-option`} value={ref}>
    {_.startCase(ref)}
  </MenuItem>
));

const DurationTab = () => {
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);
  const [endDateInclusive, setEndDateInclusive] =
    React.useState<boolean>(false);
  const [precision, setPrecision] = React.useState<string>("years");

  return (
    <div className="duration-tab-container">
      <div className="duration-tab-instructions">
        Provide two dates to calculate the duration and difference between them,
        and indicate the preferred level of precision for the result.
      </div>
      <div className="duration-tab-row">
        <div>
          <DateField
            id="start-date"
            label="Start Date"
            handleDateChange={setStartDate}
            value={startDate}
            textFieldSx={{ width: "160px" }}
            onBlur={() => {}}
          />
          <Button
            onClick={() => {
              setStartDate(dayjs.utc().toISOString());
            }}
          >
            Today
          </Button>
        </div>
        <div>
          <DateField
            id="end-date"
            label="End Date"
            handleDateChange={setEndDate}
            value={endDate}
            textFieldSx={{ width: "160px" }}
            onBlur={() => {}}
          />
          <Button
            onClick={() => {
              setEndDate(dayjs.utc().toISOString());
            }}
          >
            Today
          </Button>
        </div>
        <Box className="precision-select">
          <Select
            labelId="precision-select-label"
            id="precision-select"
            label="Precision"
            inputProps={{
              "data-testid": `precision-input`,
            }}
            value={precision}
            onChange={(e) => setPrecision(e.target.value)}
            options={PRECISION_OPTIONS}
          ></Select>
        </Box>
      </div>
      <div className="duration-tab-row">
        <FormControlLabel
          control={
            <Checkbox
              checked={endDateInclusive}
              name="endDateInclusive"
              id="endDateInclusive"
              data-testid="endDateInclusive"
              onChange={(e) => setEndDateInclusive(e.target.checked)}
            />
          }
          label={
            <span className="end-date-inclusive-label">
              Include end date in calculation (1 day is added)
            </span>
          }
        />
      </div>
      <div>
        <Button
          variant="primary"
          id="calculate-duration"
          data-testid="calculate-duration"
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
            label="Duration Result"
            placeholder="--"
            id="duration-result"
            data-testid="duration-result"
            value={"--"}
            inputProps={{
              "data-testid": "duration-result-input",
            }}
          />
          <ReadOnlyTextField
            readOnly
            label="Difference Result"
            placeholder="--"
            id="difference-result"
            data-testid="difference-result"
            value={"--"}
            inputProps={{
              "data-testid": "difference-result-input",
            }}
          />
        </div>
      </Box>
    </div>
  );
};

export default DurationTab;
