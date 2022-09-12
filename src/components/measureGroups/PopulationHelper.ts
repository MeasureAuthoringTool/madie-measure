import {
  Population,
  PopulationType,
  MeasureScoring,
} from "@madie/madie-models";

export const initialPopulation = {
  id: "",
  name: PopulationType.INITIAL_POPULATION,
  definition: "",
};
const denominator = {
  id: "",
  name: PopulationType.DENOMINATOR,
  definition: "",
};
const denominatorExclusion = {
  id: "",
  name: PopulationType.DENOMINATOR_EXCLUSION,
  definition: "",
};
const denominatorException = {
  id: "",
  name: PopulationType.DENOMINATOR_EXCEPTION,
  definition: "",
};
const numerator = {
  id: "",
  name: PopulationType.NUMERATOR,
  definition: "",
};
const numeratorExclusion = {
  id: "",
  name: PopulationType.NUMERATOR_EXCLUSION,
  definition: "",
};
const measurePopulation = {
  id: "",
  name: PopulationType.MEASURE_POPULATION,
  definition: "",
};
const measurePopulationExclusion = {
  id: "",
  name: PopulationType.MEASURE_POPULATION_EXCLUSION,
  definition: "",
};

export const allPopulations = [
  initialPopulation,
  denominator,
  denominatorExclusion,
  denominatorException,
  numerator,
  numeratorExclusion,
  measurePopulation,
  measurePopulationExclusion,
];

export const findPopulations = (
  populations: Population[],
  populationType: PopulationType
) => {
  return populations?.filter(
    (population) => population.name === populationType
  );
};

export const isPopulationRequired = (populationType: PopulationType) => {
  switch (populationType) {
    case PopulationType.INITIAL_POPULATION:
      return true;
    case PopulationType.DENOMINATOR:
      return true;
    case PopulationType.NUMERATOR:
      return true;
    case PopulationType.MEASURE_POPULATION:
      return true;
    default:
      return false;
  }
};

// default populations for each scoring
export const getPopulationsForScoring = (scoring: string): Population[] => {
  let populations: Population[];
  switch (scoring) {
    case MeasureScoring.COHORT:
      populations = [initialPopulation];
      break;
    case MeasureScoring.PROPORTION:
      populations = [
        initialPopulation,
        denominator,
        denominatorExclusion,
        denominatorException,
        numerator,
        numeratorExclusion,
      ];
      break;
    case MeasureScoring.CONTINUOUS_VARIABLE:
      populations = [
        initialPopulation,
        measurePopulation,
        measurePopulationExclusion,
      ];
      break;
    case MeasureScoring.RATIO:
      populations = [
        initialPopulation,
        denominator,
        denominatorExclusion,
        numerator,
        numeratorExclusion,
      ];
      break;
    default:
      populations = [];
  }

  return populations;
};
