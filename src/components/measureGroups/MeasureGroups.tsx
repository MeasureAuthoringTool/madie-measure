import React, { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import useCurrentMeasure from "../editMeasure/useCurrentMeasure";
import {
  Group,
  GroupScoring,
  MeasureGroupTypes,
  MeasureScoring,
} from "@madie/madie-models";
import {
  Alert,
  Autocomplete,
  TextField,
  Grid as GridLayout,
} from "@mui/material";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import EditMeasureSideBarNav from "../editMeasure/measureDetails/EditMeasureSideBarNav";
import { Button } from "@madie/madie-components";
import { useFormik, FormikProvider, FieldArray, Field } from "formik";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import { MeasureGroupSchemaValidator } from "../../validations/MeasureGroupSchemaValidator";
import { useOktaTokens } from "@madie/madie-util";
import MultipleSelectDropDown from "./MultipleSelectDropDown";
import MeasureGroupsWarningDialog from "./MeasureGroupWarningDialog";
import {
  allPopulations,
  getPopulationsForScoring,
  findPopulations,
} from "./PopulationHelper";
import GroupPopulation from "./GroupPopulation";
import MeasureGroupScoringUnit from "./MeasureGroupScoringUnit";
import MeasureGroupObservation from "./MeasureGroupObservation";

const Grid = styled.div(() => [tw`grid grid-cols-4 ml-1 gap-y-4`]);
const Content = styled.div(() => [tw`col-span-3`]);
const Header = styled.section`
  background-color: #f2f5f7;
  padding: 1em 3em;
  border-bottom: solid 1px rgba(80, 93, 104, 0.2);
`;
const Title = styled.h1`
  font-size: 18px;
  color: #424b5a;
`;
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
const Row = styled.section`
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  align-items: center;
  margin-top: 14px;
`;
const Col = styled.article`
  display: flex;
  flex-direction: column;
  padding-right: 2em;
  min-width: 30%;
`;
interface PropTypes {
  isActive?: boolean;
}

const MenuItemContainer = tw.ul`bg-transparent flex mt-12 mb-8 border-b`;
const MenuItem = styled.li((props: PropTypes) => [
  tw`mr-1 text-white bg-slate rounded-t-md pl-3 pr-3 text-slate-90`,
  props.isActive &&
    tw`bg-white text-slate-90 font-medium border-solid border-b border-red-500`,
]);

const FormField = tw.div`mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3`;
const FormFieldInner = tw.div`sm:col-span-3`;
const FieldLabel = tw.label`block text-sm font-medium text-gray-700`;
const FieldSeparator = tw.div`mt-1`;
const FieldInput = tw.input`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;
const TextArea = tw.textarea`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;

export const MeasureImprovementNotation = [
  { label: "Select", subtitle: "Optional", code: "" },
  {
    label: "Increased score indicates improvement",
    subtitle:
      "Improvement is indicated as an increase in the score or measurement (e.g. Higher score indicates better quality).",
    code: "increase",
  },
  {
    label: "Decreased score indicates improvement",
    subtitle:
      "Improvement is indicated as a decrease in the score or measurement (e.g. Lower score indicates better quality).",
    code: "decrease",
  },
];
export const EmptyStrat = {
  cqlDefinition: "",
  description: "",
  association: "",
  id: "",
};
export const AssociationSelect = {
  Proportion: [
    "Initial Population",
    "Denominator",
    "Denominator Exclusion",
    "Numerator",
    "Numerator Exclusion",
    "Denominator Exception",
  ],
  "Continuous Variable": [
    "Initial Population",
    "Measure Population",
    "Measure Population Exclusion",
  ],
  Cohort: ["Initial Population"],
  Ratio: [],
};

export interface ExpressionDefinition {
  expression?: string;
  expressionClass?: string;
  name?: string;
  start?: object;
  stop?: object;
  text?: string;
}

export interface DeleteMeasureGroupDialog {
  open?: boolean;
  measureGroupNumber?: number;
}

const MeasureGroups = () => {
  const [expressionDefinitions, setExpressionDefinitions] = useState<
    Array<ExpressionDefinition>
  >([]);
  const { measure, setMeasure } = useCurrentMeasure();
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit = userName === measure?.createdBy;
  const measureServiceApi = useMeasureServiceApi();
  const [genericErrorMessage, setGenericErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [activeTab, setActiveTab] = useState<string>("populations");
  const [measureGroupNumber, setMeasureGroupNumber] = useState<number>(0);
  const [group, setGroup] = useState<Group>();
  const [updateMeasureGroupScoringDialog, setUpdateMeasureGroupScoringDialog] =
    useState<boolean>(false);
  const [deleteMeasureGroupDialog, setDeleteMeasureGroupDialog] =
    useState<DeleteMeasureGroupDialog>({
      open: false,
      measureGroupNumber: undefined,
    });
  const [populationBasisValues, setPopulationBasisValues] =
    useState<string[]>();

  useEffect(() => {
    if (measure?.groups && measure?.groups[measureGroupNumber]) {
      setGroup(measure?.groups[measureGroupNumber]);
      resetForm({
        values: {
          ...measure?.groups[measureGroupNumber],
          groupDescription:
            measure?.groups[measureGroupNumber].groupDescription || "",
          scoringUnit: measure?.groups[measureGroupNumber].scoringUnit || "",
          measureGroupTypes:
            measure?.groups[measureGroupNumber].measureGroupTypes || [],
          populations: measure?.groups[measureGroupNumber].populations || [],
          measureObservations: measure?.groups[measureGroupNumber].measureObservations || null,
        },
      });
    } else {
      if (measureGroupNumber >= measure?.groups?.length || !measure?.groups) {
        resetForm({
          values: {
            id: null,
            scoring: "Select",
            populations: [],
            measureObservations: null,
            groupDescription: "",
            stratifications: [{ ...EmptyStrat }, { ...EmptyStrat }],
            rateAggregation: "",
            improvementNotation: "",
            measureGroupTypes: [],
            populationBasis: "Boolean",
            scoringUnit: "",
          },
        });
      }
    }
  }, [measureGroupNumber, measure?.groups]);

  const defaultScoring = group?.scoring || "Select";
  const formik = useFormik({
    initialValues: {
      id: group?.id || null,
      scoring: defaultScoring,
      populations: allPopulations,
      measureObservations: null,
      rateAggregation: group?.rateAggregation || "",
      improvementNotation: group?.improvementNotation || "",
      groupDescription: group?.groupDescription,
      stratifications: group?.stratifications || [
        { ...EmptyStrat },
        { ...EmptyStrat },
      ],
      measureGroupTypes: group?.measureGroupTypes || [],
      populationBasis: group?.populationBasis || "Boolean",
      scoringUnit: group?.scoringUnit,
    } as Group,
    validationSchema: MeasureGroupSchemaValidator,
    onSubmit: (group: Group) => {
      setSuccessMessage(undefined);
      window.scrollTo(0, 0);
      if (
        measure?.groups &&
        !(measureGroupNumber >= measure?.groups?.length) &&
        formik.values?.scoring !== measure?.groups[measureGroupNumber]?.scoring
      ) {
        setUpdateMeasureGroupScoringDialog(true);
      } else {
        submitForm(group);
      }
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure.cql).parse()
        .expressionDefinitions;
      setExpressionDefinitions(definitions);
    }
  }, [measure]);

  // Fetches all population basis options from db
  // Should be executed only on initial load of the component
  useEffect(() => {
    measureServiceApi
      .getAllPopulationBasisOptions()
      .then((response) => setPopulationBasisValues(response))
      .catch((err) => setGenericErrorMessage(err.message));
  }, []);

  const discardChanges = () => {
    if (measureGroupNumber >= measure?.groups?.length || !measure?.groups) {
      resetForm({
        values: {
          id: null,
          groupDescription: "",
          scoring: "Select",
          measureGroupTypes: [],
          rateAggregation: "",
          improvementNotation: "",
          populationBasis: "Boolean",
          scoringUnit: "",
        },
      });
    } else {
      resetForm({
        values: {
          ...measure?.groups[measureGroupNumber],
        },
      });
    }
  };

  const submitForm = (group: Group) => {
    if (group.stratifications) {
      group.stratifications = group.stratifications.filter(
        (strat) => !!strat.description || !!strat.cqlDefinition
      );
    }

    if (measure?.groups && !(measureGroupNumber >= measure?.groups?.length)) {
      group.id = measure?.groups[measureGroupNumber].id;
      measureServiceApi
        .updateGroup(group, measure.id)
        .then((g: Group) => {
          if (g === null || g.id === null) {
            throw new Error("Error updating group");
          }
          const updatedGroups = measure?.groups.map((group) => {
            if (group.id === g.id) {
              return {
                ...group,
                groupDescription: g.groupDescription,
                scoring: g.scoring,
                populations: g.populations,
                measureObservations: g.measureObservations,
                rateAggregation: g.rateAggregation,
                improvementNotation: g.improvementNotation,
                stratifications: g.stratifications,
                measureGroupTypes: g.measureGroupTypes || [],
                populationBasis: g.populationBasis,
                scoringUnit: g.scoringUnit,
              };
            }
            return group;
          });
          setMeasure({
            ...measure,
            groups: updatedGroups,
          });
        })
        .then(() => {
          setGenericErrorMessage("");
          handleDialogClose();
          setSuccessMessage(
            "Population details for this group updated successfully."
          );
          formik.resetForm();
          setActiveTab("populations");
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
          const updatedGroups = measure?.groups ? [...measure?.groups, g] : [g];
          setMeasure({
            ...measure,
            groups: updatedGroups,
          });

          //can be removed when validations for add new group is implemented
          measure?.groups
            ? setMeasureGroupNumber(measure?.groups.length)
            : setMeasureGroupNumber(0);
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

  const handleDialogClose = () => {
    setUpdateMeasureGroupScoringDialog(false);
    setDeleteMeasureGroupDialog({ open: false });
  };

  const deleteMeasureGroup = (e) => {
    e.preventDefault();
    measureServiceApi
      .deleteMeasureGroup(measure?.groups[measureGroupNumber]?.id, measure.id)
      .then((response) => {
        setMeasure(response);
        measure?.groups &&
          setMeasureGroupNumber(
            measureGroupNumber === 0 ? 0 : measureGroupNumber - 1
          );
        handleDialogClose();
      });
  };

  // Local state to later populate the left nav and and govern routes based on group ids
  const baseURL = "/measures/" + measure?.id + "/edit/measure-groups";
  const measureGroups = measure?.groups
    ? measure.groups?.map((group, id) => ({
        ...group,
        title: `MEASURE GROUP ${id + 1}`,
        href: `${baseURL}`,
        dataTestId: `leftPanelMeasureInformation-MeasureGroup${id + 1}`,
      }))
    : [
        {
          title: "MEASURE GROUP 1",
          href: `${baseURL}`,
          dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
        },
      ];

  const getDefaultObservationsForScoring = (scoring) => {
    if (scoring === MeasureScoring.CONTINUOUS_VARIABLE) {
      return [
        {
          id: uuidv4(),
          criteriaReference: null,
        },
      ];
    } else {
      return null;
    }
  };

  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit}>
        <Grid>
          <EditMeasureSideBarNav
            links={measureGroups}
            measureGroupNumber={measureGroupNumber}
            setMeasureGroupNumber={setMeasureGroupNumber}
            measure={measure}
            setSuccessMessage={setSuccessMessage}
          />
          <Content>
            <Header>
              <Title>Measure Group {measureGroupNumber + 1}</Title>
            </Header>

            {/* delete measure group warning dialog */}
            {deleteMeasureGroupDialog.open && (
              <MeasureGroupsWarningDialog
                open={deleteMeasureGroupDialog.open}
                onClose={handleDialogClose}
                onSubmit={deleteMeasureGroup}
                measureGroupNumber={deleteMeasureGroupDialog.measureGroupNumber}
                modalType="deleteMeasureGroup"
              />
            )}

            {/* scoring change warning dialog */}
            {updateMeasureGroupScoringDialog && (
              <MeasureGroupsWarningDialog
                open={updateMeasureGroupScoringDialog}
                onClose={handleDialogClose}
                onSubmit={() => submitForm(formik.values)}
                modalType="scoring"
              />
            )}

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

            {/* Form control later should be moved to own component and dynamically rendered by switch based on measure. */}

            <div tw="px-12 py-8">
              <FormField>
                <FormFieldInner>
                  <FieldLabel htmlFor="measure-group-description">
                    Group Description
                  </FieldLabel>
                  <FieldSeparator>
                    {canEdit && (
                      <TextArea
                        style={{ height: "100px", width: "600px" }}
                        value={formik.values.groupDescription}
                        name="group-description"
                        id="group-description"
                        autoComplete="group-description"
                        placeholder="Group Description"
                        data-testid="groupDescriptionInput"
                        {...formik.getFieldProps("groupDescription")}
                      />
                    )}
                    {!canEdit && formik.values.groupDescription}
                  </FieldSeparator>
                </FormFieldInner>
              </FormField>
              <FormField>
                <MultipleSelectDropDown
                  values={Object.values(MeasureGroupTypes)}
                  selectedValues={formik.values.measureGroupTypes}
                  formControl={formik.getFieldProps("measureGroupTypes")}
                  label="Measure Group Type"
                  id="measure-group-type"
                  clearAll={() => formik.setFieldValue("measureGroupTypes", [])}
                  canEdit={canEdit}
                />
              </FormField>
              {populationBasisValues && (
                <FormField>
                  <FieldSeparator>
                    <FieldLabel htmlFor="population-basis-combo-box">
                      Population Basis
                    </FieldLabel>
                    {canEdit && (
                      <Autocomplete
                        disablePortal
                        data-testid="population-basis-combo-box"
                        options={populationBasisValues}
                        sx={{ width: 300 }}
                        defaultValue={formik.values.populationBasis}
                        {...formik.getFieldProps("populationBasis")}
                        onChange={(_event: any, selectedVal: string | null) => {
                          formik.setFieldValue("populationBasis", selectedVal);
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="" />
                        )}
                      />
                    )}
                    {!canEdit && formik.values.populationBasis}
                  </FieldSeparator>
                </FormField>
              )}
              <FormField>
                <FieldSeparator>
                  {/* pull from cql file */}
                  <SoftLabel htmlFor="scoring-unit-select">
                    Group Scoring:
                  </SoftLabel>
                  {canEdit && (
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
                      onKeyPress={(e) => {
                        e.preventDefault();
                      }}
                      onChange={(e) => {
                        const nextScoring = e.target.value;
                        const populations =
                          getPopulationsForScoring(nextScoring);
                        const observations =
                          getDefaultObservationsForScoring(nextScoring);
                        formik.resetForm({
                          values: {
                            ...formik.values,
                            scoring: nextScoring,
                            populations: [...populations].map((p) => ({
                              ...p,
                              id: uuidv4(),
                            })),
                            measureObservations: observations,
                          },
                        });
                      }}
                    >
                      {Object.values(GroupScoring).map((opt, i) => (
                        <option
                          key={`${opt}-${i}`}
                          value={opt}
                          data-testid="scoring-unit-option"
                        >
                          {opt}
                        </option>
                      ))}
                    </TextField>
                  )}
                  {!canEdit && formik.values.scoring}
                </FieldSeparator>
              </FormField>
              <MeasureGroupScoringUnit
                {...formik.getFieldProps("scoringUnit")}
                onChange={(newValue) => {
                  formik.setFieldValue("scoringUnit", newValue);
                }}
                canEdit={canEdit}
              />
              <div>
                <MenuItemContainer>
                  <MenuItem
                    data-testid="populations-tab"
                    isActive={activeTab == "populations"}
                    onClick={() => {
                      setActiveTab("populations");
                    }}
                  >
                    Populations{" "}
                    {!!formik.errors.populations &&
                      activeTab !== "populations" &&
                      "🚫"}
                  </MenuItem>
                  {formik.values.scoring !== "Ratio" && (
                    <MenuItem
                      data-testid="stratifications-tab"
                      isActive={activeTab == "stratification"}
                      onClick={() => {
                        setActiveTab("stratification");
                        if (!!formik.values.stratifications) {
                          while (formik.values.stratifications.length < 2) {
                            formik.values.stratifications.push({
                              ...EmptyStrat,
                            });
                          }
                        } else {
                          formik.values.stratifications = [
                            {
                              ...EmptyStrat,
                            },
                            {
                              ...EmptyStrat,
                            },
                          ];
                        }
                      }}
                    >
                      Stratifications
                    </MenuItem>
                  )}
                  <MenuItem
                    data-testid="reporting-tab"
                    isActive={activeTab == "reporting"}
                    onClick={() => setActiveTab("reporting")}
                  >
                    Reporting
                  </MenuItem>
                </MenuItemContainer>
              </div>
              {activeTab === "populations" && (
                <FieldArray
                  name="populations"
                  render={(arrayHelpers) => (
                    <GridLayout container spacing={1} alignItems="center">
                      {formik.values.populations?.map((population, index) => {
                        const fieldProps = {
                          name: `populations[${index}].definition`,
                        };
                        const populationCount = findPopulations(
                          formik.values.populations,
                          population.name
                        ).length;
                        const gridSize = populationCount === 2 ? 6 : 12;
                        return (
                          <React.Fragment key={`population_${index}`}>
                            <GridLayout item xs={gridSize}>
                              <Field
                                {...fieldProps}
                                component={GroupPopulation}
                                cqlDefinitions={expressionDefinitions}
                                populations={formik.values.populations}
                                population={population}
                                populationIndex={index}
                                scoring={formik.values.scoring}
                                canEdit={canEdit}
                                insertCallback={arrayHelpers.insert}
                                removeCallback={arrayHelpers.remove}
                              />
                            </GridLayout>
                            <GridLayout
                              item
                              xs={gridSize}
                              key={`population_${index}`}
                            >
                              <MeasureGroupObservation
                                scoring={formik.values.scoring}
                                population={population}
                                elmJson={measure.elmJson}
                              />
                            </GridLayout>
                          </React.Fragment>
                        );
                      })}
                      <GridLayout item>
                        <MeasureGroupObservation
                          scoring={formik.values.scoring}
                          population={null}
                          elmJson={measure.elmJson}
                        />
                      </GridLayout>
                    </GridLayout>
                  )}
                />
              )}
              {activeTab === "stratification" && (
                <div>
                  {formik.values.stratifications.map((strat, i) => (
                    <Row>
                      <Col>
                        <FieldLabel htmlFor="stratification-select">
                          Stratification {i + 1}
                        </FieldLabel>
                        <TextField
                          select
                          id="stratification-select"
                          label=""
                          value={formik.values.stratifications[i].cqlDefinition}
                          inputProps={{
                            "data-testid": "stratification-select",
                          }}
                          onChange={formik.handleChange}
                          InputLabelProps={{ shrink: false }}
                          SelectProps={{
                            native: true,
                          }}
                          name={`stratifications[${i}].cqlDefinition`}
                        >
                          <option
                            value=""
                            data-testid="stratification-select-option"
                          >
                            -
                          </option>
                          {Object.values(
                            expressionDefinitions.sort((a, b) =>
                              a.name.localeCompare(b.name)
                            )
                          ).map((opt, i) => (
                            <option
                              key={`${i + 1}`}
                              value={opt.name}
                              data-testid="stratification-select-option"
                            >
                              {opt.name.replace(/"/g, "")}
                            </option>
                          ))}
                        </TextField>
                        <FieldLabel htmlFor="association-select">
                          Association {i + 1}
                        </FieldLabel>
                        <TextField
                          select
                          id="association-select"
                          label=""
                          value={formik.values.stratifications[i].association}
                          inputProps={{
                            "data-testid": "association-select",
                          }}
                          onChange={formik.handleChange}
                          InputLabelProps={{ shrink: false }}
                          SelectProps={{
                            native: true,
                          }}
                          name={`stratifications[${i}].association`}
                        >
                          {formik.values.scoring != "Select" &&
                            Object.values(
                              AssociationSelect[formik.values.scoring]
                            ).map((opt, i) => (
                              <option
                                key={`${opt}-${i}`}
                                value={`${opt}`}
                                data-testid="association-select-option"
                              >
                                {opt}
                              </option>
                            ))}
                        </TextField>
                      </Col>
                      <Col>
                        <FieldLabel htmlFor="stratification-description">
                          Stratification {i + 1} Description
                        </FieldLabel>
                        <FieldSeparator>
                          {canEdit && (
                            <textarea
                              value={
                                formik.values.stratifications[i].description
                              }
                              //type="text"
                              name={`stratifications[${i}].description`}
                              id="stratification-description"
                              autoComplete="stratification-description"
                              placeholder="Enter Description"
                              data-testid="stratificationDescriptionText"
                              maxLength={5000}
                              {...formik.getFieldProps(
                                `stratifications[${i}].description`
                              )}
                            />
                          )}
                        </FieldSeparator>
                      </Col>
                    </Row>
                  ))}
                  <Row>
                    <Button
                      buttonTitle="Add Stratification"
                      data-testid="add-strat-button"
                      onClick={(e) => {
                        e.preventDefault();
                        formik.values.stratifications = [
                          ...formik.values.stratifications,
                          EmptyStrat,
                        ];

                        //idk how to force a component update in a less dumb way
                        if (successMessage !== "") {
                          setSuccessMessage("");
                        } else {
                          setSuccessMessage(undefined);
                        }
                      }}
                    />
                  </Row>
                </div>
              )}
              {activeTab === "reporting" && (
                <div>
                  <FormField>
                    <FormFieldInner>
                      <FieldLabel htmlFor="rate-aggregation">
                        Rate Aggregation
                      </FieldLabel>
                      <FieldSeparator>
                        {canEdit && (
                          <FieldInput
                            value={formik.values.rateAggregation}
                            type="text"
                            name="rate-aggregation"
                            id="rate-aggregation"
                            autoComplete="rate-aggregation"
                            placeholder="Rate Aggregation"
                            data-testid="rateAggregationText"
                            {...formik.getFieldProps("rateAggregation")}
                          />
                        )}
                      </FieldSeparator>
                      <Divider />
                      <FieldLabel htmlFor="rate-aggregation">
                        Improvement Notation
                      </FieldLabel>
                      <FieldSeparator>
                        {canEdit && (
                          <TextField
                            select
                            id="improvement-notation-select"
                            label=""
                            value={formik.values.improvementNotation}
                            inputProps={{
                              "data-testid": "improvement-notation-select",
                            }}
                            onChange={(e) => {
                              formik.setFieldValue(
                                "improvementNotation",
                                e.target.value
                              );
                            }}
                            InputLabelProps={{ shrink: false }}
                            SelectProps={{
                              native: true,
                            }}
                            name="type"
                          >
                            {Object.values(MeasureImprovementNotation).map(
                              (opt, i) => (
                                <option
                                  key={`${opt.code}-${i}`}
                                  value={opt.label}
                                  data-testid="improvement-notation-option"
                                >
                                  {opt.label}
                                </option>
                              )
                            )}
                          </TextField>
                        )}
                        {!canEdit && formik.values.improvementNotation}
                      </FieldSeparator>
                    </FormFieldInner>
                  </FormField>
                </div>
              )}
            </div>
          </Content>
        </Grid>
        {canEdit && (
          <GroupFooter>
            <GroupActions />
            <PopulationActions>
              <ButtonSpacer>
                <Button
                  style={{ background: "#424B5A" }}
                  type="submit"
                  buttonTitle="Delete"
                  data-testid="group-form-delete-btn"
                  disabled={
                    measureGroupNumber >= measure?.groups?.length ||
                    !measure?.groups
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteMeasureGroupDialog({
                      open: true,
                      measureGroupNumber: measureGroupNumber,
                    });
                  }}
                />
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
              <ButtonSpacer style={{ float: "right" }}>
                <ButtonSpacer>
                  <Button
                    type="button"
                    buttonTitle="Discard Changes"
                    variant="white"
                    disabled={!formik.dirty}
                    data-testid="group-form-discard-btn"
                    onClick={() => discardChanges()}
                  />
                </ButtonSpacer>
                <ButtonSpacer>
                  <Button
                    style={{ background: "#424B5A" }}
                    type="submit"
                    buttonTitle="Save"
                    data-testid="group-form-submit-btn"
                    disabled={!(formik.isValid && formik.dirty)}
                  />
                </ButtonSpacer>
              </ButtonSpacer>
            </PopulationActions>
          </GroupFooter>
        )}
      </form>
    </FormikProvider>
  );
};

export default MeasureGroups;
