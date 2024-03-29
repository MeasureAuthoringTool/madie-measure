import * as Yup from "yup";

export const QDMReportingValidator = Yup.object().shape({
  improvementNotationDescription: Yup.string().when("improvementNotation", {
    is: "Other",
    then: Yup.string().required(
      "Improvement Notation Description required when Other is selected"
    ),
  }),
});
