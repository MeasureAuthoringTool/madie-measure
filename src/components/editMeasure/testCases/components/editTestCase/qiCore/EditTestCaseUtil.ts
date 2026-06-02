import { Dispatch, SetStateAction } from "react";
import { HapiOperationOutcome } from "@madie/madie-models";
import _ from "lodash";
import {
  EXECUTE_INVALID_TEST_CASES_WARNING,
  EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID,
} from "../../testCaseConfiguration/executionOptions/ExecutionOptions";
import { CustomWarningMessage } from "../../statusHandler/StatusHandler";

const UNRESOLVED_PATIENT_REFERENCE_MESSAGE =
  /Resource \[Patient\/.+?] contains a reference that does not resolve within the bundle/i;
const UNRESOLVED_PATIENT_REFERENCE_RESOURCE_ID_REGEX =
  /Resource \[(Patient\/.+?)]/i;

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

export function extractUnresolvedPatientReferenceResourceIds(
  validationErrors: any[]
): string[] {
  if (!Array.isArray(validationErrors) || validationErrors.length === 0) {
    return [];
  }

  return [
    ...new Set(
      validationErrors
        .map((validationError) => validationError?.diagnostics)
        .filter(
          (diagnostics) =>
            typeof diagnostics === "string" &&
            UNRESOLVED_PATIENT_REFERENCE_MESSAGE.test(diagnostics)
        )
        .map(
          (diagnostics) =>
            diagnostics.match(
              UNRESOLVED_PATIENT_REFERENCE_RESOURCE_ID_REGEX
            )?.[1]
        )
        .filter((resourceId) => typeof resourceId === "string")
    ),
  ];
}

export function createUnresolvedPatientReferenceWarningDetails(
  validationErrors: any[],
  warningDetailMessageBuilder: (resourceId: string) => string
): string[] {
  const invalidResourceIds =
    extractUnresolvedPatientReferenceResourceIds(validationErrors);

  if (invalidResourceIds.length === 0) {
    return [];
  }

  return [...new Set(invalidResourceIds.map(warningDetailMessageBuilder))];
}

export function upsertExecuteInvalidTestCaseWarning(
  setCustomWarningMessages: Dispatch<SetStateAction<CustomWarningMessage[]>>,
  warningDetails: string[]
) {
  setCustomWarningMessages((previousMessages = []) => {
    const filteredMessages = previousMessages.filter(
      (message) =>
        message?.testDataId !== EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID
    );

    if (!warningDetails?.length) {
      return filteredMessages;
    }

    return [
      {
        message: EXECUTE_INVALID_TEST_CASES_WARNING,
        details: [...new Set(warningDetails)],
        testDataId: EXECUTE_INVALID_TEST_WARNING_TEST_DATA_ID,
      },
      ...filteredMessages,
    ];
  });
}
