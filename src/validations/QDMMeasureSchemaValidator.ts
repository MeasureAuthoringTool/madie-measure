import { MeasureScoring } from "@madie/madie-models";
import * as Yup from "yup";

export const QDMMeasureScoringSchema = Yup.mixed<MeasureScoring>()
  .oneOf(Object.values(MeasureScoring))
  .required("Valid Scoring is required for QDM Measure.");

export const QDMMeasureSchemaValidator = Yup.object().shape({
  scoring: QDMMeasureScoringSchema,
});
