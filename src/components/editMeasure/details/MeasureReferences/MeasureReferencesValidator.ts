import * as Yup from "yup";

export const MeasureReferencesValidator = Yup.object().shape({
  referenceType: Yup.string().required("Measure Reference Type is required."),
  referenceText: Yup.string().required("Measure Reference is required."),
});
