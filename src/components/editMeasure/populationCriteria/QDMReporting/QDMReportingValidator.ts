import * as Yup from "yup";

export const QDMReportingValidator = Yup.object().shape({
  improvementNotation: Yup.string(),
  improvementNotationOther: Yup.string().when("improvementNotation", {
    is: "Other",
    then: Yup.string().required(
      "Custom Field is required when Other is selected"
    ),
    otherwise: Yup.string(),
  }),
});
