import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

import "./StatusHandler.scss";
import { TestCaseImportOutcome } from "@madie/madie-models";
import "twin.macro";
import "styled-components/macro";

export function createWarningMessage(
  withoutDuplicates: string[],
  testDataId: string
) {
  return (
    <div id="status-handler">
      <MadieAlert
        data-testid={testDataId}
        type="warning"
        content={
          <div aria-live="polite" role="alert" data-testid={testDataId}>
            <div data-testid="warn-title">
              The following Test Case dates could not be shifted. Please try
              again. If the issue continues, please contact helpdesk.
              <ul>
                {withoutDuplicates.map((tc) => (
                  <li>{tc}</li>
                ))}
              </ul>
            </div>
          </div>
        }
        canClose={false}
        copyButton={true}
      />
    </div>
  );
}
export function createImportMessage(
  failedImports: TestCaseImportOutcome[],
  successfulImports: number,
  successfulImportsWithWarnings: TestCaseImportOutcome[],
  testDataId: string
) {
  return (
    <div id="status-handler">
      <MadieAlert
        type="warning"
        content={
          <div aria-live="polite" role="alert" data-testid={testDataId}>
            {failedImports.length > 0 && (
              <div>
                <div tw="font-medium">
                  ({successfulImports}) test case(s) were imported. The
                  following ({failedImports.length}) test case(s) could not be
                  imported. Please ensure that your formatting is correct and
                  try again.
                </div>
                <ul>
                  {failedImports.map((failedImport) => {
                    const family = failedImport?.familyName;
                    const given = failedImport?.givenNames?.toString();
                    const names =
                      family && given
                        ? `${family} ${given}`
                        : failedImport?.patientId;
                    return (
                      <li data-testid="failed-test-cases">
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
                    (successfulImportsWithWarning) => {
                      const family = successfulImportsWithWarning?.familyName;
                      const given =
                        successfulImportsWithWarning?.givenNames?.toString();
                      const names =
                        family && given
                          ? `${family} ${given}`
                          : successfulImportsWithWarning?.patientId;
                      return (
                        <li data-testid="success-imports-with-warnings">
                          {names}{" "}
                        </li>
                      );
                    }
                  )}
                </ul>
              </div>
            )}
          </div>
        }
        canClose={false}
        copyButton="true"
      />
    </div>
  );
}
