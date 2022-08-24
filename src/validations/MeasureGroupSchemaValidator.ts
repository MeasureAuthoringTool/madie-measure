import * as Yup from "yup";
import { AggregateFunctionType, GroupScoring } from "@madie/madie-models";
import _ from "lodash";

export type CqlDefineDataTypes = {
  [key: string]: string;
};

const returnTypeCheckOptions = (
  populationBasis: string,
  definitionDataTypes: CqlDefineDataTypes
) => {
  return {
    name: "equalsTo",
    message: `The selected definition does not align with the Population Basis field selection of ${populationBasis}`,
    test: (value) => {
      if (
        value &&
        definitionDataTypes &&
        definitionDataTypes[_.camelCase(value)]
      ) {
        return (
          definitionDataTypes[_.camelCase(value)].toLowerCase() ===
          _.camelCase(populationBasis)?.toLowerCase()
        );
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
        if (requiredPopulations.includes(populationName)) {
          return Yup.string()
            .required(`${populationName} is required`)
            .test(returnTypeCheckOptions(populationBasis, definitionDataTypes));
        } else {
          return Yup.string().test(
            returnTypeCheckOptions(populationBasis, definitionDataTypes)
          );
        }
      }),
    })
  );
};

export const measureGroupSchemaValidator = (
  definitionDataTypes: CqlDefineDataTypes
) => {
  return Yup.object().shape({
    scoring: Yup.string()
      .oneOf(Object.values(GroupScoring))
      .required("Group Scoring is required."),
    measureGroupTypes: Yup.array().min(
      1,
      "At least one measure group type is required."
    ),
    populationBasis: Yup.string().required("Population Basis is required."),
    populations: Yup.object().when(
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
    measureObservations: Yup.object().when("scoring", (scoring) => {
      switch (scoring) {
        case GroupScoring.CONTINUOUS_VARIABLE:
          return Yup.array()
            .of(
              Yup.object().shape({
                definition: Yup.string().required(
                  "Measure Observation definition is required when an observation is added"
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
                definition: Yup.string().required(
                  "Measure Observation definition is required when an observation is added"
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
    }),
  });
};
