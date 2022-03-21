import * as Yup from "yup";
import { MeasureScoring } from "./MeasureScoring";

export const MeasureGroupSchemaValidator = Yup.object().shape({
  scoring: Yup.string()
    .oneOf(Object.values(MeasureScoring))
    .required("Group Scoring is required."),
});
