import React from "react";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { MenuItem } from "@mui/material";
import { ExpressionDefinition } from "../QICore/QICoreMeasureGroups";
import { Select } from "@madie/madie-design-system/dist/react";
import {
  SubTitle,
  SecondIpLabel,
  FieldSeparator,
  SoftLabel,
} from "../../../../../styles/editMeasure/populationCriteria/groups/groupPopulations";

type Props = {
  label: string;
  required: boolean;
  subTitle?: string;
  name: string;
  onChange: any;
  optionTitle?: string;
  options?: Array<ExpressionDefinition>;
  error?: boolean;
};

const MeasureGroupPopulationSelect = ({
  field,
  label,
  required,
  subTitle,
  options = [] as ExpressionDefinition[],
  canEdit,
  error,
  helperText,
}: Props & any) => {
  // if the field is not required a default option is provided
  const menuItems = [
    !required && (
      <MenuItem key="-" value="">
        -
      </MenuItem>
    ),
    ...options.map(({ name }, i) => (
      <MenuItem
        key={`${name}-${i}`}
        value={name.replace(/"/g, "")}
        data-testid="select-option-measure-group-population"
      >
        {name.replace(/"/g, "")}
      </MenuItem>
    )),
  ];
  const htmlId = kebabCase(`population-select-${label}`);

  const removeSecondIPLabelTemplate = () => {
    return (
      <div>
        <SecondIpLabel>Initial Population 2 </SecondIpLabel>
        &nbsp;&nbsp;
      </div>
    );
  };
  return (
    <div data-testid="temp-test-id" tw="relative">
      <div className="population-col-gap-24">
        <Select
          placeHolder={{ name: `Select ${label}`, value: "" }}
          required={required}
          disabled={!canEdit}
          label={
            label === "Initial Population 2"
              ? removeSecondIPLabelTemplate()
              : label
          }
          id={`${htmlId}-select`}
          inputProps={{
            "data-testid": `select-measure-group-population-input`,
          }}
          SelectDisplayProps={{
            "aria-required": required ? true : false,
          }}
          data-testid={htmlId}
          {...field}
          error={error}
          helperText={helperText}
          size="small"
          options={menuItems}
        />
      </div>
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </div>
  );
};

export default MeasureGroupPopulationSelect;
