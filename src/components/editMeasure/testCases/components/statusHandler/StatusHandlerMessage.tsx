import React from "react";
import { TestCaseImportOutcome } from "@madie/madie-models";
import "twin.macro";
import "styled-components/macro";

// TODO: Remove and use createWarningMessage with custom message instead.
export function createShiftTestCaseDatesWarningMessage(
  withoutDuplicates: string[],
  testDataId: string
) {
  return {
    type: "warning",
    copyButton: true,
    content: (
      <div aria-live="polite" role="alert" data-testid={testDataId}>
        <div data-testid="warn-title">
          The following Test Case dates could not be shifted. Please try again.
          If the issue continues, please contact helpdesk.
          <ul>
            {withoutDuplicates.map((tc, index) => (
              <li key={index}>{tc}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
    canClose: false,
    alertProps: { "data-testid": testDataId },
  };
}

export function createWarningMessage(
  withoutDuplicates: string[],
  testDataId: string,
  message?: string
) {
  return {
    type: "warning",
    copyButton: true,
    content: (
      <div aria-live="polite" role="alert" data-testid={testDataId}>
        <div data-testid="warn-title">
          {message ? message + " " : ""}
          {withoutDuplicates.length === 1 ? (
            withoutDuplicates[0]
          ) : (
            <ul>
              {withoutDuplicates.map((tc, index) => (
                <li key={index}>{tc}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    ),
    canClose: false,
    alertProps: { "data-testid": testDataId },
  };
}

export function createMissingDataElementMessage(
  missingDataElements: string[],
  testDataId: string
) {
  return {
    type: "warning",
    copyButton: true,
    content: (
      <div aria-live="polite" role="alert" data-testid={testDataId}>
        <div>
          The following data elements in this test case are no longer relevant
          to the measure.
          <ul tw="ml-5">
            {missingDataElements.map((el, index) => (
              <li key={index}>{el}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
    canClose: false,
    alertProps: { "data-testid": testDataId },
  };
}

export function createImportMessage(
  failedImports: TestCaseImportOutcome[],
  successfulImports: number,
  successfulImportsWithWarnings: TestCaseImportOutcome[],
  testDataId: string
) {
  return {
    type: "warning",
    copyButton: true,
    content: (
      <div aria-live="polite" role="alert" data-testid={testDataId}>
        {failedImports.length > 0 && (
          <div>
            <div tw="font-medium">
              ({successfulImports}) test case(s) were imported. The following (
              {failedImports.length}) test case(s) could not be imported. Please
              ensure that your formatting is correct and try again.
            </div>
            <ul>
              {failedImports.map((failedImport, index) => {
                const family = failedImport?.familyName;
                const given = failedImport?.givenNames?.toString();
                const names =
                  family && given
                    ? `${family} ${given}`
                    : failedImport?.patientId;
                return (
                  <li key={index} data-testid="failed-test-cases">
                    {names} <br />
                    <span tw="ml-4">Reason: {failedImport.message}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {successfulImportsWithWarnings?.length > 0 && (
          <div>
            <div tw="font-medium">
              Following test case(s) were imported successfully, but{" "}
              {successfulImportsWithWarnings[0].message}
            </div>
            <ul>
              {successfulImportsWithWarnings.map(
                (successfulImportsWithWarning, index) => {
                  const family = successfulImportsWithWarning?.familyName;
                  const given =
                    successfulImportsWithWarning?.givenNames?.toString();
                  const names =
                    family && given
                      ? `${family} ${given}`
                      : successfulImportsWithWarning?.patientId;
                  return (
                    <li key={index} data-testid="success-imports-with-warnings">
                      {names}{" "}
                    </li>
                  );
                }
              )}
            </ul>
          </div>
        )}
      </div>
    ),
    canClose: false,
  };
}
