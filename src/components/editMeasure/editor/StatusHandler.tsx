import React from "react";
import { MadieAlert } from "@madie/madie-design-system";
import * as _ from "lodash";
import { useFeatureFlags } from "@madie/madie-util";

const generateAlertConfig = (
  type,
  header,
  secondaryMessages,
  outboundAnnotations
) => {
  const errorAnnotation = _.filter(outboundAnnotations, { type: "error" });
  const errors = errorAnnotation?.map((el, index) => (
    <li key={index}>{transformAnnotation(el)}</li>
  ));
  if (type === "success" && errorAnnotation && errorAnnotation.length > 0) {
    type = "error";
  }

  return {
    type,
    copyButton: true,
    content: (
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
              {secondaryMessages.map((message, index) => (
                <li key={index}>{message}</li>
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
      </div>
    ),
    canClose: false,
  };
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
  const featureFlags = useFeatureFlags();
  const alerts = [];
  if (success?.status === "success") {
    if (outboundAnnotations?.length > 0) {
      alerts.push(
        generateAlertConfig(
          success.status,
          success.primaryMessage,
          success.secondaryMessages,
          outboundAnnotations
        )
      );
    } else {
      alerts.push(
        generateAlertConfig(
          success.status,
          success.primaryMessage,
          success.secondaryMessages,
          null
        )
      );
    }
  } else if (error) {
    if (errorMessage) {
      if (outboundAnnotations?.length > 0) {
        alerts.push(
          generateAlertConfig("error", errorMessage, null, outboundAnnotations)
        );
      } else {
        if (hasSubTitle) {
          alerts.push({
            type: "error",
            copyButton: true,
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
          });
        } else {
          alerts.push(generateAlertConfig("error", errorMessage, null, null));
        }
      }
    } else if (outboundAnnotations && outboundAnnotations.length > 0) {
      alerts.push(
        generateAlertConfig(
          "error",
          "Following issues were found within the CQL",
          null,
          outboundAnnotations
        )
      );
    } else {
      alerts.push(
        generateAlertConfig(
          "error",
          "Errors were found within the CQL",
          null,
          null
        )
      );
    }
  } else if (outboundAnnotations && outboundAnnotations.length > 0) {
    const errorAnnotations = _.filter(outboundAnnotations, {
      type: "error",
    });
    if (errorAnnotations?.length > 0) {
      alerts.push(
        generateAlertConfig(
          "error",
          "Following issues were found within the CQL",
          null,
          errorAnnotations
        )
      );
    }
  }

  if (alerts.length === 0) {
    return <></>;
  }

  return (
    <MadieAlert alerts={alerts} minimizeAlerts={featureFlags?.MinimizeAlerts} />
  );
};

export default StatusHandler;
