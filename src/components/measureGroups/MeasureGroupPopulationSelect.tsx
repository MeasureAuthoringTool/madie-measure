import React, { useState } from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { TextField } from "@mui/material";
import { ExpressionDefinition } from "./MeasureGroups";
import { DSLink } from "@madie/madie-design-system/dist/react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { InitialPopulationAssociationType } from "./GroupPopulation";

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
const FieldSeparator = tw.div`mt-1`;
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;

const MeasureGroupPopulationSelect = ({
  label,
  required,
  subTitle,
  name,
  onChange,
  optionTitle,
  options = [] as ExpressionDefinition[],
  value = "",
  scoring,
  population,
  initialPopulationSize,
  changeAssociationCallback,
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

  const changeAssociation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const changedValue: string = (event.target as HTMLInputElement).value;
    population.associationType = changedValue;
    changeAssociationCallback();
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
          {initialPopulationSize === 2 &&
            label.includes("Initial Population") &&
            scoring === "Ratio" && (
              <div
                data-testid={`measure-group-initial-population-association-${population.id}`}
              >
                <FormField>
                  <FieldSeparator style={{ marginLeft: 30 }}>
                    <SoftLabel>Association</SoftLabel>
                    <div
                      style={{
                        marginLeft: 15,
                        fontSize: 16,
                        fontFamily: "Rubik",
                      }}
                    >
                      <input
                        type="radio"
                        value={InitialPopulationAssociationType.DENOMINATOR}
                        checked={
                          population.associationType ===
                          InitialPopulationAssociationType.DENOMINATOR
                        }
                        onChange={changeAssociation}
                        data-testid={`${label}-${InitialPopulationAssociationType.DENOMINATOR}`}
                      />
                      &nbsp;
                      {InitialPopulationAssociationType.DENOMINATOR}
                    </div>
                    <div
                      style={{
                        marginLeft: 15,
                        fontSize: 16,
                        fontFamily: "Rubik",
                      }}
                    >
                      <input
                        type="radio"
                        value={InitialPopulationAssociationType.NUMERATOR}
                        checked={
                          population.associationType ===
                          InitialPopulationAssociationType.NUMERATOR
                        }
                        onChange={changeAssociation}
                        data-testid={`${label}-${InitialPopulationAssociationType.NUMERATOR}`}
                      />
                      &nbsp;
                      {InitialPopulationAssociationType.NUMERATOR}
                    </div>
                  </FieldSeparator>
                </FormField>
              </div>
            )}
        </div>
      )}
      {!canEdit && value}
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </FormField>
  );
};

export default MeasureGroupPopulationSelect;
