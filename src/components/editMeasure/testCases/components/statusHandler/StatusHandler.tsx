import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

import "./StatusHandler.scss";
import { TestCaseImportOutcome } from "@madie/madie-models";
import "twin.macro";
import "styled-components/macro";
import { EXPORT_ERROR_CHARACTERS_MESSAGE } from "../../util/checkSpecialCharacters";
import {
  createImportMessage,
  createMissingDataElementMessage,
  createShiftTestCaseDatesWarningMessage,
  createUpdateQiCoreJsonWithGroupAndTitleWarningMessage,
  createWarningMessage,
} from "./StatusHandlerMessage";

export interface CustomWarningMessage {
  message: string;
  details?: string[];
  testDataId?: string;
}

interface StatusHandlerProps {
  error?: boolean;
  warning?: boolean;
  errorMessages?: Array<string>;
  warningMessages?: Array<string>;
  customWarningMessages?: CustomWarningMessage[];
  testDataId?: string;
  importWarnings?: TestCaseImportOutcome[];
  shiftTestCaseDatesWarning?: Array<string>;
  updateQiCoreJsonWithGroupAndTitleWarning?: Array<string>;
  missingDataElements?: Array<string>;
}

const StatusHandler = ({
  error,
  warning,
  errorMessages,
  warningMessages,
  testDataId,
  importWarnings,
  shiftTestCaseDatesWarning,
  updateQiCoreJsonWithGroupAndTitleWarning,
  missingDataElements,
  customWarningMessages,
}: StatusHandlerProps) => {
  const alerts = [];

  if (error && errorMessages) {
    const withoutDuplicates = [...new Set(errorMessages)];
    const exportErrors = withoutDuplicates.filter((e) =>
      e.includes(EXPORT_ERROR_CHARACTERS_MESSAGE)
    );
    const nonExportErrors = withoutDuplicates.filter(
      (e) => !e.includes(EXPORT_ERROR_CHARACTERS_MESSAGE)
    );

    let exportErrorContent = null;
    if (exportErrors?.length) {
      exportErrorContent = (
        <>
          <h3 data-testid="error-special-char-title">
            {EXPORT_ERROR_CHARACTERS_MESSAGE}
          </h3>
          <ul data-testid="error-special-char">
            {exportErrors.map((e, index) => (
              <li key={index}>
                {e.replace(EXPORT_ERROR_CHARACTERS_MESSAGE, "")}
              </li>
            ))}
          </ul>
        </>
      );
    }

    if (nonExportErrors.length + exportErrors.length === 1) {
      alerts.push({
        type: "error",
        copyButton: true,
        content: (
          <div aria-live="polite" role="alert" data-testid={testDataId}>
            {exportErrorContent}
            <h3>{nonExportErrors}</h3>
          </div>
        ),
        canClose: false,
        alertProps: { "data-testid": "generic-error-text-header" },
      });
    } else if (nonExportErrors.length + exportErrors.length > 1) {
      const mappedMessages = nonExportErrors.map(
        (em: string, index: number) => <li key={index}>{em}</li>
      );
      alerts.push({
        type: "error",
        copyButton: true,
        content: (
          <div aria-live="polite" role="alert" data-testid={testDataId}>
            <h3>
              {nonExportErrors.length + exportErrors.length} errors were found
            </h3>
            {exportErrorContent}
            <ul data-testid="generic-fail-text-list">{mappedMessages}</ul>
          </div>
        ),
        canClose: false,
      });
    }
  }

  // TODO: Replace scenario specific warning path with generic customWarningMessages
  if (warning && shiftTestCaseDatesWarning.length > 0) {
    const withoutDuplicates = [...new Set(shiftTestCaseDatesWarning)];
    if (withoutDuplicates.length > 0) {
      alerts.push(
        createShiftTestCaseDatesWarningMessage(withoutDuplicates, testDataId)
      );
    }
  } else if (warning && warningMessages.length > 0) {
    const withoutDuplicates = [...new Set(warningMessages)];
    if (withoutDuplicates.length > 0) {
      alerts.push(createWarningMessage(withoutDuplicates, testDataId));
    }
  } else if (warning && updateQiCoreJsonWithGroupAndTitleWarning.length > 0) {
    const withoutDuplicates = [
      ...new Set(updateQiCoreJsonWithGroupAndTitleWarning),
    ];
    if (withoutDuplicates.length > 0) {
      alerts.push(
        createUpdateQiCoreJsonWithGroupAndTitleWarningMessage(
          withoutDuplicates,
          testDataId
        )
      );
    }
  }

  if (warning && customWarningMessages) {
    customWarningMessages.forEach((cwm) => {
      alerts.push(
        createWarningMessage([...new Set(cwm.details)], testDataId, cwm.message)
      );
    });
  }

  if (importWarnings && importWarnings.length > 0) {
    const failedImports = importWarnings.filter((warnings) => {
      if (!warnings.successful) return warnings;
    });
    const successfulImports = importWarnings.length - failedImports.length;

    const successfulImportsWithWarnings = importWarnings.filter((warnings) => {
      if (warnings.successful && warnings.message) return warnings;
    });

    alerts.push(
      createImportMessage(
        failedImports,
        successfulImports,
        successfulImportsWithWarnings,
        testDataId
      )
    );
  }

  if (warning && missingDataElements?.length) {
    alerts.push(
      createMissingDataElementMessage(missingDataElements, testDataId)
    );
  }

  // If there are no alerts, return an empty div
  if (alerts.length === 0) {
    return <div />;
  }

  return (
    <div id="status-handler">
      <MadieAlert alerts={alerts} />
    </div>
  );
};

export default StatusHandler;
