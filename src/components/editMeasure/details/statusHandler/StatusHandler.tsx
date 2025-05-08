import React from "react";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

import "./StatusHandler.scss";
import "twin.macro";
import "styled-components/macro";

interface StatusHandlerProps {
  errorMessages: Array<string>;
  testDataId?: string;
}

const StatusHandler = ({ errorMessages, testDataId }: StatusHandlerProps) => {
  if (errorMessages) {
    const withoutDuplicates = [...new Set(errorMessages)];

    if (withoutDuplicates.length === 1) {
      return (
        <div id="status-handler">
          <MadieAlert
            data-testid="generic-error-text-header"
            type="error"
            content={
              <div aria-live="polite" role="alert" data-testid={testDataId}>
                <h3>{withoutDuplicates}</h3>
              </div>
            }
            canClose={false}
            copyButton={true}
          />
        </div>
      );
    } else if (withoutDuplicates.length > 1) {
      const mappedMessages = withoutDuplicates.map(
        (em: string, index: number) => <li key={index}>{em}</li>
      );
      return (
        <div id="status-handler">
          <MadieAlert
            type="error"
            content={
              <div aria-live="polite" role="alert" data-testid={testDataId}>
                <h3>{withoutDuplicates.length} errors were found</h3>
                <ul data-testid="generic-fail-text-list">{mappedMessages}</ul>
              </div>
            }
            canClose={false}
            copyButton={true}
          />
        </div>
      );
    }
  }

  return <div />;
};

export default StatusHandler;
