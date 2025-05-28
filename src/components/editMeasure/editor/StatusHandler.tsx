import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";
import { useFeatureFlags } from "@madie/madie-util";

const generateMadieAlertWithContent = (
  type,
  header,
  secondaryMessages,
  outboundAnnotations,
  featureFlags
) => {
  const errorAnnotation = _.filter(outboundAnnotations, { type: "error" });
  const errors = errorAnnotation?.map((el) => (
    <li>{transformAnnotation(el)}</li>
  ));
  const warningAnnotation = _.filter(outboundAnnotations, {
    type: "warning",
  });
  const warnings = warningAnnotation?.map((el) => {
    return <li>{transformAnnotation(el)}</li>;
  });
  if (type === "success" && errorAnnotation && errorAnnotation.length > 0) {
    type = "warning";
  }

  const alertContent = (
    <div aria-live="polite" role="alert">
      <h3
        aria-live="polite"
        role="alert"
        data-testid={`generic-${type}-text-header`}
      >
        {header}
      </h3>
      {secondaryMessages?.length > 0 && (
        <p className="secondary" data-testid="library-warning">
          <ul style={{ listStyle: "inside" }}>
            {secondaryMessages.map((message, idx) => (
              <li key={idx}>{message}</li>
            ))}
          </ul>
        </p>
      )}
      {errors?.length > 0 && (
        <>
          <h6>
            ({errors.length}) Error{errors.length > 1 ? "s" : ""}:
          </h6>
          <ul data-testid={`generic-errors-text-list`}>{errors}</ul>
        </>
      )}
      {warnings?.length > 0 && (
        <>
          <h6>
            ({warnings.length}) Warning{warnings.length > 1 ? "s" : ""}:
          </h6>
          <ul data-testid={`generic-warnings-text-list`}>{warnings}</ul>
        </>
      )}
    </div>
  );

  const alertsArray = [
    {
      type,
      content: alertContent,
      canClose: false,
      copyButton: true,
    },
  ];

  return (
    <MadieAlert
      minimizeAlerts={featureFlags?.MinimizeAlerts}
      alerts={alertsArray}
    />
  );
};

export const transformAnnotation = (annotation) => {
  return `Row: ${annotation.row + 1}, Col:${annotation.column}: ${
    annotation.text
  }`;
};

const StatusHandler = ({
  success,
  error,
  errorMessage,
  outboundAnnotations,
  hasSubTitle,
}) => {
  /*
    success,
    success, error, outbound
    success, error,
    success, outbound
    success alone
  */
  const featureFlags = useFeatureFlags();
  if (success?.status === "success") {
    if (outboundAnnotations?.length > 0) {
      // Successfully saved with errorMessage and outBoundAnnotations
      return generateMadieAlertWithContent(
        success.status,
        success.primaryMessage,
        success.secondaryMessages,
        outboundAnnotations,
        featureFlags
      );
    } else {
      // Successfully saved with errorMessage
      return generateMadieAlertWithContent(
        success.status,
        success.primaryMessage,
        success.secondaryMessages,
        null,
        featureFlags
      );
    }
  }

  if (error) {
    if (errorMessage) {
      if (outboundAnnotations?.length > 0) {
        // Has errorMessage and outboundAnnotations
        return generateMadieAlertWithContent(
          "error",
          errorMessage,
          null,
          outboundAnnotations,
          featureFlags
        );
      } else {
        // Has errorMessage but no outboundAnnotations
        if (hasSubTitle) {
          const alertsArray = [
            {
              type: "error",
              content: (
                <div aria-live="polite" role="alert">
                  <h3
                    aria-live="polite"
                    role="alert"
                    data-testid="generic-error-text-header"
                  >
                    {errorMessage}
                  </h3>
                  <h5 data-testid="generic-error-text-sub-header">
                    Please reach out to{" "}
                    <a href="https://oncprojectracking.healthit.gov/support/projects/BONNIEMAT/summary">
                      MADiE helpdesk
                    </a>{" "}
                    for assistance.
                  </h5>
                </div>
              ),
              canClose: false,
            },
          ];

          return (
            <MadieAlert
              minimizeAlerts={featureFlags?.MinimizeAlerts}
              alerts={alertsArray}
            />
          );
        } else {
          return generateMadieAlertWithContent(
            "error",
            errorMessage,
            null,
            null,
            featureFlags
          );
        }
      }
    } else if (outboundAnnotations && outboundAnnotations.length > 0) {
      // Has outboundAnnotations but no errorMessage
      return generateMadieAlertWithContent(
        "error",
        "Following issues were found within the CQL",
        null,
        outboundAnnotations,
        featureFlags
      );
    } else {
      // Error flag is true but no errorMessage and no outboundAnnotations are provided
      return generateMadieAlertWithContent(
        "error",
        "Errors were found within the CQL",
        null,
        null,
        featureFlags
      );
    }
  } else {
    // if the error flag is not true, but we still have errors within the cql
    if (outboundAnnotations && outboundAnnotations.length > 0) {
      return generateMadieAlertWithContent(
        "error",
        "Following issues were found within the CQL",
        null,
        outboundAnnotations,
        featureFlags
      );
    }
    return <></>;
  }
};

export default StatusHandler;
