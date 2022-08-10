import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { TextField } from "@mui/material";
import { ExpressionDefinition } from "./MeasureGroups";
import { DSLink } from "@madie/madie-design-system/dist/react";

const HeavyLabel = styled.label`
  color: #505d68;
  font-weight: 500;
`;

const Required = styled.span`
  display: inline-block;
  padding-left: 0.25rem;
`;

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
};

const FormField = tw.div`mt-6`;

const MeasureGroupPopulationSelect = ({
  label,
  required,
  subTitle,
  name,
  onChange,
  optionTitle,
  options = [] as ExpressionDefinition[],
  value = "",
  canEdit,
  removePopulationCallback,
  addPopulationCallback,
  isRemovable,
  showAddPopulationLink,
  ...props
}: Props & any) => {
  const htmlId = kebabCase(`population-select-${label}`);
  const defaultOptionTitle = optionTitle ? optionTitle : label;

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
      <HeavyLabel
        htmlFor={htmlId}
        id={`${htmlId}-label`}
        data-testid={`select-measure-group-population-label`}
      >
        {label}
        {required && <Required>*</Required>}
      </HeavyLabel>
      {isRemovable && (
        <span tw={"ml-2"}>
          <DSLink
            data-testid={`remove_${name}`}
            onClick={(evt) => removePopulation(evt)}
          >
            Remove
          </DSLink>
        </span>
      )}
      {canEdit && (
        <div>
          <TextField
            select
            value={value?.replace(/"/g, "")}
            label=""
            id={htmlId}
            inputProps={{
              "data-testid": `select-measure-group-population`,
            }}
            InputLabelProps={{ shrink: false, id: `select-${htmlId}-label` }}
            SelectProps={{
              native: true,
              displayEmpty: true,
            }}
            name={name}
            onChange={onChange}
            style={{ minWidth: "20rem" }}
            {...props}
          >
            {options.map(({ name }, i) => (
              <option
                key={`${name}-${i}`}
                value={name.replace(/"/g, "")}
                data-testid={`select-option-measure-group-population`}
              >
                {name.replace(/"/g, "")}
              </option>
            ))}
            <option
              value={""}
              disabled={required}
              data-testid={`select-option-measure-group-population`}
            >
              Select {defaultOptionTitle}
              {required ? "" : " ( Leave selected for no population )"}
            </option>
          </TextField>{" "}
          {showAddPopulationLink && (
            <span tw={"ml-2"}>
              <DSLink
                data-testid={`add_${name}`}
                onClick={(evt) => addPopulation(evt)}
              >
                + Add {label}
              </DSLink>
            </span>
          )}
        </div>
      )}
      {!canEdit && value}
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </FormField>
  );
};

export default MeasureGroupPopulationSelect;
