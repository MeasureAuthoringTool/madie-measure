import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";
import "./StatusHandler.scss";

const StatusHandler = ({
  success,
  error,
  errorMessage,
  outboundAnnotations,
  hasSubTitle,
}) => {
  // success.status = fulfilled && elmTranslation errors
  console.log("", outboundAnnotations);
  const transformAnnotation = (annotation) => {
    return `Row: ${annotation.row + 1}, Col:${annotation.column}: ${
      annotation.text
    }`;
  };
  const isLength = (val) => {
    return val.length > 0 ? "s" : "";
  };
  {
    /*
    success,
    success, error, outbound
    success, error,
    success, outbound
    success alone
    */
    if (success?.status === "success") {
      if (errorMessage) {
        if (outboundAnnotations.length > 0) {
          const mappedMessages = outboundAnnotations.map((el) => (
            <li>{transformAnnotation(el)}</li>
          ));
          return (
            <MadieAlert
              type="success"
              content={
                <div aria-live="polite" role="alert">
                  <h3 data-testid="generic-success-text-header">
                    Changes saved successfully but the following errors were
                    found
                  </h3>
                  <p className="secondary" data-testid="library-warning">
                    {errorMessage}
                  </p>
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
        }
        return (
          <MadieAlert
            type="success"
            content={
              <div aria-live="polite" role="alert">
                <h3 data-testid="generic-success-text-header">
                  Changes saved successfully but the following errors were found
                </h3>
                <p className="secondary" data-testid="library-warning">
                  {errorMessage}
                </p>
              </div>
            }
            canClose={false}
          />
        );
      }
      if (outboundAnnotations && outboundAnnotations.length > 0) {
        const mappedMessages = outboundAnnotations.map((el) => (
          <li>{transformAnnotation(el)}</li>
        ));
        return (
          <MadieAlert
            type="success"
            content={
              <div aria-live="polite" role="alert">
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
      }
      // we have an edge case in which we have an error message as well as a success
      else {
        return (
          <MadieAlert
            type="success"
            content={
              <h3
                aria-live="polite"
                data-testid="generic-success-text-header"
                role="alert"
              >
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
                <div aria-live="polite" role="alert">
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
          if (hasSubTitle) {
            return (
              <MadieAlert
                type="error"
                content={
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
                }
                canClose={false}
              />
            );
          } else {
            return (
              <MadieAlert
                type="error"
                content={
                  <h3
                    aria-live="polite"
                    role="alert"
                    data-testid="generic-error-text-header"
                  >
                    {errorMessage}
                  </h3>
                }
                canClose={false}
              />
            );
          }
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
              <div aria-live="polite" role="alert">
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
              <h3
                aria-live="polite"
                role="alert"
                data-testid="generic-error-text-header"
              >
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
              <div aria-live="polite" role="alert">
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
