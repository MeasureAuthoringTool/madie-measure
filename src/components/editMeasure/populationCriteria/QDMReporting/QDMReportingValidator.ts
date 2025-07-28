import * as Yup from "yup";
import { notEmptyHtml } from "../../../../validations/ReadOnlyValidator";

export const QDMReportingValidator = Yup.object().shape({
  improvementNotationDescription: Yup.string().when("improvementNotation", {
    is: "Other",
    then: () =>
      notEmptyHtml(
        "Improvement Notation Description is required when Other is selected"
      ),
    otherwise: (schema) => schema,
  }),
});
