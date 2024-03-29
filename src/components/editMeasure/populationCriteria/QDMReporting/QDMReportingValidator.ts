import * as Yup from "yup";

export const QDMReportingValidator = Yup.object().shape({
  improvementNotationDescription: Yup.string()
    .trim()
    .when("improvementNotation", {
      is: "Other",
      then: Yup.string().required(
        "Improvement Notation Description is required when Other is selected"
      ),
    }),
});
