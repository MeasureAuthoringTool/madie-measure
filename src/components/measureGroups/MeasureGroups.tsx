import React, { useEffect, useState, Fragment } from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Alert, TextField } from "@mui/material";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import MeasureDetailsSidebar from "../editMeasure/measureDetails/MeasureDetailsSidebar";
import { Button } from "@madie/madie-components";
import { useFormik } from "formik";
import { Group } from "../../models/Measure";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import MeasureGroupPopulationSelect from "./MeasureGroupPopulationSelect";
import * as _ from "lodash";
import { MeasureGroupSchemaValidator } from "../../models/MeasureGroupSchemaValidator";

const Grid = styled.div(() => [tw`grid grid-cols-4 ml-1 gap-y-4`]);
const Content = styled.div(() => [tw`col-span-3`]);
const Header = styled.section`
  background-color: #f2f5f7;
  padding: 40px;
  border-bottom: solid 1px rgba(80, 93, 104, 0.2);
`;
const Title = styled.h1`
  font-size: 18px;
  color: #424b5a;
`;
const FormControl = styled.section(() => [tw`mb-3`, `margin: 25px 40px;`]);
const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;
const Divider = styled.div`
  width: 100%;
  margin: 37px 0px 32px 0px;
  border-bottom: solid 1px rgba(80, 93, 104, 0.2);
`;
const ButtonSpacer = styled.span`
  margin-left: 15px;
`;
const GroupFooter = tw(Grid)`border-t border-b`;
const GroupActions = styled.div(() => [tw`col-span-1 border-r p-1`]);
const PopulationActions = styled.div(() => [
  "background-color: #f2f5f7;",
  tw`col-span-3 p-1 pl-6`,
]);

const FormContent = tw.div`space-y-8 divide-y divide-gray-200`;
const FormField = tw.div`mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6`;
const FormFieldInner = tw.div`sm:col-span-3`;
const FieldLabel = tw.label`block text-sm font-medium text-gray-700`;
const FieldSeparator = tw.div`mt-1`;
const FieldInput = tw.input`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;

// Define fields to conditionally appear based on selected scoring unit
export const DefaultPopulationSelectorDefinitions = [
  {
    key: "initialPopulation",
    label: "Initial Population",
    subTitle: `
      Caution: Removing or invalidating a population will cause any
      package groupings containing that population to be cleared on the
      Measure Packager.
    `,
  },
  {
    label: "Denominator",
    key: "denominator",
    hidden: ["Cohort", "Continuous Variable"],
  },
  {
    label: "Denominator Exclusion",
    key: "denominatorExclusion",
    optional: ["*"],
    hidden: ["Cohort", "Continuous Variable"],
  },
  {
    label: "Denominator Exception",
    key: "denominatorException",
    optional: ["Proportion"],
    hidden: ["Cohort", "Continuous Variable", "Ratio"],
  },
  {
    label: "Numerator",
    key: "numerator",
    hidden: ["Cohort", "Continuous Variable"],
  },
  {
    label: "Numerator Exclusion",
    key: "numeratorExclusion",
    optional: ["Proportion", "Ratio"],
    hidden: ["Cohort", "Continuous Variable"],
  },
  {
    label: "Measure Population",
    key: "measurePopulation",
    hidden: ["Cohort", "Proportion", "Ratio"],
  },
  {
    label: "Measure Population Exclusion",
    key: "measurePopulationExclusion",
    optional: ["Continuous Variable"],
    hidden: ["Cohort", "Ratio", "Proportion"],
  },
];

export interface ExpressionDefinition {
  expression?: string;
  expressionClass?: string;
  name?: string;
  start?: object;
  stop?: object;
  text?: string;
}

const MeasureGroups = () => {
  const [expressionDefinitions, setExpressionDefinitions] = useState<
    Array<ExpressionDefinition>
  >([]);
  const { measure, setMeasure } = useCurrentMeasure();
  const measureServiceApi = useMeasureServiceApi();
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [warningMessage, setWarningMessage] = useState<boolean>(false);
  const [updateConfirm, setUpdateConfirm] = useState<boolean>(false);
  // TODO: hardcoded index 0 as only one group is there.
  // TODO: group will be coming from props when we separate this into separate component
  const group = measure.groups && measure.groups[0];
  const defaultScoring = group?.scoring || measure?.measureScoring || "Cohort";
  const formik = useFormik({
    initialValues: {
      id: group?.id || null,
      scoring: defaultScoring,
      population: {
        initialPopulation: group?.population?.initialPopulation || "",
        denominator: group?.population?.denominator || "",
        denominatorExclusion: group?.population?.denominatorExclusion || "",
        denominatorException: group?.population?.denominatorException || "",
        numerator: group?.population?.numerator || "",
        numeratorExclusion: group?.population?.numeratorExclusion || "",
        measurePopulation: group?.population?.measurePopulation || "",
        measurePopulationExclusion:
          group?.population?.measurePopulationExclusion || "",
      },
      groupDescription: group?.groupDescription,
    } as Group,
    validationSchema: MeasureGroupSchemaValidator,
    onSubmit: (group: Group) => {
      setSuccessMessage(undefined);
      window.scrollTo(0, 0);
      if (
        measure?.groups &&
        formik.values.scoring !== measure.groups[0].scoring
      ) {
        setWarningMessage(true);
        if (updateConfirm) {
          setWarningMessage(false);
          submitForm(group);
          setUpdateConfirm(false);
        }
      } else {
        submitForm(group);
      }
    },
  });

  useEffect(() => {
    if (measure.cql) {
      const definitions = new CqlAntlr(measure.cql).parse()
        .expressionDefinitions;
      setExpressionDefinitions(definitions);
    }
  }, [measure]);

  // @TODO: Pull directly from MeasurePopulation instead of local export
  const PopulationSelectorDefinitions = DefaultPopulationSelectorDefinitions;

  // Helper function do determine the properties for a select item
  const populationSelectorProperties = (
    fieldProps: any,
    selectedOption: String
  ) => {
    const hidden = fieldProps.hidden?.includes(selectedOption);
    const required =
      !fieldProps.optional?.includes("*") &&
      !fieldProps.optional?.includes(selectedOption);
    const options: Array<ExpressionDefinition> = fieldProps.options
      ? []
      : expressionDefinitions;
    const name: string = `population.${fieldProps.key}`;
    return {
      label: fieldProps.label,
      hidden,
      required,
      name,
      options,
      subTitle: fieldProps.subTitle,
    };
  };

  const submitForm = (group: Group) => {
    if (group && group.population) {
      // remove any key/value pairs that do not have a valid define selected before saving to DB
      group.population = _.omitBy(
        group.population,
        (value) => _.isNil(value) || value.trim().length === 0
      );
    }

    if (measure?.groups) {
      group.id = measure.groups[0].id;
      measureServiceApi
        .updateGroup(group, measure.id)
        .then((g: Group) => {
          if (g === null || g.id === null) {
            throw new Error("Error updating group");
          }
          setMeasure({
            ...measure,
            groups: [g],
          });
        })
        .then(() => {
          setGenericErrorMessage("");
          setSuccessMessage(
            "Population details for this group updated successfully."
          );
        })

        .catch((error) => {
          setGenericErrorMessage(error.message);
        });
    } else {
      measureServiceApi
        .createGroup(group, measure.id)
        .then((g: Group) => {
          if (g === null || g.id === null) {
            throw new Error("Error creating group");
          }
          setMeasure({
            ...measure,
            groups: [g],
          });
        })
        .then(() => {
          setGenericErrorMessage("");
          setSuccessMessage(
            "Population details for this group saved successfully."
          );
        })

        .catch((error) => {
          setGenericErrorMessage(error.message);
        });
    }
  };
  // Local state to later populate the left nav and and govern routes based on group ids
  const baseURL = "/measures/" + measure.id + "/edit/measure-groups";
  const measureGroups = [
    {
      title: "MEASURE GROUP 1",
      href: `${baseURL}`,
      dataTestId: "leftPanelMeasureInformation",
    },
  ];
  const allOptions = Object.values(MeasureScoring);

  const warningTemplate = (
    <>
      <ButtonSpacer>
        <Button
          style={{ background: "#424B5A" }}
          type="submit"
          buttonTitle="Update"
          data-testid="group-form-update-btn"
          onClick={() => setUpdateConfirm(true)}
        />
      </ButtonSpacer>
      <ButtonSpacer>
        <Button type="button" buttonTitle="Cancel" variant="white" />
      </ButtonSpacer>
    </>
  );

  return (
    <form onSubmit={formik.handleSubmit}>
      <Grid>
        <MeasureDetailsSidebar links={measureGroups} />
        <Content>
          <Header>
            <Title>Measure Group 1</Title>

            <FormField>
              <FormFieldInner>
                <FieldLabel htmlFor="measure-group-description">
                  Group Description
                </FieldLabel>
                <FieldSeparator>
                  <FieldInput
                    value={formik.values.groupDescription}
                    type="text"
                    name="group-description"
                    id="group-description"
                    autoComplete="group-description"
                    placeholder="Group Description"
                    data-testid="groupDescriptionInput"
                    {...formik.getFieldProps("groupDescription")}
                  />
                </FieldSeparator>
              </FormFieldInner>
            </FormField>
          </Header>
          {genericErrorMessage && (
            <Alert
              data-testid="error-alerts"
              role="alert"
              severity="error"
              onClose={() => setGenericErrorMessage(undefined)}
            >
              {genericErrorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert
              data-testid="success-alerts"
              role="alert"
              severity="success"
              onClose={() => setSuccessMessage(undefined)}
            >
              {successMessage}
            </Alert>
          )}
          {warningMessage && (
            <Alert
              data-testid="warning-alerts"
              role="alert"
              severity="warning"
              onClose={() => setWarningMessage(false)}
            >
              This change will reset the population scoring value in test cases.
              Are you sure you wanted to continue with this? {warningTemplate}
            </Alert>
          )}
          {/* Form control later should be moved to own component and dynamically rendered by switch based on measure. */}
          <FormControl>
            {/* pull from cql file */}
            <SoftLabel htmlFor="scoring-unit-select">Group Scoring:</SoftLabel>
            <TextField
              select
              id="scoring-unit-select"
              label=""
              inputProps={{
                "data-testid": "scoring-unit-select",
              }}
              InputLabelProps={{ shrink: false }}
              SelectProps={{
                native: true,
              }}
              name="scoring"
              value={formik.values.scoring}
              onChange={(e) => {
                formik.resetForm({
                  values: {
                    ...formik.values,
                    scoring: e.target.value,
                    population: {
                      initialPopulation: "",
                      denominator: "",
                      denominatorExclusion: "",
                      denominatorException: "",
                      numerator: "",
                      numeratorExclusion: "",
                      measurePopulation: "",
                      measurePopulationExclusion: "",
                    },
                  },
                });
              }}
            >
              {allOptions.map((opt, i) => (
                <option
                  key={`${opt}-${i}`}
                  value={opt}
                  data-testid="scoring-unit-option"
                >
                  {opt}
                </option>
              ))}
            </TextField>
          </FormControl>

          {PopulationSelectorDefinitions.map((selectorDefinition) => {
            const selectorProps = populationSelectorProperties(
              selectorDefinition,
              formik.values.scoring
            );
            if (selectorProps.hidden) return;

            const touched = _.get(
              formik.touched.population,
              selectorDefinition.key
            );
            const error = !!touched
              ? _.get(formik.errors.population, selectorDefinition.key)
              : null;

            const formikFieldProps = formik.getFieldProps(
              `population.${selectorDefinition.key}`
            );
            return (
              <Fragment key={`select_${selectorDefinition.label}`}>
                <Divider />
                <MeasureGroupPopulationSelect
                  {...selectorProps}
                  {...formikFieldProps}
                  helperText={error}
                  error={!!error && !!touched}
                />
              </Fragment>
            );
          })}
          <br />
        </Content>
      </Grid>
      <GroupFooter>
        <GroupActions />
        <PopulationActions>
          <ButtonSpacer>
            <Button
              style={{ background: "#424B5A" }}
              type="submit"
              buttonTitle="Save"
              data-testid="group-form-submit-btn"
              disabled={!(formik.isValid && formik.dirty)}
            />
          </ButtonSpacer>
          <ButtonSpacer>
            <Button type="button" buttonTitle="Cancel" variant="white" />
          </ButtonSpacer>
          <ButtonSpacer>
            <span
              tw="text-sm text-gray-600"
              data-testid="save-measure-group-validation-message"
            >
              {MeasureGroupSchemaValidator.isValidSync(formik.values)
                ? ""
                : "You must set all required Populations."}
            </span>
          </ButtonSpacer>
        </PopulationActions>
      </GroupFooter>
    </form>
  );
};

export default MeasureGroups;
