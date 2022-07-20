import React, { useState } from "react";
import ucum, { ucumUtils } from "@lhncbc/ucum-lhc";
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

const Ucum = () => {
  const [selectedOption, setSelectedOption] = useState(null);

  const handleInputChange = (value: string) => {
    setSelectedOption(value);
  };

  const getBasicOptions = (input) => {
    return basicOptions.filter((unit) => {
      return unit.label.toLowerCase().includes(input.toLowerCase());
    });
  };

  const getUcumOptions = (input) => {
    // const synonyms = ucumUtils.checkSynonyms(input);
    // const exactMatch = ucumUtils.validateUnitString(input);
    // if(exactMatch.status === "valid") {
    //     return [{
    //       label: exactMatch.unit.code + " " +exactMatch.unit.name,
    //       value: exactMatch.unit
    //     }]
    // }
    // else if (synonyms.status === "succeeded") {
    //   return synonyms.units.map((unit) => {
    //     return {
    //       label: unit.code + " " +unit.name,
    //       value: unit
    //     }
    //   })
    // } else {
    //   return [];
    // }
    return [];
  };

  const loadOptions = (input, callback) => {
    callback([
      {
        label: "Basic",
        options: getBasicOptions(input),
      },
      // {
      //   label: "UCUM",
      //   options: getUcumOptions(input)
      // }
    ]);
  };

  return (
    <div>
      <FormControl>
        <SoftLabel>Scoring Unit</SoftLabel>
        <AsyncSelect
          cacheOptions
          loadOptions={loadOptions}
          defaultOptions
          onInputChange={handleInputChange}
        />
      </FormControl>
    </div>
  );
};

export default Ucum;
