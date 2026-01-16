import * as Yup from "yup";
import {
  AggregateFunctionType,
  Group,
  GroupScoring,
} from "@madie/madie-models";
import _ from "lodash";

export type CqlDefineDataTypes = {
  [key: string]: string;
};
export type CqlFunctionDataTypes = {
  [key: string]: string;
};

// Create an extended context to allow nested values validate against base values
interface TestContextExtended {
  from: {
    value: Group;
  }[];
}

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
          populationBasis?.toLowerCase()
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

const returnTypeFunctionCheckOptions = (populationBasis, functionDataTypes) => {
  if (populationBasis?.toLowerCase() === "boolean") {
    return {
      name: "equalsToBooleam",
      message: `Selected function can not have parameters`,
      test: (value) => {
        if (
          value &&
          functionDataTypes &&
          functionDataTypes[_.camelCase(value)]
        ) {
          return (
            functionDataTypes[_.camelCase(value)].toLowerCase() ===
            populationBasis?.toLowerCase()
          );
        }
        return true;
      },
    };
  } else {
    return {
      name: "equalsToNonBoolean",
      message: `Selected function must have exactly one parameter of type ${populationBasis}`,
      test: (value) => {
        if (
          value &&
          functionDataTypes &&
          functionDataTypes[_.camelCase(value)]
        ) {
          return (
            functionDataTypes[_.camelCase(value)].toLowerCase() ===
            populationBasis?.toLowerCase()
          );
        }
        return true;
      },
    };
  }
};
export const measureGroupSchemaValidator = (
  definitionDataTypes: CqlDefineDataTypes,
  functionDataTypes: CqlFunctionDataTypes,
  isCompositeMeasure: boolean = false
) => {
  return Yup.object().shape({
    scoring: isCompositeMeasure
      ? Yup.string()
          .oneOf(Object.values(GroupScoring))
          .default(GroupScoring.COMPOSITE)
      : Yup.string()
          .oneOf(Object.values(GroupScoring))
          .required("Group Scoring is required."),
    compositeScoring: Yup.string()
      .nullable()
      .test(
        "composite-scoring-required",
        "Composite Scoring is required.",
        function (value) {
          const { scoring } = this.parent;
          if (scoring === GroupScoring.COMPOSITE) {
            return value !== null && value !== "";
          }
          return true;
        }
      ),
    scoringPrecision: Yup.number()
      .positive("Scoring Precision must be a positive integer")
      .nullable(),
    improvementNotation: Yup.string().when("scoring", (scoring, schema) => {
      if (
        scoring !== GroupScoring.COHORT &&
        scoring !== GroupScoring.COMPOSITE
      ) {
        return schema.required("Improvement Notation is required.");
      }
      return schema;
    }),
    measureGroupTypes: Yup.array().min(
      1,
      "At least one measure group type is required."
    ),
    populationBasis: Yup.string()
      .nullable()
      .required("Population Basis is required."),
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
      return Yup.array()
        .of(
          Yup.object().shape({
            cqlDefinition: Yup.string()
              .test(
                returnTypeCheckOptions(populationBasis, definitionDataTypes)
              )
              .test({
                name: "cqlDefinitionCheck",
                message: "CQL Definition is required.",
                test: function () {
                  const {
                    cqlDefinition,
                    description,
                    associations,
                    association,
                  } = this.parent;
                  if (
                    (description && description.trim() !== "") ||
                    (associations && !_.isEmpty(associations)) ||
                    (association && association.trim() !== "")
                  ) {
                    return cqlDefinition && cqlDefinition.length > 0;
                  }
                  return true;
                },
              }),
            // we need to make sure Associations have at least 1 value when Definition exists
            associations: Yup.array()
              .test({
                name: "associationCheck",
                message:
                  "Associations are required when CQL Definition is provided.",
                test: function (associations) {
                  const { cqlDefinition } = this.parent;
                  if (cqlDefinition && cqlDefinition.trim() !== "") {
                    return associations && associations.length > 0;
                  }
                  return true;
                },
              })
              .test({
                name: "ratioCheck",
                message:
                  "Ratio measures with two IPs must have one population for associations",
                test: function (associations) {
                  const { from } = this as Yup.TestContext &
                    TestContextExtended;
                  if (from[1].value.scoring === GroupScoring.RATIO) {
                    const ipCount = from[1].value.populations.filter(
                      (p) => p.name === "initialPopulation"
                    ).length;
                    if (ipCount > 1) {
                      return associations.length < 2;
                    }
                    return true;
                  }
                  return true;
                },
              }),
          })
        )
        .nullable();
    }),
  });
};
