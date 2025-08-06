import React from "react";
import "styled-components/macro";
import { DisplayStratificationValue } from "@madie/madie-models";
import ExpectActualInput from "../populations/ExpectActualInput";

/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role */

export interface TestCaseStratificationProps {
  strataCode: string;
  stratification: DisplayStratificationValue;
  stratificationCount: number;
  stratResult?: any;
  populationBasis: string;
  showExpected?: boolean;
  disableExpected?: boolean;
  onStratificationChange: (stratification: DisplayStratificationValue) => void;
  QDM?: boolean;
  index?: number;
  isTestCaseExecuted?: boolean;
  setIsTestCaseExecuted?: (isTestCaseExecuted: boolean) => void;
  content: string;
}

const TestCaseStratification = ({
  strataCode,
  stratification,
  stratificationCount,
  stratResult,
  populationBasis,
  disableExpected = false,
  onStratificationChange,
  setIsTestCaseExecuted,
  index,
  QDM = false,
  isTestCaseExecuted = false,
  content,
}: TestCaseStratificationProps) => {
  const label = `${QDM ? "Stratification" : strataCode}`;

  return (
    <React.Fragment key={`fragment-key-${strataCode}`}>
      <tr
        tw="border-b"
        key={strataCode}
        data-testid={`test-row-population-id-${stratification.name}`}
        role="row"
      >
        <td role="cell">
          <span style={{ visibility: "hidden" }}>-</span>
        </td>
        <td role="cell">{label}</td>
        <td role="cell">
          <ExpectActualInput
            id={`${stratification.name}-expected-cb`}
            aria-label={`${content} ${label} expected`}
            name={`stratification${stratificationCount}-expected`}
            expectedValue={stratification.expected}
            onChange={(expectedValue) => {
              setIsTestCaseExecuted(false);
              onStratificationChange({
                ...stratification,
                expected: expectedValue,
              });
            }}
            populationBasis={populationBasis}
            disabled={disableExpected}
            data-testid={
              QDM
                ? `test-population-${stratification.name}-expected-${index}`
                : `test-population-${stratification.name}-expected`
            }
            displayType="expected"
          />
        </td>
        <td role="cell">
          {isTestCaseExecuted ? (
            <ExpectActualInput
              id={`${stratResult.name}-actual-cb`}
              aria-label={`${content} ${label} actual`}
              name={`stratification${stratificationCount}-actual`}
              expectedValue={stratResult.actual}
              onChange={() => {}}
              populationBasis={populationBasis}
              disabled={true}
              data-testid={
                QDM
                  ? `test-stratification-${stratResult.name}-actual-${index}`
                  : `test-stratification-${stratResult.name}-actual`
              }
              displayType="actual"
            />
          ) : (
            <pre
              data-testid={
                QDM
                  ? `test-stratification-${stratResult.name}-actual-${index}`
                  : `test-stratification-${stratResult.name}-actual`
              }
            >
              {" "}
              -
            </pre>
          )}
        </td>
      </tr>
    </React.Fragment>
  );
};

export default TestCaseStratification;
