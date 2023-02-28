import { GroupScoring, Population, PopulationType } from "@madie/madie-models";
import { findPopulations } from "./PopulationHelper";
import * as _ from "lodash";

export enum InitialPopulationAssociationType {
  DENOMINATOR = "Denominator",
  NUMERATOR = "Numerator",
}

export const showAddPopulationLink = (
  scoring: string,
  populations: Population[],
  population: Population
) => {
  // For ratio group
  if (scoring === GroupScoring.RATIO) {
    const ips = findPopulations(populations, PopulationType.INITIAL_POPULATION);
    // if IP is one, add second IP link is shown
    return (
      ips &&
      ips.length === 1 &&
      population.name === PopulationType.INITIAL_POPULATION
    );
  }
  return false;
};

export const findIndex = (
  population: Population,
  populations: Population[]
) => {
  for (let index = 0; index < populations?.length; index++) {
    const temp = populations[index];
    if (population.id === temp.id) {
      return index;
    }
  }
};

export const getInitialPopulationSize = (scoring, populations) => {
  if (scoring === GroupScoring.RATIO) {
    const ips = findPopulations(populations, PopulationType.INITIAL_POPULATION);
    if (ips && ips.length === 2) {
      return 2;
    }
  }
};

export const isPopulationRemovable = (
  scoring: string,
  populations: Population[],
  index: number
) => {
  // for ratio measure
  if (scoring === GroupScoring.RATIO) {
    const ips = findPopulations(populations, PopulationType.INITIAL_POPULATION);
    // if there are 2 IPs, remove IP link is shown for second IP
    return ips && ips.length === 2 && index === 1;
  }
  return false;
};

export const correctPopulationLabel = (
  populations: Population[],
  population: Population,
  index
) => {
  const label = _.startCase(population?.name || "");
  const filteredPopulations = findPopulations(populations, population?.name);
  if (filteredPopulations.length > 1) {
    return `${label} ${index + 1}`;
  }
  return label;
};

export const getAssociationType = (label, scoring, population) => {
  if (scoring === GroupScoring.RATIO) {
    if (label === "Initial Population") {
      population.associationType = undefined;
    }
    if (
      label === "Initial Population 1" &&
      population.associationType === undefined
    ) {
      population.associationType = InitialPopulationAssociationType.DENOMINATOR;
    } else if (
      label === "Initial Population 2" &&
      population.associationType === undefined
    ) {
      population.associationType = InitialPopulationAssociationType.NUMERATOR;
    }
  }
  return population.associationType;
};
