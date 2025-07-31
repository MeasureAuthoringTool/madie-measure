import React from "react";
import "styled-components/macro";
import { DisplayPopulationValue, PopulationType } from "@madie/madie-models";
import _ from "lodash";
import ExpectActualInput from "./ExpectActualInput";

/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role */

export interface TestCasePopulationProps {
  isTestCaseExecuted?: boolean;
  setIsTestCaseExecuted?: (isTestCaseExecuted: boolean) => void;
  population: DisplayPopulationValue;
  populationBasis: string;
  showExpected?: boolean;
  disableExpected?: boolean;
  onChange: (population: DisplayPopulationValue) => void;
  measureObservationsCount: number;
  initialPopulationCount: number;
  error: any;
  content: string;
}

const TestCasePopulation = ({
  isTestCaseExecuted,
  setIsTestCaseExecuted,
  population,
  populationBasis,
  disableExpected = false,
  onChange,
  measureObservationsCount,
  initialPopulationCount,
  error,
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
        data-testid={`test-row-population-id-${population.name}`}
        role="row"
      >
        <td>&nbsp;</td>
        <td role="cell">{label}</td>
        <td role="cell">
          <ExpectActualInput
            id={`${population.id}-expected-cb`}
            aria-label={`${content} ${label} expected`}
            name={`${population.name}${count}-expected`}
            expectedValue={population.expected}
            onChange={(expectedValue) => {
              setIsTestCaseExecuted(false);
              onChange({ ...population, expected: expectedValue });
            }}
            populationBasis={populationBasis}
            disabled={disableExpected}
            data-testid={`test-population-${population.name}-expected`}
            displayType="expected"
          />
        </td>
        <td role="cell">
          {isTestCaseExecuted ? (
            <ExpectActualInput
              id={`${population.id}-actual-cb`}
              aria-label={`${content} ${label} actual`}
              name={`${population.name}${count}-actual`}
              expectedValue={population.actual}
              onChange={() => {}} // do nothing - should not be editable here
              populationBasis={populationBasis}
              disabled={true}
              data-testid={`test-population-${population.name}-actual`}
              displayType="actual"
            />
          ) : (
            <pre data-testid={`test-population-${population.name}-actual`}>
              {" "}
              -
            </pre>
          )}
        </td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
        <td>&nbsp;</td>
      </tr>
      {error?.expected && (
        <tr tw="border-b">
          <td>&nbsp;</td>
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
