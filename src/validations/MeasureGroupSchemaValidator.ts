import * as Yup from "yup";
import { GroupScoring } from "@madie/madie-models";

export const MeasureGroupSchemaValidator = Yup.object().shape({
  scoring: Yup.string()
    .oneOf(Object.values(GroupScoring))
    .required("Group Scoring is required."),
  measureGroupTypes: Yup.array().min(
    1,
    "At least one measure group type is required."
  ),
  populationBasis: Yup.string().required("Population Basis is required."),
  populations: Yup.object().when("scoring", (scoring) => {
    switch (scoring) {
      case GroupScoring.COHORT:
        return Yup.array().of(
          Yup.object().shape({
            definition: Yup.string().when(["name"], {
              is: (name) => {
                return name === "initialPopulation";
              },
              then: Yup.string().required("Initial Population is required"),
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
                return Yup.string().required(`${populationName} is required`);
              } else {
                return Yup.string();
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
                return Yup.string().required(`${populationName} is required`);
              } else {
                return Yup.string();
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
                return Yup.string().required(`${populationName} is required`);
              } else {
                return Yup.string();
              }
            }),
          })
        );
    }
  }),
});
