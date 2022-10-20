import React from "react";
import * as ucum from "@lhncbc/ucum-lhc";
import AsyncSelect from "react-select/async";
import { InputLabel } from "@madie/madie-design-system/dist/react/";
import FormControl from "@mui/material/FormControl";

const customStyles = {
  control: (base) => ({
    ...base,
    height: 40,
    minHeight: 20,
    width: "100%",
    fontSize: 14,
  }),
  valueContainer: (base) => ({
    ...base,
    height: 40,
    minHeight: 20,
    width: 20,
    alignItems: "center",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: 40,
    minHeight: 20,
    alignItems: "center",
  }),
};

const basicOptions = [
  {
    label: "Number",
    value: {
      code: "number",
    },
  },
  {
    label: "Boolean",
    value: {
      code: "boolean",
    },
  },
  {
    label: "Date",
    value: {
      code: "date",
    },
  },
  {
    label: "Text",
    value: {
      code: "text",
    },
  },
  {
    label: "Percentage (%)",
    value: {
      code: "percentage",
    },
  },
];

export interface ScoringUnitProps {
  value: any;
  onChange: (newValue: any) => void;
  canEdit: boolean;
}

const MeasureGroupScoringUnit = ({
  value,
  onChange,
  canEdit,
}: ScoringUnitProps) => {
  const getBasicOptions = (input) => {
    return basicOptions.filter((unit) => {
      return unit.label.toLowerCase().includes(input.toLowerCase());
    });
  };

  const getUcumOptions = (input, callback) => {
    const ucumUtils = ucum.UcumLhcUtils.getInstance();

    const synonyms = ucumUtils.checkSynonyms(input);
    const exactMatch = ucumUtils.validateUnitString(input);
    if (exactMatch.status === "valid") {
      return [
        {
          label: exactMatch.unit.code + " " + exactMatch.unit.name,
          value: {
            ...exactMatch.unit,
            system: "https://clinicaltables.nlm.nih.gov/",
          },
        },
      ];
    } else if (synonyms.status === "succeeded") {
      return synonyms.units.map((unit) => {
        return {
          label: unit.code + " " + unit.name,
          value: {
            ...unit,
            system: "https://clinicaltables.nlm.nih.gov/",
          },
        };
      });
    } else {
      callback([
        {
          value: "error",
          label: "Invalid Scoring Unit!",
          isDisabled: true,
        },
      ]);

      return [];
    }
  };

  const loadOptions = (input, callback) => {
    callback([
      {
        label: "Basic",
        options: getBasicOptions(input),
      },
      {
        label: "UCUM",
        options: getUcumOptions(input, callback),
      },
    ]);
  };

  return (
    <div
      data-testid="measure-group-scoring-unit"
      style={{ paddingLeft: "16px" }}
    >
      <FormControl fullWidth>
        <InputLabel id="scoring-unit-dropdown-label" required={false}>
          Scoring Unit
        </InputLabel>
        {canEdit && (
          <AsyncSelect
            id="scoring-unit-dropdown"
            styles={customStyles}
            cacheOptions
            loadOptions={loadOptions}
            defaultOptions
            placeholder="UCUM Code or Name"
            onChange={(newValue: any) => {
              onChange(newValue);
            }}
            value={value}
            defaultInputValue={value}
            isClearable={true}
            aria-labelledby="scoring-unit-dropdown-label"
          />
        )}
        {!canEdit && value?.label}
      </FormControl>
    </div>
  );
};

export default MeasureGroupScoringUnit;
