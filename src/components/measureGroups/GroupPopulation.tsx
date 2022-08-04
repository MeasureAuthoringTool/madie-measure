import React, { Fragment } from "react";
import * as _ from "lodash";
import MeasureGroupPopulationSelect from "./MeasureGroupPopulationSelect";
import { ExpressionDefinition } from "./MeasureGroups";
import { GroupScoring, Population, PopulationType } from "@madie/madie-models";
import { FieldInputProps } from "formik/dist/types";

type Props = {
  field: FieldInputProps<string>;
  cqlDefinitions: ExpressionDefinition[];
  populations: Population[];
  population: Population;
  populationIndex: number;
  scoring: string;
  canEdit: boolean;
  insertCallback: any;
  removeCallback: any;
};

const GroupPopulation = ({
  field,
  cqlDefinitions,
  populations,
  population,
  populationIndex,
  scoring,
  canEdit,
  insertCallback,
  removeCallback,
}: Props) => {
  // Helper function do determine the properties for a select item
  const populationSelectorProperties = (fieldProps: any, scoring: String) => {
    const hidden = fieldProps.hidden?.includes(scoring);
    const required =
      !fieldProps.optional?.includes("*") &&
      !fieldProps.optional?.includes(scoring);
    const options: ExpressionDefinition[] = cqlDefinitions;
    return {
      label: _.startCase(field.name),
      hidden,
      required,
      name: field.name,
      options,
      subTitle: fieldProps.subTitle,
    };
  };

  const findPopulations = (
    populations: Population[],
    populationType: PopulationType
  ) => {
    return populations?.filter(
      (population) => population.name === populationType
    );
  };

  const showAddPopulationLink = (
    scoring: string,
    populations: Population[]
  ) => {
    // For ratio group
    if (scoring === GroupScoring.RATIO) {
      const ips = findPopulations(
        populations,
        PopulationType.INITIAL_POPULATION
      );
      // if IP is one, add second IP link is shown
      return (
        ips &&
        ips.length === 1 &&
        population.name === PopulationType.INITIAL_POPULATION
      );
    }
    return false;
  };

  const isPopulationRemovable = (
    scoring: string,
    populations: Population[]
  ) => {
    // for ratio measure
    if (scoring === GroupScoring.RATIO) {
      const ips = findPopulations(
        populations,
        PopulationType.INITIAL_POPULATION
      );
      // if there are 2 IPs, remove IP link is shown for second IP
      return ips && ips.length === 2 && populationIndex === 1;
    }
    return false;
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

  // add copy of this population
  const addPopulation = () => {
    insertCallback(populationIndex + 1, {
      id: "",
      name: population.name,
      definition: "",
    });
  };

  const selectorProps = populationSelectorProperties(population, scoring);
  const touched = _.get(populations, selectorProps.name);
  const error = !!touched ? _.get(populations, selectorProps.name) : null;
  const isRemovable = isPopulationRemovable(scoring, populations);
  const canBeAdded = showAddPopulationLink(scoring, populations);
  selectorProps.label = correctPopulationLabel(populations, population);

  return (
    <Fragment key={`select_${selectorProps.label}`}>
      <MeasureGroupPopulationSelect
        {...selectorProps}
        {...field}
        helperText={error}
        error={!!error && !!touched}
        canEdit={canEdit}
        removePopulationCallback={() => removeCallback(populationIndex)}
        isRemovable={isRemovable}
        showAddPopulationLink={canBeAdded}
        addPopulationCallback={addPopulation}
      />
    </Fragment>
  );
};

export default GroupPopulation;
