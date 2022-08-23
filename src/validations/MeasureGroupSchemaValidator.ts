import * as Yup from "yup";
import { AggregateFunctionType, GroupScoring } from "@madie/madie-models";
import _ from "lodash";

export type CqlDefineDataTypes = {
  [key: string]: string;
};

export const MeasureGroupSchemaValidator = (
  definitionDataTypes: CqlDefineDataTypes
) => {
  const returnTypeCheckOptions = (populationBasis) => {
    return {
      name: "equalsTo",
      message: `Definition does not align with ${populationBasis}`,
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
            return Yup.array().of(
              Yup.object().shape({
                definition: Yup.string().when(["name"], {
                  is: (name) => {
                    return name === "initialPopulation";
                  },
                  then: Yup.string()
                    .required("Initial Population is required")
                    .test(returnTypeCheckOptions(populationBasis)),
                }),
              })
            );
          case GroupScoring.CONTINUOUS_VARIABLE:
            return Yup.array().of(
              Yup.object().shape({
                definition: Yup.string().when(["name"], (populationName) => {
                  if (
                    ["initialPopulation", "measurePopulation"].includes(
                      populationName
                    )
                  ) {
                    return Yup.string()
                      .required(`${populationName} is required`)
                      .test(returnTypeCheckOptions(populationBasis));
                  } else {
                    return Yup.string().test(
                      returnTypeCheckOptions(populationBasis)
                    );
                  }
                }),
              })
            );
          case GroupScoring.PROPORTION:
            return Yup.array().of(
              Yup.object().shape({
                definition: Yup.string().when(["name"], (populationName) => {
                  if (
                    ["initialPopulation", "numerator", "denominator"].includes(
                      populationName
                    )
                  ) {
                    return Yup.string()
                      .required(`${populationName} is required`)
                      .test(returnTypeCheckOptions(populationBasis));
                  } else {
                    return Yup.string().test(
                      returnTypeCheckOptions(populationBasis)
                    );
                  }
                }),
              })
            );
          case GroupScoring.RATIO:
            return Yup.array().of(
              Yup.object().shape({
                definition: Yup.string().when(["name"], (populationName) => {
                  if (
                    ["initialPopulation", "numerator", "denominator"].includes(
                      populationName
                    )
                  ) {
                    return Yup.string()
                      .required(`${populationName} is required`)
                      .test(returnTypeCheckOptions(populationBasis));
                  } else {
                    return Yup.string().test(
                      returnTypeCheckOptions(populationBasis)
                    );
                  }
                }),
              })
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
