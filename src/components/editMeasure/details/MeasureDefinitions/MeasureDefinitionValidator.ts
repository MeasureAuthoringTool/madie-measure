import * as Yup from "yup";
import { notEmptyHtml } from "../../../../validations/ReadOnlyValidator";

export const MeasureDefinitionValidator = Yup.object().shape({
  term: Yup.string().required("Term is required."),
  definition: notEmptyHtml("Definition is required."),
});
