import { MeasureScoring } from "@madie/madie-models";
import * as Yup from "yup";

const QDMMeasureScoringSchema = Yup.mixed<MeasureScoring>()
  .oneOf(Object.values(MeasureScoring))
  .required("Valid Scoring is required for QDM Measure.");

const QDMBaseConfigurationTypesSchema = Yup.array().min(
  1,
  "At least one type is required"
);

export const QDMMeasureSchemaValidator = Yup.object().shape({
  scoring: QDMMeasureScoringSchema,
  baseConfigurationTypes: QDMBaseConfigurationTypesSchema,
});
