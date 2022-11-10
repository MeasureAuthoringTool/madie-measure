import * as Yup from "yup";

export const MeasureSchemaValidator = Yup.object().shape({
  measureName: Yup.string()
    .max(500, "A Measure name cannot be more than 500 characters.")
    .required("A Measure name is required.")
    .matches(/[a-zA-Z]/, "A Measure name must contain at least one letter.")
    .matches(/^((?!_).)*$/, "Measure Name must not contain '_' (underscores)."),
  cqlLibraryName: Yup.string()
    .required("Measure library name is required.")
    .matches(
      /^((?!_).)*$/,
      "Measure library name must not contain '_' (underscores)."
    )
    .matches(
      /^[A-Z][a-zA-Z0-9]*$/,
      "Measure library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
    ),
  ecqmTitle: Yup.string()
    .required("eCQM Abbreviated Title is required")
    .max(32, "eCQM Abbreviated Title cannot be more than 32 characters"),
});
