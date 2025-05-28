import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

import "./StatusHandler.scss";
import { TestCaseImportOutcome } from "@madie/madie-models";
import "twin.macro";
import "styled-components/macro";
import { EXPORT_ERROR_CHARACTERS_MESSAGE } from "../../util/checkSpecialCharacters";
import {
  createImportAlerts,
  createWarningAlerts,
} from "./StatusHandlerMessage";
import { useFeatureFlags } from "@madie/madie-util";

interface StatusHandlerProps {
  error?: boolean;
  warning?: boolean;
  errorMessages?: Array<string>;
  warningMessages?: Array<string>;
  testDataId?: string;
  importWarnings?: TestCaseImportOutcome[];
}

const StatusHandler = ({
  error,
  warning,
  errorMessages,
  warningMessages,
  testDataId,
  importWarnings,
}: StatusHandlerProps) => {
  const featureFlags = useFeatureFlags();
  const allAlerts = [];

  if (error && errorMessages) {
    // We need to separate export errors from regular errors since they need to be grouped together under a single heading
    const withoutDuplicates = [...new Set(errorMessages)];
    const exportErrors = withoutDuplicates.filter((e) =>
      e.includes(EXPORT_ERROR_CHARACTERS_MESSAGE)
    );
    const nonExportErrors = withoutDuplicates.filter(
      (e) => !e.includes(EXPORT_ERROR_CHARACTERS_MESSAGE)
    );

    let exportErrorContent = <div></div>;
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
      allAlerts.push({
        type: "error",
        content: (
          <div aria-live="polite" role="alert" data-testid={testDataId}>
            {exportErrorContent}
            <h3>{nonExportErrors}</h3>
          </div>
        ),
        canClose: false,
        copyButton: true,
      });
    } else if (nonExportErrors.length + exportErrors.length > 1) {
      const mappedMessages = nonExportErrors.map(
        (em: string, index: number) => <li key={index}>{em}</li>
      );
      allAlerts.push({
        type: "error",
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
        copyButton: true,
      });
    }
  }

  if (warning && warningMessages) {
    const withoutDuplicates = [...new Set(warningMessages)];
    if (withoutDuplicates.length > 0) {
      const warningAlerts = createWarningAlerts(withoutDuplicates, testDataId);
      allAlerts.push(...warningAlerts);
    }
  }

  if (importWarnings && importWarnings.length > 0) {
    const failedImports = importWarnings.filter((warnings) => {
      if (!warnings.successful) return warnings;
    });
    const successfulImports = importWarnings.length - failedImports.length;

    const successfulImportsWithWarnings = importWarnings.filter((warnings) => {
      if (warnings.successful && warnings.message) return warnings;
    });

    const importAlerts = createImportAlerts(
      failedImports,
      successfulImports,
      successfulImportsWithWarnings,
      testDataId
    );
    allAlerts.push(...importAlerts);
  }

  if (allAlerts.length === 0) {
    return <div />;
  }

  return (
    <div id="status-handler">
      <MadieAlert
        minimizeAlerts={featureFlags?.MinimizeAlerts}
        alerts={allAlerts}
      />
    </div>
  );
};

export default StatusHandler;
