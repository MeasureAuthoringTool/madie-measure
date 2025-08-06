import React from "react";
import "styled-components/macro";
import { DisplayPopulationValue, PopulationType } from "@madie/madie-models";
import _ from "lodash";
import ExpectActualInput from "./ExpectActualInput";
/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role */

export interface TestCasePopulationProps {
  population: DisplayPopulationValue;
  populationResult: any;
  populationBasis: string;
  showExpected?: boolean;
  disableExpected?: boolean;
  onChange: (population: DisplayPopulationValue) => void;
  measureObservationsCount: number;
  initialPopulationCount: number;
  error: any;
  i?: number;
  strat?: boolean;
  isTestCaseExecuted?: boolean;
  setIsTestCaseExecuted?: (isTestCaseExecuted: boolean) => void;
  content: string;
}

const TestCasePopulation = ({
  population,
  populationResult,
  populationBasis,
  disableExpected = false,
  onChange,
  measureObservationsCount,
  initialPopulationCount,
  error,
  strat,
  i,
  isTestCaseExecuted,
  setIsTestCaseExecuted,
  content,
}: TestCasePopulationProps) => {
  const populationNameTemplate = (prop) => {
    if (prop === PopulationType.INITIAL_POPULATION) {
      return (
        _.startCase(PopulationType.INITIAL_POPULATION) +
        (initialPopulationCount > 0 ? " " + initialPopulationCount : "")
      );
    }
    if (prop === PopulationType.MEASURE_POPULATION_OBSERVATION) {
      return (
        _.startCase(PopulationType.MEASURE_OBSERVATION) +
        (measureObservationsCount > 0 ? " " + measureObservationsCount : "")
      );
    }
    if (
      prop === PopulationType.NUMERATOR_OBSERVATION ||
      prop === PopulationType.DENOMINATOR_OBSERVATION
    ) {
      return (
        _.startCase(population.name) +
        (measureObservationsCount > 0 ? " " + measureObservationsCount : "")
      );
    } else {
      return _.startCase(population.name);
    }
  };

  const countTemplate = (populationType) => {
    if (populationType === PopulationType.INITIAL_POPULATION) {
      return initialPopulationCount > 0 ? `${initialPopulationCount}` : "";
    }
    if (
      populationType === PopulationType.MEASURE_POPULATION_OBSERVATION ||
      populationType === PopulationType.NUMERATOR_OBSERVATION ||
      populationType === PopulationType.DENOMINATOR_OBSERVATION
    ) {
      return measureObservationsCount > 0 ? `${measureObservationsCount}` : "";
    }

    return "";
  };

  const count = countTemplate(population.name as PopulationType);
  const label = populationNameTemplate(population.name as PopulationType);

  return (
    <React.Fragment key={`fragment-key-${population.name}`}>
      <tr
        tw="border-b"
        key={population.name}
        data-testid={
          strat
            ? `strat-test-row-population-id-${population.name}-${i}`
            : `test-row-population-id-${population.name}`
        }
        role="row"
      >
        <td role="cell">
          <span style={{ visibility: "hidden" }}>-</span>
        </td>
        <td role="cell">{label}</td>
        <td role="cell">
          <ExpectActualInput
            id={`${population.id}-expected-cb`}
            aria-label={`${content} ${label} expected`}
            name={`${population.name}${count}-expected`}
            expectedValue={population.expected}
            onChange={(expectedValue) => {
              setIsTestCaseExecuted(false);
              return onChange({ ...population, expected: expectedValue });
            }}
            populationBasis={populationBasis}
            disabled={disableExpected}
            data-testid={
              strat
                ? `strat-test-population-${population.name}-expected-${i}`
                : `test-population-${population.name}-expected`
            }
            displayType="expected"
          />
        </td>
        <td role="cell">
          {isTestCaseExecuted && populationResult ? (
            <ExpectActualInput
              id={`${populationResult?.id}-actual-cb`}
              aria-label={`${content} ${label} actual`}
              name={`${population.name}${count}-actual`}
              expectedValue={populationResult?.actual}
              onChange={() => {}} // do nothing - should not be editable here
              populationBasis={populationBasis}
              disabled={true}
              data-testid={
                strat
                  ? `strat-test-population-${populationResult?.name}-actual-${i}`
                  : `test-population-${populationResult?.name}-actual`
              }
              displayType="actual"
            />
          ) : (
            <pre
              data-testid={
                strat
                  ? `test-population-${populationResult?.name}-actual-${i}`
                  : `test-population-${populationResult?.name}-actual`
              }
            >
              {" "}
              -
            </pre>
          )}
        </td>
      </tr>
      {error?.expected && (
        <tr tw="border-b">
          <td>
            <span style={{ visibility: "hidden" }}>-</span>
          </td>
          <td colSpan={5}>
            <span
              data-testid={`${population.name}-error-helper-text`}
              role="alert"
              className="qpp-error-message"
              style={{ textTransform: "none" }}
            >
              {error?.expected}
            </span>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

export default TestCasePopulation;
