import React from "react";
import tw, { styled } from "twin.macro";
import { kebabCase } from "lodash";
import { TextField } from "@mui/material";
import { ExpressionDefinition } from "./MeasureGroups";

const FormControl = styled.section(() => [tw`mb-3`, `margin: 25px 40px;`]);
const Col = styled.article`
  display: flex;
  flex-direction: column;
`;
const HeavyLabel = styled.label`
  color: #505d68;
  font-weight: 500;
`;
const Link = styled.a`
  text-decoration: underline;
  display: inline-block;
  padding-left: 1rem;
`;
const Row = styled.section`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  align-items: center;
  margin-top: 14px;
`;
const Required = styled.span`
  display: inline-block;
  padding-left: 0.25rem;
`;
const SpacerContainer = styled.span`
  margin-left: 45px;
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
  ...props
}: Props & any) => {
  const htmlId = kebabCase(`population-select-${label}`);
  const defaultOptionTitle = optionTitle ? optionTitle : label;

  // FPO noop onClick handler
  const onClickCallback = (evt) => {
    evt.preventDefault();
  };

  return (
    <FormControl>
      <HeavyLabel
        htmlFor={htmlId}
        id={`${htmlId}-label`}
        data-testid={`select-measure-group-population-label`}
      >
        {label}
        {required && <Required>*</Required>}
      </HeavyLabel>

      <Row>
        <Col>
          {canEdit && (
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
              // labelId={`select-${htmlId}-label`}
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
            </TextField>
          )}

          {!canEdit && value}
        </Col>

        <SpacerContainer>
          <Link href="#" onClick={onClickCallback}>
            View
          </Link>
          <Link href="#" onClick={onClickCallback}>
            Delete
          </Link>
        </SpacerContainer>
      </Row>

      {subTitle && <SubTitle>{subTitle}</SubTitle>}
    </FormControl>
  );
};

export default MeasureGroupPopulationSelect;
