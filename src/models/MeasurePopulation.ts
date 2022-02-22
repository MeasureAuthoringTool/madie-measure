export enum MeasurePopulation {
  INITIAL_POPULATION = "initialPopulation",
  NUMERATOR = "numerator",
  NUMERATOR_EXCLUSION = "numeratorExclusion",
  DENOMINATOR = "denominator",
  DENOMINATOR_EXCLUSION = "denominatorExclusion",
  DENOMINATOR_EXCEPTION = "denominatorException",
  MEASURE_POPULATION = "measurePopulation",
  MEASURE_POPULATION_EXCLUSION = "measurePopulationExclusion",
  MEASURE_OBSERVATION = "measureObservation",
}

export type PopulationType = {
  [key in MeasurePopulation]?: string;
};
