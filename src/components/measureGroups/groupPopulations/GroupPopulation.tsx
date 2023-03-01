import React from "react";
import * as _ from "lodash";
import MeasureGroupPopulationSelect from "./MeasureGroupPopulationSelect";
import { ExpressionDefinition } from "../MeasureGroups";
import { GroupScoring, Population, PopulationType } from "@madie/madie-models";
import { FormikState, getIn } from "formik";
import { FieldInputProps } from "formik/dist/types";
import { findPopulations, isPopulationRequired } from "../PopulationHelper";

export enum InitialPopulationAssociationType {
  DENOMINATOR = "Denominator",
  NUMERATOR = "Numerator",
}

type Props = {
  field: FieldInputProps<string>;
  form: FormikState<any>;
  cqlDefinitions: ExpressionDefinition[];
  populations: Population[];
  population: Population;
  populationIndex: number;
  scoring: string;
  canEdit: boolean;
  insertCallback: any;
  removeCallback: any;
  replaceCallback: any;
  setAssociationChanged: (value: boolean) => void;
};

const GroupPopulation = ({
  field,
  form,
  cqlDefinitions,
  populations,
  population,
  populationIndex,
  scoring,
  canEdit,
  replaceCallback,
  setAssociationChanged,
}: Props) => {
  // Helper function do determine the properties for a select item
  const populationSelectorProperties = (fieldProps: any, scoring: string) => {
    const hidden = fieldProps.hidden?.includes(scoring);
    const required = isPopulationRequired(population.name);
    return {
      label: _.startCase(field.name),
      hidden,
      required,
      name: field.name,
      options: cqlDefinitions,
      subTitle: fieldProps.subTitle,
    };
  };

  // when new copy of this population is added, label needs to be adjusted
  // e.g. Initial Population becomes "Initial Population 1"
  // If more than one IP, second IP becomes "Initial Population 2"
  const correctPopulationLabel = (
    populations: Population[],
    population: Population
  ) => {
    const label = _.startCase(population.name);
    const filteredPopulations = findPopulations(populations, population.name);
    if (filteredPopulations.length > 1) {
      return `${label} ${populationIndex + 1}`;
    }
    return label;
  };

  const getAssociationType = (label) => {
    if (scoring === GroupScoring.RATIO) {
      if (label === "Initial Population") {
        population.associationType = undefined;
      }
      if (
        label === "Initial Population 1" &&
        population.associationType === undefined
      ) {
        population.associationType =
          InitialPopulationAssociationType.DENOMINATOR;
      } else if (
        label === "Initial Population 2" &&
        population.associationType === undefined
      ) {
        population.associationType = InitialPopulationAssociationType.NUMERATOR;
      }
    }
    return population.associationType;
  };

  const getInitialPopulationSize = () => {
    if (scoring === GroupScoring.RATIO) {
      const ips = findPopulations(
        populations,
        PopulationType.INITIAL_POPULATION
      );
      if (ips && ips.length === 2) {
        return 2;
      }
    }
  };

  const selectorProps = populationSelectorProperties(population, scoring);
  const error = getIn(form.errors, field.name);
  const showError =
    Boolean(error) &&
    (getIn(form.touched, field.name) || population.definition);
  selectorProps.label = correctPopulationLabel(populations, population);
  population.associationType = getAssociationType(selectorProps.label);
  const initialPopulationSize = getInitialPopulationSize();

  return (
    <MeasureGroupPopulationSelect
      {...selectorProps}
      field={field}
      helperText={showError ? error : ""}
      error={showError}
      canEdit={canEdit}
      scoring={scoring}
      population={population}
      initialPopulationSize={initialPopulationSize}
    />
  );
};

export default GroupPopulation;
