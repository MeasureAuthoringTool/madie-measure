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
  MenuItem as MuiMenuItem,
  Link,
  Typography,
  Divider,
  Tabs,
  Tab,
  FormHelperText,
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
  useDocumentTitle,
} from "@madie/madie-util";
import MultipleSelectDropDown from "./MultipleSelectDropDown";
import MeasureGroupsWarningDialog from "./MeasureGroupWarningDialog";
import { allPopulations, getPopulationsForScoring } from "./PopulationHelper";
import GroupPopulation from "./GroupPopulation";
import MeasureGroupScoringUnit from "./MeasureGroupScoringUnit";
import MeasureGroupObservation from "./MeasureGroupObservation";
import AutoComplete from "./AutoComplete";
import * as _ from "lodash";
import MeasureGroupAlerts from "./MeasureGroupAlerts";
import { Toast } from "@madie/madie-design-system/dist/react";

const ButtonSpacer = styled.span`
  margin-left: 15px;
`;

const MenuItemContainer = tw.ul`bg-transparent flex pt-12 pb-4 border-b`;

interface ColSpanPopulationsType {
  isExclusionPop?: boolean;
  isSecondInitialPopulation?: boolean;
}

const ColSpanPopulations = styled.div((props: ColSpanPopulationsType) => [
  props.isSecondInitialPopulation || props.isExclusionPop
    ? tw`lg:col-start-2`
    : tw`lg:col-start-1`,
]);

// const FormField = tw.div`mt-6 grid grid-cols-4`;
const FormFieldInner = tw.div`lg:col-span-3`;
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
    PopulationType.INITIAL_POPULATION,
    PopulationType.DENOMINATOR,
    PopulationType.DENOMINATOR_EXCLUSION,
    PopulationType.NUMERATOR,
    PopulationType.NUMERATOR_EXCLUSION,
    PopulationType.DENOMINATOR_EXCEPTION,
  ],
  "Continuous Variable": [
    PopulationType.INITIAL_POPULATION,
    PopulationType.MEASURE_POPULATION,
    PopulationType.MEASURE_POPULATION_EXCLUSION,
  ],
  Cohort: [PopulationType.INITIAL_POPULATION],
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
  useDocumentTitle("MADiE Edit Measure Population Criteria");
  const defaultPopulationBasis = "boolean";
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

  const [alertMessage, setAlertMessage] = useState({
    type: undefined,
    message: undefined,
    canClose: false,
  });

  // toast utilities
  // toast is only used for success messages
  // creating and updating PC
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType(null);
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

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

  const goBackToNav = (e) => {
    if (e.shiftKey && e.keyCode == 9) {
      e.preventDefault();
      document.getElementById(measureGroupNumber.toString()).focus();
    }
  };

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
            populationBasis: defaultPopulationBasis,
            scoringUnit: "",
          },
        });
      }
    }
    setActiveTab("populations");
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
      populationBasis: group?.populationBasis || defaultPopulationBasis,
      scoringUnit: group?.scoringUnit,
    } as Group,
    validationSchema: measureGroupSchemaValidator(cqlDefinitionDataTypes),
    onSubmit: (group: Group) => {
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
      .catch((err) =>
        setAlertMessage({
          type: "error",
          message: err.message,
          canClose: false,
        })
      );
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
          populationBasis: defaultPopulationBasis,
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
          setAssociationChanged(false);
          handleDialogClose();
          handleToast(
            "success",
            "Population details for this group updated successfully.",
            true
          );
          formik.resetForm();
          setActiveTab("populations");
        })
        .catch((error) => {
          setAlertMessage({
            type: "error",
            message: error.message,
            canClose: false,
          });
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
          handleToast(
            "success",
            "Population details for this group saved successfully.",
            true
          );
        })
        .catch((error) => {
          setAlertMessage({
            type: "error",
            message: error.message,
            canClose: false,
          });
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

  // sets alert message when CQL has any errors
  useEffect(() => {
    if (measure && (measure.cqlErrors || !measure?.cql)) {
      setAlertMessage({
        type: "error",
        message: "Please complete the CQL Editor process before continuing",
        canClose: false,
      });
    }
  }, [measure]);

  return (
    <FormikProvider value={formik}>
      <MeasureGroupAlerts {...alertMessage} />
      <Toast
        toastKey="population-criteria-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `population-criteria-error`
            : `population-criteria-success`
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
      <form onSubmit={formik.handleSubmit}>
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

        <div tw="grid lg:grid-cols-6 gap-4 mx-8 my-6 shadow-lg rounded-md border border-slate bg-white">
          <EditMeasureSideBarNav
            dirty={formik.dirty}
            links={measureGroups}
            measureGroupNumber={measureGroupNumber}
            setMeasureGroupNumber={setMeasureGroupNumber}
            measure={measure}
          />
          <div tw="lg:col-span-5 pl-2 pr-2">
            <div tw="flex pb-2 pt-6">
              {/* eslint-disable-next-line */}
              <h2 tw="w-1/2 mb-0" data-testid="title" id="title">
                Population Criteria {measureGroupNumber + 1}
              </h2>
              <div tw="w-1/2 self-end">
                <Typography
                  style={{
                    fontSize: 14,
                    fontWeight: 300,
                    fontFamily: "Rubik",
                    float: "right",
                  }}
                >
                  <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
                  Indicates required field
                </Typography>
              </div>
            </div>
            <Divider style={{ marginBottom: 30 }} />

            {/* Form control later should be moved to own component and dynamically rendered by switch based on measure. */}

            <div>
              <div tw="grid lg:grid-cols-4 gap-4">
                <FormFieldInner>
                  <FieldLabel htmlFor="measure-group-description">
                    Description
                  </FieldLabel>
                  <FieldSeparator>
                    {canEdit && (
                      <TextArea
                        style={{ height: "100px", width: "100%" }}
                        value={formik.values.groupDescription}
                        name="group-description"
                        id="group-description"
                        autoComplete="group-description"
                        placeholder="Description"
                        data-testid="groupDescriptionInput"
                        onKeyDown={goBackToNav}
                        {...formik.getFieldProps("groupDescription")}
                      />
                    )}
                    {!canEdit && formik.values.groupDescription}
                  </FieldSeparator>
                </FormFieldInner>
                <div tw="lg:col-start-1">
                  <MultipleSelectDropDown
                    formControl={formik.getFieldProps("measureGroupTypes")}
                    id="measure-group-type"
                    label="Type"
                    placeHolder={{ name: "-", value: "" }}
                    defaultValue={formik.values.measureGroupTypes}
                    required={true}
                    disabled={!canEdit}
                    error={
                      formik.touched.measureGroupTypes &&
                      Boolean(formik.errors.measureGroupTypes)
                    }
                    helperText={
                      formik.touched.measureGroupTypes &&
                      formik.errors.measureGroupTypes
                    }
                    {...formik.getFieldProps("measureGroupTypes")}
                    onChange={(_event: any, selectedVal: string | null) => {
                      formik.setFieldValue("measureGroupTypes", selectedVal);
                    }}
                    options={Object.values(MeasureGroupTypes)}
                    multipleSelect={true}
                    limitTags={1}
                  ></MultipleSelectDropDown>
                  {formik.errors["measureGroupTypes"] && (
                    <FormHelperText
                      tabIndex={0}
                      aria-live="polite"
                      data-testid={`measure-group-type-helper-text`}
                      id="measure-group-type-helper-text"
                      error={true}
                    >
                      {formik.errors["measureGroupTypes"]}
                    </FormHelperText>
                  )}
                </div>

                {populationBasisValues && (
                  <div>
                    <AutoComplete
                      id="population-basis"
                      label="Population Basis"
                      placeHolder={{ name: "-", value: "" }}
                      defaultValue={formik.values.populationBasis}
                      required={true}
                      disabled={false}
                      {...formik.getFieldProps("populationBasis")}
                      error={
                        formik.touched["population-basis"] &&
                        Boolean(formik.errors.populationBasis)
                      }
                      helperText={
                        formik.touched["population-basis"] &&
                        formik.errors.populationBasis
                      }
                      onChange={(_event: any, selectedVal: string | null) => {
                        formik.setFieldValue("populationBasis", selectedVal);
                      }}
                      options={populationBasisValues}
                    />
                  </div>
                )}

                {canEdit && (
                  <Select
                    placeHolder={{ name: "-", value: "" }}
                    required
                    label="Scoring"
                    id="scoring-select"
                    inputProps={{
                      "data-testid": "scoring-select-input",
                    }}
                    data-testid="scoring-select"
                    {...formik.getFieldProps("scoring")}
                    error={
                      formik.touched.scoring && Boolean(formik.errors.scoring)
                    }
                    helperText={formik.touched.scoring && formik.errors.scoring}
                    size="small"
                    SelectDisplayProps={{
                      "aria-required": "true",
                    }}
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
                      formik.setFieldValue("stratifications", []);
                      setActiveTab("populations");
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
              </div>

              <div>
                <MenuItemContainer>
                  <Tabs
                    value={activeTab}
                    sx={{
                      fontWeight: 700,
                      color: "#003366",
                      "&:focus": {
                        color: "red",
                      },
                      "& .MuiTabs-indicator": {
                        height: "4px",
                        backgroundColor: "#209FA6",
                      },
                      "& .Mui-selected": {
                        fontWeight: 500,
                        color: "#003366 !important",
                        outline: "none",
                      },
                    }}
                  >
                    <Tab
                      role="tabpanel"
                      aria-label="Populations tab panel"
                      tabIndex={0}
                      sx={{
                        padding: "24px 21px",
                        fontFamily: "Rubik, sans serif",
                        borderRadius: "6px 0 0 0",
                        fontWeight: 400,
                        color: "#003366",
                        "&:focus": {
                          outline: "5px auto -webkit-focus-ring-color",
                          outlineOffset: "-2px",
                        },
                      }}
                      label={`Populations 
                ${
                  !!formik.errors.populations && activeTab !== "populations"
                    ? "🚫"
                    : ""
                }`}
                      data-testid="populations-tab"
                      onClick={() => {
                        setActiveTab("populations");
                      }}
                      value="populations"
                    />
                    {formik.values.scoring !== "Ratio" && (
                      <Tab
                        role="tabpanel"
                        aria-label="Stratifications tab panel"
                        tabIndex={0}
                        sx={{
                          padding: "24px 21px",
                          fontFamily: "Rubik, sans serif",
                          borderRadius: "0 6px 0 0",
                          fontWeight: 400,
                          color: "#003366",
                          "&:focus": {
                            outline: "5px auto -webkit-focus-ring-color",
                            outlineOffset: "-2px",
                          },
                        }}
                        label="Stratifications"
                        data-testid="stratifications-tab"
                        onClick={() => {
                          setActiveTab("stratification");
                          if (!!formik.values.stratifications) {
                            while (formik.values.stratifications.length < 2) {
                              formik.values.stratifications.push(
                                getEmptyStrat()
                              );
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
                        value="stratification"
                      />
                    )}
                    <Tab
                      role="tabpanel"
                      tabIndex={0}
                      aria-label="Reporting tab panel"
                      sx={{
                        padding: "24px 21px",
                        fontFamily: "Rubik, sans serif",
                        borderRadius: "0 6px 0 0",
                        fontWeight: 400,
                        color: "#003366",
                        "&:focus": {
                          outline: "5px auto -webkit-focus-ring-color",
                          outlineOffset: "-2px",
                        },
                      }}
                      label="Reporting"
                      data-testid="reporting-tab"
                      onClick={() => setActiveTab("reporting")}
                      value="reporting"
                    />
                  </Tabs>
                </MenuItemContainer>
              </div>

              {activeTab === "populations" && (
                <FieldArray
                  name="populations"
                  render={(arrayHelpers) => (
                    <div tw="grid lg:grid-cols-4 gap-4 py-5 px-2">
                      {formik.values.populations?.map((population, index) => {
                        const fieldProps = {
                          name: `populations[${index}].definition`,
                        };
                        // if the population is exclusion of something then it should be in col 2
                        const isExclusionPop = population.name
                          .toLowerCase()
                          .includes("exclusion");
                        // if the population is 2nd IP then it should be in col 2. Assuming index = 0 is always IP and 2nd IP will be index = 1
                        const isSecondInitialPopulation =
                          index === 1 &&
                          population.name === "initialPopulation";
                        return (
                          <React.Fragment key={`population_${index}`}>
                            <ColSpanPopulations
                              isSecondInitialPopulation={
                                isSecondInitialPopulation
                              }
                              isExclusionPop={isExclusionPop}
                            >
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
                              <MeasureGroupObservation
                                canEdit={canEdit}
                                scoring={formik.values.scoring}
                                population={population}
                                elmJson={measure?.elmJson}
                                linkMeasureObservationDisplay={true}
                              />
                            </ColSpanPopulations>
                          </React.Fragment>
                        );
                      })}
                      <div tw="lg:col-start-1">
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
                      </div>
                    </div>
                  )}
                />
              )}

              {activeTab === "stratification" && (
                <FieldArray
                  name="stratifications"
                  render={(arrayHelpers) => (
                    <div>
                      {formik.values.stratifications &&
                        formik.values.stratifications.map(
                          (strat, i) =>
                            formik.values.stratifications[i].description !==
                              deleteToken && (
                              <div key={i} tw="mt-6">
                                <div tw="grid lg:grid-cols-4 gap-4">
                                  <div tw="lg:col-span-1">
                                    <div tw="relative">
                                      {formik.values.stratifications.length >
                                        2 &&
                                        visibleStrats > 2 && (
                                          <Link
                                            sx={{
                                              position: "absolute",
                                              left: "117px",
                                              zIndex: "1",
                                              textDecoration: "none",
                                            }}
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
                                        aria-describedby={`Stratification-select-${
                                          i + 1
                                        }-helper-text`}
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

                                    {/*Association Select*/}
                                    <div tw="pt-4">
                                      <Select
                                        readOnly={!canEdit}
                                        placeHolder={{ name: "-", value: "" }}
                                        label={`Association ${i + 1}`}
                                        id={`association-select-${i + 1}`}
                                        aria-describedby={`association-select-${
                                          i + 1
                                        }-helper-text`}
                                        inputProps={{
                                          "data-testid": `association-${
                                            i + 1
                                          }-input`,
                                        }}
                                        {...formik.getFieldProps(
                                          `stratifications[${i}].association`
                                        )}
                                        size="small"
                                        renderValue={(value) =>
                                          _.startCase(value)
                                        }
                                        options={
                                          !!formik.values.scoring &&
                                          associationSelect[
                                            formik.values.scoring
                                          ].map((opt, i) => (
                                            <MuiMenuItem
                                              key={`${opt}-${i}`}
                                              value={`${opt}`}
                                            >
                                              {_.startCase(opt)}
                                            </MuiMenuItem>
                                          ))
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div tw="lg:col-span-2">
                                    <FieldLabel
                                      htmlFor={`stratification-${i}-description`}
                                    >
                                      Stratification {i + 1} Description
                                    </FieldLabel>
                                    <FieldSeparator>
                                      {canEdit && (
                                        <textarea
                                          style={{
                                            height: "100%",
                                            width: "100%",
                                          }}
                                          value={
                                            formik.values.stratifications[i]
                                              .description
                                          }
                                          readOnly={!canEdit}
                                          name={`stratifications[${i}].description`}
                                          id={`stratification-${i}-description`}
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
                                  </div>
                                </div>
                              </div>
                            )
                        )}
                      {canEdit && (
                        <div tw="pt-4">
                          <Link
                            sx={{
                              color: "#0073C8",
                              padding: "14px 0 14px 0",
                            }}
                            data-testid="add-strat-button"
                            component="button"
                            variant="body2"
                            underline="hover"
                            onClick={(e) => {
                              e.preventDefault();
                              setVisibleStrats(visibleStrats + 1);
                              arrayHelpers.push(getEmptyStrat());
                            }}
                          >
                            + Add Stratification
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                />
              )}

              {activeTab === "reporting" && (
                <div tw="grid grid-cols-4 mt-6">
                  <div tw="lg:col-span-3">
                    <FieldLabel
                      htmlFor="rate-aggregation"
                      id="rate-aggregation-label"
                    >
                      Rate Aggregation
                    </FieldLabel>
                    <FieldSeparator>
                      {canEdit && (
                        <FieldInput
                          value={formik.values.rateAggregation}
                          aria-labelledby="rate-aggregation-label"
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
                  </div>
                  <div tw="pt-6 pb-6 col-start-1 col-end-2">
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
                        options={Object.values(improvementNotationOptions).map(
                          (opt) => (
                            <MuiMenuItem key={opt.label} value={opt.value}>
                              {opt.label}
                            </MuiMenuItem>
                          )
                        )}
                      />
                    )}
                    {!canEdit && formik.values.improvementNotation}
                  </div>
                </div>
              )}
            </div>

            {canEdit && (
              <div tw="grid lg:grid-cols-4 gap-4 items-center py-4">
                <Button
                  style={{ height: "100%", width: "30%" }}
                  variant="danger-primary"
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
                <ButtonSpacer>
                  <span
                    tw="text-sm text-gray-600"
                    data-testid="save-measure-group-validation-message"
                    aria-live="polite" //this triggers every time the user is there.. this intended?
                  >
                    {measureGroupSchemaValidator(
                      cqlDefinitionDataTypes
                    ).isValidSync(formik.values)
                      ? ""
                      : "You must set all required Populations."}
                  </span>
                </ButtonSpacer>
                <div tw="lg:col-start-4 flex justify-around">
                  <Button
                    style={{ height: "80%", width: "50%" }}
                    className="cancel-button"
                    disabled={!formik.dirty}
                    data-testid="group-form-discard-btn"
                    onClick={() => setDiscardDialogOpen(true)}
                  >
                    Discard Changes
                  </Button>
                  <Button
                    style={{ height: "80%", width: "30%", marginTop: "0px" }}
                    className="cyan"
                    type="submit"
                    data-testid="group-form-submit-btn"
                    disabled={
                      !(formik.isValid && (formik.dirty || associationChanged))
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>

      {/*Utility components*/}
      <MadieDiscardDialog
        open={discardDialogOpen}
        onClose={() => setDiscardDialogOpen(false)}
        onContinue={discardChanges}
      />
    </FormikProvider>
  );
};

export default MeasureGroups;
