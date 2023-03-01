import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { MenuItem } from "@mui/material";
import { ExpressionDefinition } from "../MeasureGroups";
import { Select } from "@madie/madie-design-system/dist/react";

const SubTitle = styled.p`
  color: #505d68;
  font-size: 11px;
  margin-top: 20px;
  max-width: 405px;
`;

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

const SecondIpLabel = tw.span`text-black-50`;
const FieldSeparator = tw.div`mt-1`;
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;

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
