import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";
import "./StatusHandler.scss";

const StatusHandler = ({
  success,
  error,
  errorMessage,
  outboundAnnotations,
}) => {
  // success.status = fulfilled && elmTranslation errors
  const transformAnnotation = (annotation) => {
    return `Row: ${annotation.row + 1}, Col:${annotation.column}: ${
      annotation.text
    }`;
  };
  const isLength = (val) => {
    return val.length > 0 ? "s" : "";
  };
  {
    if (success.status === "success") {
      if (outboundAnnotations && outboundAnnotations.length > 0) {
        const mappedMessages = outboundAnnotations.map((el) => (
          <li>{transformAnnotation(el)}</li>
        ));
        return (
          <MadieAlert
            type="success"
            content={
              <div aria-live="polite">
                <h3 data-testid="generic-success-text-header">
                  Changes saved successfully but the following errors were found
                </h3>
                {success.message ===
                  "CQL updated successfully! Library Name and/or Version can not be updated in the CQL Editor. MADiE has overwritten the updated Library Name and/or Version." && (
                  <p className="secondary" data-testid="library-warning">
                    {success.message}
                  </p>
                )}
                <h4 data-testid="generic-success-text-sub-header">{`${
                  outboundAnnotations.length
                } CQL error${isLength(outboundAnnotations)} found:`}</h4>
                <ul data-testid="generic-success-text-list">
                  {mappedMessages}
                </ul>
              </div>
            }
            canClose={false}
          />
        );
      } else {
        return (
          <MadieAlert
            type="success"
            content={
              <h3 aria-live="polite" data-testid="generic-success-text-header">
                {success.message}
              </h3>
            }
            canClose={false}
          />
        );
      }
    }
  }

  {
    // if there's ANY error flag
    if (error) {
      if (errorMessage) {
        if (outboundAnnotations && outboundAnnotations.length > 0) {
          const mappedMessages = outboundAnnotations.map((el) => (
            <li>{transformAnnotation(el)}</li>
          ));
          return (
            <MadieAlert
              type="error"
              content={
                <div aria-live="polite">
                  <h3 data-testid="generic-error-text-header">
                    {errorMessage}
                  </h3>
                  <h4 data-testid="generic-error-text-sub-header">{`${
                    outboundAnnotations.length
                  } CQL error${isLength(outboundAnnotations)} found:`}</h4>
                  <ul data-testid="generic-error-text-list">
                    {mappedMessages}
                  </ul>
                </div>
              }
              canClose={false}
            />
          );
        } else {
          return (
            <MadieAlert
              type="error"
              content={
                <h3 aria-live="polite" data-testid="generic-error-text-header">
                  {errorMessage}
                </h3>
              }
              canClose={false}
            />
          );
        }
      }
      // if we have errors but no error message tied to it
      if (outboundAnnotations && outboundAnnotations.length > 0) {
        const mappedMessages = outboundAnnotations.map((el) => (
          <li>{transformAnnotation(el)}</li>
        ));
        return (
          <MadieAlert
            type="error"
            content={
              <div aria-live="polite">
                <h3 data-testid="generic-error-text-header">
                  Errors were found within the CQL
                </h3>
                <h4 data-testid="generic-error-text-sub-header">{`${
                  outboundAnnotations.length
                } CQL error${isLength(outboundAnnotations)} found:`}</h4>
                <ul data-testid="generic-error-text-list">{mappedMessages}</ul>
              </div>
            }
            canClose={false}
          />
        );
      }
      //   if error flag is true but no information is supplied and no annotations provided
      return (
        <MadieAlert
          type="error"
          content={
            <>
              <h3 aria-live="polite" data-testid="generic-error-text-header">
                Errors were found within the CQL
              </h3>
            </>
          }
          canClose={false}
        />
      );
    }
    // if the error flag is not true, but we still have errors within the cql
    else {
      if (outboundAnnotations.length > 0) {
        const mappedMessages = outboundAnnotations.map((el) => (
          <li>{transformAnnotation(el)}</li>
        ));
        return (
          <MadieAlert
            type="error"
            content={
              <div aria-live="polite">
                <h3 data-testid="generic-error-text-header">
                  Errors were found within the CQL
                </h3>
                <h4 data-testid="generic-error-text-sub-header">{`${
                  outboundAnnotations.length
                } CQL error${isLength(outboundAnnotations)} found:`}</h4>
                <ul data-testid="generic-error-text-list">{mappedMessages}</ul>
              </div>
            }
            canClose={false}
          />
        );
      }
      return <div />;
    }
  }
};

export default StatusHandler;
