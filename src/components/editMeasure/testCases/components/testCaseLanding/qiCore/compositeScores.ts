import { MRCalculationOutput } from "fqm-execution/build/types/Calculator";

export interface CompositeScores {
  compositeScore?: number;
  denominatorScore?: number;
  numeratorScore?: number;
}

// Parses a composite MeasureReport for the group matching the selected groupDisplayId,
// returning the composite score as a percentage and the denominator/numerator counts.
export const parseCompositeScores = (
  calculationOutput: MRCalculationOutput | undefined,
  groupDisplayId: string | undefined
): CompositeScores => {
  const results = calculationOutput?.results;
  if (!results || !groupDisplayId) {
    return {};
  }
  const report = Array.isArray(results) ? results[0] : results;
  const group = report?.group?.find((g) => g.id === groupDisplayId);
  if (!group) {
    return {};
  }
  const getPopulationCount = (populationCode: string): number | undefined =>
    group.population?.find((population) =>
      population.code?.coding?.some((coding) => coding.code === populationCode)
    )?.count;

  const measureScore = group.measureScore?.value;
  return {
    compositeScore:
      measureScore != null
        ? Math.round(measureScore * 100 * 100) / 100
        : undefined,
    denominatorScore: getPopulationCount("denominator"),
    numeratorScore: getPopulationCount("numerator"),
  };
};
