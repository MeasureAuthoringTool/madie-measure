import * as Yup from "yup";

export const QDMReportingValidator = Yup.object().shape({
  improvementNotationDescription: Yup.string()
    .trim()
    .when("improvementNotation", {
      is: "Other",
      then: (schema) =>
        schema
          .required(
            "Improvement Notation Description is required when Other is selected"
          )
          .notOneOf(
            ["<p></p>"],
            "Improvement Notation Description is required when Other is selected"
          ),
      otherwise: (schema) => schema,
    }),
});
