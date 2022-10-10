import React from "react";
import * as ucum from "@lhncbc/ucum-lhc";
import AsyncSelect from "react-select/async";
import tw, { styled } from "twin.macro";

const FormField = tw.div`mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3`;
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;
const FieldSeparator = tw.div`mt-1`;
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
    <div data-testid="measure-group-scoring-unit">
      <FormField>
        <FieldSeparator>
          <SoftLabel>Scoring Unit</SoftLabel>
          {canEdit && (
            <AsyncSelect
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
            />
          )}
          {!canEdit && value?.label}
        </FieldSeparator>
      </FormField>
    </div>
  );
};

export default MeasureGroupScoringUnit;
