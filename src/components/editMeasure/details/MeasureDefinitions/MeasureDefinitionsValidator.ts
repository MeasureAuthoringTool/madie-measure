import * as Yup from "yup";

export const MeasureDefininitionsValidator = Yup.object().shape({
  term: Yup.string().required("Measure Definition Term is required."),
  definition: Yup.string().required("Measure Definition is required."),
});
