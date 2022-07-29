import * as Yup from "yup";
import { MeasureScoring } from "@madie/madie-models";

export const MeasureGroupSchemaValidator = Yup.object().shape({
  scoring: Yup.string()
    .oneOf(Object.values(MeasureScoring))
    .required("Group Scoring is required."),
  measureGroupTypes: Yup.array().min(
    1,
    "At least one measure group type is required."
  ),
  populations: Yup.object().when("scoring", (scoring) => {
    switch (scoring) {
      case MeasureScoring.COHORT:
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
      case MeasureScoring.CONTINUOUS_VARIABLE:
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
      case MeasureScoring.PROPORTION:
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
      case MeasureScoring.RATIO:
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
