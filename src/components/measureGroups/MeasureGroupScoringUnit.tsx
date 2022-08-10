import React, { useState } from "react";
import * as ucum from "@lhncbc/ucum-lhc";
import AsyncSelect from "react-select/async";
import tw, { styled } from "twin.macro";
const FormControl = styled.section(() => [tw`mb-3`, `margin: 25px 40px;`]);
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;
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
}

const MeasureGroupScoringUnit = ({ value, onChange }: ScoringUnitProps) => {
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
          value: exactMatch.unit,
        },
      ];
    } else if (synonyms.status === "succeeded") {
      return synonyms.units.map((unit) => {
        return {
          label: unit.code + " " + unit.name,
          value: unit,
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
      style={{ height: "100px", width: "600px" }}
    >
      <FormControl>
        <SoftLabel>Scoring Unit</SoftLabel>
        <AsyncSelect
          cacheOptions
          loadOptions={loadOptions}
          defaultOptions
          placeholder="UCUM Code or Name"
          onChange={(newValue: any, event: any) => {
            onChange(newValue);
          }}
          onKeyDown={(event) => {
            if (event.keyCode === 13) {
              event.preventDefault();
            }
          }}
          value={value}
          defaultInputValue={value}
        />
      </FormControl>
    </div>
  );
};

export default MeasureGroupScoringUnit;
