import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { TextField, MenuItem } from "@mui/material";
import { ExpressionDefinition } from "./MeasureGroups";
import { DSLink, Select } from "@madie/madie-design-system/dist/react";

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
  error?: boolean;
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
  error,
  helperText,
  ...props
}: Props & any) => {
  const htmlId = kebabCase(`population-select-${label}`);
  const defaultOptionTitle = "Select" + optionTitle ? optionTitle : label;

  const removePopulation = (evt) => {
    evt.preventDefault();
    removePopulationCallback();
  };

  const addPopulation = (evt) => {
    evt.preventDefault();
    addPopulationCallback();
  };
  debugger;

  return (
    <FormField>
      {canEdit && (
        <>
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

          <Select
            placeHolder={{ name: "-", value: "" }}
            required={required}
            label={label}
            id={htmlId}
            inputProps={{
              "data-testid": `select-measure-group-population-input`,
            }}
            data-testid={htmlId}
            onChange={onChange}
            value={value?.replace(/"/g, "")}
            error={error}
            helperText={helperText}
            size="small"
            options={[
              <MenuItem
                value={""}
                disabled={required}
                data-testid={`select-option-measure-group-population`}
              >
                Select {defaultOptionTitle}
                {required ? "" : " ( Leave selected for no population )"}
              </MenuItem>,
              ...options.map(({ name }, i) => (
                <MenuItem
                  key={`${name}-${i}`}
                  value={name.replace(/"/g, "")}
                  data-testid={`group-population-option-${name.replace(
                    /"/g,
                    ""
                  )}`}
                >
                  {name.replace(/"/g, "")}
                </MenuItem>
              )),
            ]}
          />
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
        </>
      )}
      {!canEdit && value}
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </FormField>
  );
};

export default MeasureGroupPopulationSelect;
