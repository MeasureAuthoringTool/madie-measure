import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { MenuItem } from "@mui/material";
import { ExpressionDefinition } from "./MeasureGroups";
import { DSLink, Select } from "@madie/madie-design-system/dist/react";

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
  value?: string;
  error?: boolean;
};

const FormField = tw.div`mt-6`;

// Todo Inline errors should be displayed, MeasureGroupSchemaValidator
const MeasureGroupPopulationSelect = ({
  field,
  label,
  required,
  subTitle,
  options = [] as ExpressionDefinition[],
  canEdit,
  removePopulationCallback,
  addPopulationCallback,
  isRemovable,
  showAddPopulationLink,
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

  const removePopulation = (evt) => {
    evt.preventDefault();
    removePopulationCallback();
  };

  const addPopulation = (evt) => {
    evt.preventDefault();
    addPopulationCallback();
  };

  return (
    <FormField>
      {canEdit && (
        <>
          {isRemovable && (
            <span tw={"ml-2"}>
              <DSLink
                data-testid={`remove_${field.name}`}
                onClick={(evt) => removePopulation(evt)}
              >
                Remove
              </DSLink>
            </span>
          )}

          <Select
            placeHolder={{ name: "-", value: "" }}
            required={required}
            label={label}
            id={htmlId}
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
          {showAddPopulationLink && (
            <span tw={"ml-2"}>
              <DSLink
                data-testid={`add_${field.name}`}
                onClick={(evt) => addPopulation(evt)}
              >
                + Add {label}
              </DSLink>
            </span>
          )}
        </>
      )}
      {!canEdit && field.value}
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </FormField>
  );
};

export default MeasureGroupPopulationSelect;
