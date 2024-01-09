import * as Yup from "yup";

export const MeasureReferencesValidator = Yup.object().shape({
  referenceType: Yup.string().required("Measure Reference Type is required."),
  referenceText: Yup.string()
    .required("Measure References is required.")
    .max(250, "Measure References cannot be more than 250 characters."),
});
