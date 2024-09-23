import * as Yup from "yup";
import { AggregateFunctionType, GroupScoring } from "@madie/madie-models";
import _ from "lodash";
import * as ucum from "@lhncbc/ucum-lhc";

export type CqlDefineDataTypes = {
  [key: string]: string;
};
export type CqlFunctionDataTypes = {
  [key: string]: string;
};

const patientBasedReturnTypeCheckOptions = (
  definitionDataTypes: CqlDefineDataTypes
) => {
  return {
    name: "equalsTo",
    message: `For Patient-based Measures, selected definitions must return a Boolean.`,
    test: (value) => {
      if (
        value &&
        definitionDataTypes &&
        definitionDataTypes[_.camelCase(value)]
      ) {
        return (
          definitionDataTypes[_.camelCase(value)].toLowerCase() === "boolean"
        );
      }
      return true;
    },
  };
};

const episodeBasedReturnTypeCheckOptions = (
  definitionDataTypes: CqlDefineDataTypes
) => {
  return {
    name: "equalsTo",
    message: `For Episode-based Measures, selected definitions must return a list of the same type (Non-Boolean).`,
    test: (value) => {
      if (
        value &&
        definitionDataTypes &&
        definitionDataTypes[_.camelCase(value)]
      ) {
        if (
          definitionDataTypes[_.camelCase(value)].toLowerCase() === "boolean"
        ) {
          return false;
        }
      }
      return true;
    },
  };
};

const createPopulationSchema = (
  requiredPopulations: string[],
  populationBasis: string,
  definitionDataTypes: CqlDefineDataTypes
) => {
  return Yup.array().of(
    Yup.object().shape({
      definition: Yup.string().when(["name"], (populationName) => {
        if (populationBasis === "true") {
          if (requiredPopulations.includes(populationName)) {
            return Yup.string()
              .required(`${populationName} is required`)
              .test(patientBasedReturnTypeCheckOptions(definitionDataTypes));
          } else {
            return Yup.string().test(
              patientBasedReturnTypeCheckOptions(definitionDataTypes)
            );
          }
        } else {
          if (requiredPopulations.includes(populationName)) {
            return Yup.string()
              .required(`${populationName} is required`)
              .test(episodeBasedReturnTypeCheckOptions(definitionDataTypes));
          } else {
            return Yup.string().test(
              episodeBasedReturnTypeCheckOptions(definitionDataTypes)
            );
          }
        }
      }),
    })
  );
};

const returnTypeFunctionCheckOptions = (populationBasis, functionDataTypes) => {
  if (populationBasis === "true") {
    return {
      name: "equalsToBoolean",
      message: `Selected function can not have parameters`,
      test: (value) => {
        if (
          value &&
          functionDataTypes &&
          functionDataTypes[_.camelCase(value)]
        ) {
          return (
            functionDataTypes[_.camelCase(value)].toLowerCase() === "boolean"
          );
        }
        return true;
      },
    };
  } else {
    return {
      name: "equalsToNonBoolean",
      message: `Selected function must have a parameter`,
      test: (value) => {
        if (
          value &&
          functionDataTypes &&
          functionDataTypes[_.camelCase(value)]
        ) {
          return (
            functionDataTypes[_.camelCase(value)].toLowerCase() !== "boolean"
          );
        }
        return true;
      },
    };
  }
};

const validateStratificarionAssociations = () => {
  return {
    name: "cqlDefinitionCheck",
    message: "CQL Definition is required.",
    test: function () {
      const { cqlDefinition, description } = this.parent;
      if (description && description.trim() !== "") {
        return cqlDefinition && cqlDefinition.length > 0;
      }
      return true;
    },
  };
};

export const qdmMeasureGroupSchemaValidator = (
  definitionDataTypes: CqlDefineDataTypes,
  functionDataTypes: CqlFunctionDataTypes
) => {
  return Yup.object().shape({
    scoring: Yup.string()
      .oneOf(Object.values(GroupScoring))
      .required("Group Scoring is required."),

    populationBasis: Yup.string()
      .nullable()
      .required("Patient Basis is required."),

    scoringUnit: Yup.object().shape({
      value: Yup.object().test("test-compare a few values", function (value) {
        var parseResp = ucum.UcumLhcUtils.getInstance().validateUnitString(
          value?.code,
          true
        );

        if (!value?.code || (value?.code && parseResp.status === "valid")) {
          return true;
        } else {
          //create a message from
          if (parseResp?.suggestions) {
            let errorMsg: string = parseResp.suggestions[0]?.msg + ": ";

            parseResp.suggestions[0].units.forEach((value) => {
              errorMsg += value[0] + ", ";
            });
            return this.createError({
              message: errorMsg,
              path: "scoringUnit.value", // Fieldname
            });
          } else {
            return this.createError({
              message: parseResp.msg[0],
              path: "scoringUnit.value", // Fieldname
            });
          }
        }
      }),
    }),

    populations: Yup.array().when(
      ["scoring", "populationBasis"],
      (scoring, populationBasis) => {
        switch (scoring) {
          case GroupScoring.COHORT:
            return createPopulationSchema(
              ["initialPopulation"],
              populationBasis,
              definitionDataTypes
            );
          case GroupScoring.CONTINUOUS_VARIABLE:
            return createPopulationSchema(
              ["initialPopulation", "measurePopulation"],
              populationBasis,
              definitionDataTypes
            );
          case GroupScoring.PROPORTION:
            return createPopulationSchema(
              ["initialPopulation", "numerator", "denominator"],
              populationBasis,
              definitionDataTypes
            );
          case GroupScoring.RATIO:
            return createPopulationSchema(
              ["initialPopulation", "numerator", "denominator"],
              populationBasis,
              definitionDataTypes
            );
        }
      }
    ),
    measureObservations: Yup.object().when(
      ["scoring", "populationBasis"],
      (scoring, populationBasis) => {
        switch (scoring) {
          case GroupScoring.CONTINUOUS_VARIABLE:
            return Yup.array()
              .of(
                Yup.object().shape({
                  definition: Yup.string()
                    .required(
                      "Measure Observation definition is required when an observation is added"
                    )
                    .test(
                      returnTypeFunctionCheckOptions(
                        populationBasis,
                        functionDataTypes
                      )
                    ),
                  aggregateMethod: Yup.string()
                    .oneOf(Object.values(AggregateFunctionType))
                    .required(
                      "Aggregate Method is required for a measure observation"
                    ),
                })
              )
              .length(
                1,
                "Continuous Variable measure groups must have a single measure observation"
              );
          case GroupScoring.RATIO:
            return Yup.array()
              .of(
                Yup.object().shape({
                  definition: Yup.string()
                    .required(
                      "Measure Observation definition is required when an observation is added"
                    )
                    .test(
                      returnTypeFunctionCheckOptions(
                        populationBasis,
                        functionDataTypes
                      )
                    ),
                  aggregateMethod: Yup.string()
                    .oneOf(Object.values(AggregateFunctionType))
                    .required(
                      "Aggregate Method is required for a measure observation"
                    ),
                })
              )
              .nullable()
              .min(0)
              .max(
                2,
                "Maximum of two measure observations on Ratio measure group"
              );
          default:
            return Yup.array().nullable();
        }
      }
    ),
    stratifications: Yup.object().when("populationBasis", (populationBasis) => {
      if (populationBasis === "true") {
        return Yup.array()
          .of(
            Yup.object().shape({
              //temp
              cqlDefinition: Yup.string()
                .test(patientBasedReturnTypeCheckOptions(definitionDataTypes))
                .test(validateStratificarionAssociations()),
            })
          )
          .nullable();
      } else {
        return Yup.array()
          .of(
            Yup.object().shape({
              cqlDefinition: Yup.string()
                .test(episodeBasedReturnTypeCheckOptions(definitionDataTypes))
                .test(validateStratificarionAssociations()),
            })
          )
          .nullable();
      }
    }),
  });
};
