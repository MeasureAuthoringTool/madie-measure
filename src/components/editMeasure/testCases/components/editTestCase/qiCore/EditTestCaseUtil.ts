import { HapiOperationOutcome } from "@madie/madie-models";
import _ from "lodash";

export function isHapiOutcomeIssueCodeInformational(
  outcome: HapiOperationOutcome
) {
  if (_.isNil(outcome?.outcomeResponse?.issue)) return true; // no issues, valid.
  return (
    outcome?.outcomeResponse?.issue?.filter(
      (issue) => /^information/.exec(issue.severity) === null
    ).length <= 0
  );
}

export function extractValidationErrorsFromOutcome(
  outcome: HapiOperationOutcome
) {
  if (
    _.isNil(outcome) ||
    (outcome.successful !== false &&
      (outcome.code === 200 || outcome.code === 201) &&
      isHapiOutcomeIssueCodeInformational(outcome))
  ) {
    return [];
  }
  if (
    outcome.outcomeResponse?.issue?.length > 0 &&
    !isHapiOutcomeIssueCodeInformational(outcome)
  ) {
    return outcome.outcomeResponse.issue.map((issue, index) => ({
      ...issue,
      key: index,
    }));
  } else {
    const error =
      outcome.outcomeResponse?.text ||
      outcome.message ||
      `HAPI FHIR returned error code ${outcome.code} but no discernible error message`;
    return [{ key: 0, diagnostics: error }];
  }
}
