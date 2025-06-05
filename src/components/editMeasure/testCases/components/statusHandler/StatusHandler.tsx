import React, { useMemo } from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

import "./StatusHandler.scss";
import { TestCaseImportOutcome } from "@madie/madie-models";
import "twin.macro";
import "styled-components/macro";
import { EXPORT_ERROR_CHARACTERS_MESSAGE } from "../../util/checkSpecialCharacters";
import {
  createImportMessage,
  createWarningMessage,
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

interface StatusAlert {
  type: "error" | "warning" | "info" | "success";
  content: React.ReactNode;
  canClose?: boolean;
  copyButton?: boolean;
  alertProps?: Record<string, any>;
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

  const alerts = useMemo(() => {
    const alertsList: StatusAlert[] = [];

    if (error && errorMessages?.length) {
      const withoutDuplicates = [...new Set(errorMessages)];
      const exportErrors = withoutDuplicates.filter((e) =>
        e.includes(EXPORT_ERROR_CHARACTERS_MESSAGE)
      );
      const nonExportErrors = withoutDuplicates.filter(
        (e) => !e.includes(EXPORT_ERROR_CHARACTERS_MESSAGE)
      );
      const totalErrors = nonExportErrors.length + exportErrors.length;

      const exportErrorContent =
        exportErrors.length > 0 ? (
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
        ) : null;
      if (totalErrors === 1) {
        alertsList.push({
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
      } else if (totalErrors > 1) {
        alertsList.push({
          type: "error",
          copyButton: true,
          content: (
            <div aria-live="polite" role="alert" data-testid={testDataId}>
              <h3>{totalErrors} errors were found</h3>
              {exportErrorContent}
              <ul data-testid="generic-fail-text-list">
                {nonExportErrors.map((em, index) => (
                  <li key={index}>{em}</li>
                ))}
              </ul>
            </div>
          ),
          canClose: false,
        });
      }
    }

    if (warning && warningMessages?.length) {
      const uniqueWarnings = [...new Set(warningMessages)];
      if (uniqueWarnings.length > 0) {
        alertsList.push(createWarningMessage(uniqueWarnings, testDataId));
      }
    }

    if (importWarnings?.length) {
      const failedImports = importWarnings.filter((w) => !w.successful);
      const successfulImports = importWarnings.length - failedImports.length;
      const successfulImportsWithWarnings = importWarnings.filter(
        (w) => w.successful && w.message
      );

      alertsList.push(
        createImportMessage(
          failedImports,
          successfulImports,
          successfulImportsWithWarnings,
          testDataId
        )
      );
    }

    return alertsList;
  }, [
    error,
    errorMessages,
    warning,
    warningMessages,
    importWarnings,
    testDataId,
  ]);

  if (alerts.length === 0) return <div />;

  return (
    <div id="status-handler">
      <MadieAlert
        alerts={alerts}
        minimizeAlerts={featureFlags?.MinimizeAlerts}
      />
    </div>
  );
};

export default StatusHandler;
