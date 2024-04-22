import { MeasureScoring } from "@madie/madie-models";
import * as Yup from "yup";
import { MeasureNameSchema } from "./MeasureSchemaValidator";

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
  patientBasis: Yup.boolean().required("Patient Basis is required"),
});

export const QdmMeasureSchemaValidator = Yup.object().shape({
  measureName: MeasureNameSchema,
  cqlLibraryName: Yup.string()
    .required("Measure library name is required.")
    .matches(
      /^[A-Z][a-zA-Z0-9_]*$/,
      "Measure library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters except of underscore."
    )
    .max(64, "Library name cannot be more than 64 characters."),
  ecqmTitle: Yup.string()
    .required("eCQM Abbreviated Title is required")
    .max(32, "eCQM Abbreviated Title cannot be more than 32 characters"),
});
