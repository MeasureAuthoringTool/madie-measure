import * as Yup from "yup";

export const MeasureDefininitionsValidator = Yup.object().shape({
  term: Yup.string()
    .required("Measure Definition term is required.")
    .max(250, "Measure Definition term cannot be more than 250 characters."),
  definition: Yup.string()
    .required()
    .max(250, "Measure Definition cannot be more than 250 characters."),
});
