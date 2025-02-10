import * as Yup from "yup";

export const MeasureDefinitionValidator = Yup.object().shape({
  term: Yup.string().required("Term is required."),
  definition: Yup.string().required("Definition is required."),
});
