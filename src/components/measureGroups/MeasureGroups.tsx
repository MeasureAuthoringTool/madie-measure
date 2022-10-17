import React, { useEffect, useState } from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import {
  Measure,
  Group,
  GroupScoring,
  MeasureGroupTypes,
  PopulationType,
} from "@madie/madie-models";
import {
  Alert,
  Grid as GridLayout,
  MenuItem as MuiMenuItem,
  Link,
  Typography,
  Divider,
} from "@mui/material";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import EditMeasureSideBarNav from "../editMeasure/measureDetails/EditMeasureSideBarNav";
import {
  Button,
  MadieDiscardDialog,
  Select,
} from "@madie/madie-design-system/dist/react/";
import { useFormik, FormikProvider, FieldArray, Field, getIn } from "formik";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { v4 as uuidv4 } from "uuid";
import {
  measureGroupSchemaValidator,
  CqlDefineDataTypes,
} from "../../validations/MeasureGroupSchemaValidator";
import {
  useOktaTokens,
  measureStore,
  routeHandlerStore,
} from "@madie/madie-util";
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
import AutoComplete from "./AutoComplete";

const Grid = styled.div(() => [tw`grid grid-cols-4 ml-1 gap-y-4`]);
const Content = styled.div(() => [tw`col-span-3 pl-4 pr-4`]);

const ButtonSpacer = styled.span`
  margin-left: 15px;
`;
const GroupFooter = tw(Grid)`border-t border-b`;
const GroupActions = styled.div(() => [tw`col-span-1 border-r p-1`]);
const PopulationActions = styled.div(() => [
  "background-color: #f2f5f7;",
  tw`col-span-3 p-1 pl-6`,
  "display: flex; align-items: end; justify-content: space-between",
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

const FormField = tw.div`mt-6 grid grid-cols-4`;
const FormFieldInner = tw.div`sm:col-span-3`;
const FieldLabel = tw.label`block capitalize text-sm font-medium text-slate-90`;
const FieldSeparator = tw.div`mt-1`;
const FieldInput = tw.input`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;
const TextArea = tw.textarea`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;

const deleteToken = "FDE8472A-6095-4292-ABF7-E35AD435F05F"; // randomly generated token for deleting

// provides dropdown options for Improvement Notation
const improvementNotationOptions = [
  {
    label: "-",
    value: "",
    subtitle: "Optional",
    code: "",
  },
  {
    label: "Increased score indicates improvement",
    value: "Increased score indicates improvement",
    subtitle:
      "Improvement is indicated as an increase in the score or measurement (e.g. Higher score indicates better quality).",
    code: "increase",
  },
  {
    label: "Decreased score indicates improvement",
    value: "Decreased score indicates improvement",
    subtitle:
      "Improvement is indicated as a decrease in the score or measurement (e.g. Lower score indicates better quality).",
    code: "decrease",
  },
];

// default value for any association is Initial population
// TODO: figure out why it is being called on every rerender
const getEmptyStrat = () => ({
  cqlDefinition: "",
  description: "",
  association: PopulationType.INITIAL_POPULATION,
  id: uuidv4(),
});

export const deleteStrat = {
  cqlDefinition: "delete",
  description: deleteToken,
  association: PopulationType.INITIAL_POPULATION,
  id: "",
};

// provides dropdown options for stratification association
const associationSelect = {
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
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const { getUserName } = useOktaTokens();
  const userName = getUserName();
  const canEdit =
    measure?.createdBy === userName ||
    measure?.acls?.some(
      (acl) => acl.userId === userName && acl.roles.indexOf("SHARED_WITH") >= 0
    );
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
  const [visibleStrats, setVisibleStrats] = useState<number>(2);
  // Todo option should be an Array when passing to AutoComplete.
  // warning during test cases
  const [populationBasisValues, setPopulationBasisValues] =
    useState<string[]>();
  const [associationChanged, setAssociationChanged] = useState(false);

  const [cqlDefinitionDataTypes, setCqlDefinitionDataTypes] =
    useState<CqlDefineDataTypes>();

  useEffect(() => {
    setCqlDefinitionDataTypes(
      measureServiceApi.getReturnTypesForAllCqlDefinitions(measure?.elmJson)
    );
  }, [measure?.elmJson]);

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
          measureObservations:
            measure?.groups[measureGroupNumber].measureObservations || null,
          improvementNotation:
            measure?.groups[measureGroupNumber].improvementNotation || "",
        },
      });
      setVisibleStrats(
        measure.groups[measureGroupNumber].stratifications
          ? measure.groups[measureGroupNumber].stratifications.length
          : 2
      );
    } else {
      if (measureGroupNumber >= measure?.groups?.length || !measure?.groups) {
        resetForm({
          values: {
            id: null,
            scoring: "",
            populations: [],
            measureObservations: null,
            groupDescription: "",
            stratifications: [getEmptyStrat(), getEmptyStrat()],
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

  const formik = useFormik({
    initialValues: {
      id: group?.id || null,
      scoring: group?.scoring || "",
      populations: allPopulations,
      measureObservations: null,
      rateAggregation: group?.rateAggregation || "",
      improvementNotation: group?.improvementNotation || "",
      groupDescription: group?.groupDescription,
      stratifications: group?.stratifications || [
        getEmptyStrat(),
        getEmptyStrat(),
      ],
      measureGroupTypes: group?.measureGroupTypes || [],
      populationBasis: group?.populationBasis || "Boolean",
      scoringUnit: group?.scoringUnit,
    } as Group,
    validationSchema: measureGroupSchemaValidator(cqlDefinitionDataTypes),
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
  // We want to update layout with a cannot travel flag while this is active
  const { updateRouteHandlerState } = routeHandlerStore;
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

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

  // local discard check. Layout can't have access to a bound function
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const discardChanges = () => {
    // check to identify a new group
    if (measureGroupNumber >= measure?.groups?.length || !measure?.groups) {
      resetForm({
        values: {
          id: null,
          groupDescription: "",
          scoring: "",
          measureGroupTypes: [],
          rateAggregation: "",
          improvementNotation: "",
          populationBasis: "Boolean",
          scoringUnit: "",
        },
      });
    } else {
      // resetting form with data from DB
      resetForm({
        values: {
          ...measure?.groups[measureGroupNumber],
        },
      });
    }
    setDiscardDialogOpen(false);
  };

  const submitForm = (group: Group) => {
    if (group.stratifications) {
      group.stratifications = group.stratifications.filter(
        (strat) =>
          (!!strat.description || !!strat.cqlDefinition) &&
          strat.description !== deleteToken
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
          setAssociationChanged(false);
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
        title: `Population Criteria ${id + 1}`,
        href: `${baseURL}`,
        dataTestId: `leftPanelMeasureInformation-MeasureGroup${id + 1}`,
      }))
    : [
        {
          title: "Population Criteria 1",
          href: `${baseURL}`,
          dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
        },
      ];

  const getDefaultObservationsForScoring = (scoring) => {
    if (scoring === GroupScoring.CONTINUOUS_VARIABLE) {
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

  // Provides dropdown options for stratification
  // contains a default value along with all available CQL Definitions
  const stratificationOptions = [
    <MuiMenuItem key="-" value={""}>
      -
    </MuiMenuItem>,
    expressionDefinitions
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((opt, i) => {
        const sanitizedString = opt.name.replace(/"/g, "");
        return (
          <MuiMenuItem key={`${sanitizedString}-${i}`} value={sanitizedString}>
            {sanitizedString}
          </MuiMenuItem>
        );
      }),
  ];

  return (
    <FormikProvider value={formik}>
      <form onSubmit={formik.handleSubmit}>
        <Grid>
          <EditMeasureSideBarNav
            dirty={formik.dirty}
            links={measureGroups}
            measureGroupNumber={measureGroupNumber}
            setMeasureGroupNumber={setMeasureGroupNumber}
            measure={measure}
            setSuccessMessage={setSuccessMessage}
          />
          <Content>
            <div className="subTitle" style={{ marginTop: 30 }}>
              <h3 data-testid="title">
                Population Criteria {measureGroupNumber + 1}
              </h3>
              <div className="required">
                <Typography
                  style={{
                    fontSize: 14,
                    fontWeight: 300,
                    fontFamily: "Rubik",
                    float: "right",
                    marginBottom: -10,
                  }}
                >
                  <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
                  Indicates required field
                </Typography>
              </div>
              <div>
                <Divider style={{ marginTop: 30, marginBottom: 20 }} />
              </div>
            </div>

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

            <div>
              <FormField>
                <FormFieldInner>
                  <FieldLabel htmlFor="measure-group-description">
                    Description
                  </FieldLabel>
                  <FieldSeparator>
                    {canEdit && (
                      <TextArea
                        style={{ height: "100px", width: "600px" }}
                        value={formik.values.groupDescription}
                        name="group-description"
                        id="group-description"
                        autoComplete="group-description"
                        placeholder="Description"
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
                  label="Type"
                  id="measure-group-type"
                  clearAll={() => formik.setFieldValue("measureGroupTypes", [])}
                  canEdit={canEdit}
                  required={true}
                  disabled={false}
                />

                {populationBasisValues && (
                  <AutoComplete
                    id="population-basis"
                    label="Population Basis"
                    placeHolder={{ name: "-", value: "" }}
                    defaultValue={formik.values.populationBasis}
                    required={true}
                    disabled={false}
                    {...formik.getFieldProps("populationBasis")}
                    error={
                      formik.touched.populationBasis &&
                      Boolean(formik.errors.populationBasis)
                    }
                    helperText={
                      formik.touched.populationBasis &&
                      formik.errors.populationBasis
                    }
                    onChange={(_event: any, selectedVal: string | null) => {
                      formik.setFieldValue("populationBasis", selectedVal);
                    }}
                    options={populationBasisValues}
                  ></AutoComplete>
                )}

                {canEdit && (
                  <Select
                    placeHolder={{ name: "-", value: "" }}
                    required
                    label="Scoring"
                    id="scoring-select"
                    inputProps={{ "data-testid": "scoring-select-input" }}
                    data-testid="scoring-select"
                    {...formik.getFieldProps("scoring")}
                    error={
                      formik.touched.scoring && Boolean(formik.errors.scoring)
                    }
                    helperText={formik.touched.scoring && formik.errors.scoring}
                    size="small"
                    onChange={(e) => {
                      const nextScoring = e.target.value;
                      const populations = getPopulationsForScoring(nextScoring);
                      const observations =
                        getDefaultObservationsForScoring(nextScoring);
                      formik.setFieldValue("scoring", nextScoring);
                      formik.setFieldValue(
                        "populations",
                        [...populations].map((p) => ({
                          ...p,
                          id: uuidv4(),
                        }))
                      );
                      formik.setFieldValue("measureObservations", observations);
                    }}
                    options={Object.keys(GroupScoring).map((scoring) => {
                      return (
                        <MuiMenuItem
                          key={scoring}
                          value={GroupScoring[scoring]}
                          data-testid={`group-scoring-option-${scoring}`}
                        >
                          {GroupScoring[scoring]}
                        </MuiMenuItem>
                      );
                    })}
                  />
                )}
                {!canEdit && formik.values.scoring}

                <MeasureGroupScoringUnit
                  {...formik.getFieldProps("scoringUnit")}
                  onChange={(newValue) => {
                    formik.setFieldValue("scoringUnit", newValue);
                  }}
                  canEdit={canEdit}
                />
              </FormField>

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
                            formik.values.stratifications.push(getEmptyStrat());
                            setVisibleStrats(2);
                          }
                        } else {
                          formik.values.stratifications = [
                            getEmptyStrat(),
                            getEmptyStrat(),
                          ];
                          setVisibleStrats(2);
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
                                replaceCallback={arrayHelpers.replace}
                                setAssociationChanged={setAssociationChanged}
                              />
                            </GridLayout>

                            <MeasureGroupObservation
                              canEdit={canEdit}
                              scoring={formik.values.scoring}
                              population={population}
                              elmJson={measure?.elmJson}
                              linkMeasureObservationDisplay={true}
                            />
                          </React.Fragment>
                        );
                      })}
                      <MeasureGroupObservation
                        canEdit={canEdit}
                        scoring={formik.values.scoring}
                        population={
                          formik.values.populations?.filter(
                            (pop) =>
                              pop.name === PopulationType.MEASURE_POPULATION
                          )[0]
                        }
                        elmJson={measure?.elmJson}
                        linkMeasureObservationDisplay={null}
                      />
                    </GridLayout>
                  )}
                />
              )}

              {activeTab === "stratification" && (
                <FieldArray
                  name="stratifications"
                  render={(arrayHelpers) => (
                    <div>
                      {formik.values.stratifications ? (
                        formik.values.stratifications.map(
                          (strat, i) =>
                            formik.values.stratifications[i].description !==
                              deleteToken && (
                              <div key={i}>
                                <Row>
                                  <Col>
                                    {/*Todo need to fix Styling*/}
                                    <div>
                                      {formik.values.stratifications.length >
                                        2 &&
                                        visibleStrats > 2 && (
                                          <Link
                                            component="button"
                                            underline="always"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              arrayHelpers.replace(
                                                i,
                                                deleteStrat
                                              );
                                              setVisibleStrats(
                                                visibleStrats - 1
                                              );
                                            }}
                                            variant="body2"
                                            data-testid="remove-strat-button"
                                          >
                                            Remove
                                          </Link>
                                        )}

                                      <Select
                                        readOnly={!canEdit}
                                        placeHolder={{ name: "-", value: "" }}
                                        label={`Stratification ${i + 1}`}
                                        id={`Stratification-select-${i + 1}`}
                                        error={Boolean(
                                          getIn(
                                            formik.errors,
                                            `stratifications[${i}].cqlDefinition`
                                          )
                                        )}
                                        helperText={getIn(
                                          formik.errors,
                                          `stratifications[${i}].cqlDefinition`
                                        )}
                                        inputProps={{
                                          "data-testid": `stratification-${
                                            i + 1
                                          }-input`,
                                        }}
                                        {...formik.getFieldProps(
                                          `stratifications[${i}].cqlDefinition`
                                        )}
                                        size="small"
                                        options={stratificationOptions}
                                      />
                                    </div>

                                    <Select
                                      readOnly={!canEdit}
                                      placeHolder={{ name: "-", value: "" }}
                                      label={`Association ${i + 1}`}
                                      id={`association-select-${i + 1}`}
                                      inputProps={{
                                        "data-testid": `association-${
                                          i + 1
                                        }-input`,
                                      }}
                                      {...formik.getFieldProps(
                                        `stratifications[${i}].association`
                                      )}
                                      size="small"
                                      options={
                                        !!formik.values.scoring &&
                                        associationSelect[
                                          formik.values.scoring
                                        ].map((opt, i) => (
                                          <MuiMenuItem
                                            key={`${opt}-${i}`}
                                            value={`${opt}`}
                                          >
                                            {opt}
                                          </MuiMenuItem>
                                        ))
                                      }
                                    />
                                  </Col>
                                  <Col>
                                    <FieldLabel htmlFor="stratification-description">
                                      Stratification {i + 1} Description
                                    </FieldLabel>
                                    <FieldSeparator>
                                      {canEdit && (
                                        <textarea
                                          value={
                                            formik.values.stratifications[i]
                                              .description
                                          }
                                          readOnly={!canEdit}
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
                              </div>
                            )
                        )
                      ) : (
                        <div />
                      )}
                      <div>
                        {canEdit && (
                          <Row>
                            <Button
                              data-testid="add-strat-button"
                              onClick={(e) => {
                                e.preventDefault();
                                setVisibleStrats(visibleStrats + 1);
                                arrayHelpers.push(getEmptyStrat());
                              }}
                            >
                              Add Stratification
                            </Button>
                          </Row>
                        )}
                      </div>
                    </div>
                  )}
                />
              )}
              {activeTab === "reporting" && (
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
                    <FieldSeparator>
                      {canEdit && (
                        <Select
                          placeHolder={{ name: "-", value: "" }}
                          label="Improvement Notation"
                          id="improvement-notation-select"
                          inputProps={{
                            "data-testid": "improvement-notation-input",
                          }}
                          data-testid="improvement-notation-select"
                          {...formik.getFieldProps("improvementNotation")}
                          size="small"
                          options={Object.values(
                            improvementNotationOptions
                          ).map((opt) => (
                            <MuiMenuItem key={opt.label} value={opt.value}>
                              {opt.label}
                            </MuiMenuItem>
                          ))}
                        />
                      )}
                      {!canEdit && formik.values.improvementNotation}
                    </FieldSeparator>
                  </FormFieldInner>
                </FormField>
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
                  type="button"
                  buttontitle="Delete"
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
                >
                  Delete
                </Button>
              </ButtonSpacer>
              <ButtonSpacer>
                <span
                  tw="text-sm text-gray-600"
                  data-testid="save-measure-group-validation-message"
                >
                  {measureGroupSchemaValidator(
                    cqlDefinitionDataTypes
                  ).isValidSync(formik.values)
                    ? ""
                    : "You must set all required Populations."}
                </span>
              </ButtonSpacer>
              <ButtonSpacer style={{ float: "right" }}>
                <ButtonSpacer>
                  <Button
                    type="button"
                    variant="white"
                    disabled={!formik.dirty}
                    data-testid="group-form-discard-btn"
                    onClick={() => setDiscardDialogOpen(true)}
                  >
                    Discard Changes
                  </Button>
                </ButtonSpacer>
                <ButtonSpacer>
                  <Button
                    style={{ background: "#424B5A" }}
                    type="submit"
                    data-testid="group-form-submit-btn"
                    disabled={
                      !(formik.isValid && (formik.dirty || associationChanged))
                    }
                  >
                    Save
                  </Button>
                </ButtonSpacer>
              </ButtonSpacer>
            </PopulationActions>
          </GroupFooter>
        )}
      </form>
      <MadieDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onContinue={discardChanges}
      />
    </FormikProvider>
  );
};

export default MeasureGroups;
