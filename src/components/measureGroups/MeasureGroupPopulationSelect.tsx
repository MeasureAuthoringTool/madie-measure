import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { MenuItem } from "@mui/material";
import { ExpressionDefinition } from "./MeasureGroups";
import { DSLink, Select } from "@madie/madie-design-system/dist/react";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { InitialPopulationAssociationType } from "./GroupPopulation";

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

const FormField = tw.div`mt-6`;
const FieldSeparator = tw.div`mt-1`;
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;

// Todo Inline errors should be displayed, MeasureGroupSchemaValidator
const MeasureGroupPopulationSelect = ({
  field,
  label,
  required,
  subTitle,
  options = [] as ExpressionDefinition[],
  scoring,
  population,
  initialPopulationSize,
  changeAssociationCallback,
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

  const changeAssociation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const changedValue: string = (event.target as HTMLInputElement).value;
    population.associationType = changedValue;
    changeAssociationCallback();
  };

  return (
    <FormField data-testid="temp-test-id">
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
          {initialPopulationSize === 2 &&
            label.includes("Initial Population") &&
            scoring === "Ratio" && (
              <div
                data-testid={`measure-group-initial-population-association-${population.id}`}
              >
                <FormField>
                  <FieldSeparator style={{ marginLeft: 30 }}>
                    <div data-testid={`${label}`}>
                      <SoftLabel>Association</SoftLabel>
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
                        value={InitialPopulationAssociationType.DENOMINATOR}
                        checked={
                          population.associationType ===
                          InitialPopulationAssociationType.DENOMINATOR
                        }
                        disabled={
                          !canEdit || label.includes("Initial Population 2")
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
                        disabled={
                          !canEdit || label.includes("Initial Population 2")
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
        </>
      )}
      {!canEdit && field.value}
      {/* Todo what is subTitle?*/}
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </FormField>
  );
};

export default MeasureGroupPopulationSelect;
