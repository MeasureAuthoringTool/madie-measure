import * as Yup from "yup";
import { notEmptyHtml } from "../../../../validations/ReadOnlyValidator";

export const MeasureReferencesValidator = Yup.object().shape({
  referenceType: Yup.string().required("Measure Reference Type is required."),
  referenceText: notEmptyHtml("Measure Reference is required."),
});
