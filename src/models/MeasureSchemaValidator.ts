import * as Yup from "yup";

export const MeasureSchemaValidator = Yup.object().shape({
  measureName: Yup.string()
    .max(500, "A measure name cannot be more than 500 characters.")
    .required("A measure name is required.")
    .matches(/[a-zA-Z]/, "A measure name must contain at least one letter.")
    .matches(/^((?!_).)*$/, "Measure Name must not contain '_' (underscores)."),
  cqlLibraryName: Yup.string()
    .required("Measure library name is required.")
    .matches(
      /^((?!_).)*$/,
      "Measure library name must not contain '_' (underscores)."
    )
    .matches(
      /^[A-Z][a-zA-Z0-9]*$/,
      "Measure library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces."
    ),
});
