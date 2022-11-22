import React from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { kebabCase } from "lodash";
import { MenuItem } from "@mui/material";
import { ExpressionDefinition } from "../MeasureGroups";
import { DSLink, Select } from "@madie/madie-design-system/dist/react";
import { InitialPopulationAssociationType } from "./GroupPopulation";
import "../../common/madie-link.scss";

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
    population.associationType = (event.target as HTMLInputElement).value;
    changeAssociationCallback();
  };

  const removeSecondIPLabelTemplate = () => {
    return (
      <div>
        <SecondIpLabel>Initial Population 2 </SecondIpLabel>
        &nbsp;&nbsp;
        {isRemovable && canEdit && (
          <DSLink
            className="madie-link"
            data-testid={`remove_${field.name}`}
            onClick={(evt) => {
              removePopulation(evt);
            }}
          >
            Remove{" "}
          </DSLink>
        )}
      </div>
    );
  };

  return (
    <div data-testid="temp-test-id" tw="relative">
      <>
        <Select
          placeHolder={{ name: "-", value: "" }}
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
        {showAddPopulationLink && canEdit && (
          <div tw="md:absolute -right-64 top-1.5 whitespace-pre px-7 py-5">
            <DSLink
              className="madie-link"
              data-testid={`add_${field.name}`}
              onClick={(evt) => addPopulation(evt)}
            >
              + Add {label}
            </DSLink>
          </div>
        )}
        {initialPopulationSize === 2 &&
          label.includes("Initial Population") &&
          scoring === "Ratio" && (
            <div
              data-testid={`measure-group-initial-population-association-${population.id}`}
            >
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
            </div>
          )}
      </>
      {/* Todo what is subTitle?*/}
      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </div>
  );
};

export default MeasureGroupPopulationSelect;