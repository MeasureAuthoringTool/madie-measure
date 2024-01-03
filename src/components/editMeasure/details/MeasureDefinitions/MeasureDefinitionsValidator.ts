import * as Yup from "yup";

export const MeasureDefininitionsValidator = Yup.object().shape({
  term: Yup.string()
    .required("Measure Definition Term is required.")
    .max(250, "Measure Definition Term cannot be more than 250 characters."),
  definition: Yup.string()
    .required("Measure Definition is required.")
    .max(250, "Measure Definition cannot be more than 250 characters."),
});
