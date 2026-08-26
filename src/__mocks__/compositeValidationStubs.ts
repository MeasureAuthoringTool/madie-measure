// Shared jest stubs for @madie/madie-util's composite measure validation. Bodies
// mirror madie-util/src/util/compositeMeasureValidation.ts
import { MeasureScoring } from "@madie/madie-models";

const ALLOWED_COMPONENT_SCORING: Record<string, MeasureScoring[]> = {
  Opportunity: [MeasureScoring.PROPORTION, MeasureScoring.RATIO],
  "All-or-nothing": [MeasureScoring.PROPORTION, MeasureScoring.RATIO],
  Linear: [
    MeasureScoring.PROPORTION,
    MeasureScoring.RATIO,
    MeasureScoring.CONTINUOUS_VARIABLE,
  ],
};

export const compositeScoringValues = Object.keys(ALLOWED_COMPONENT_SCORING);

export const getAllowedScoringTypes = (
  compositeScoring: string
): MeasureScoring[] => ALLOWED_COMPONENT_SCORING[compositeScoring] ?? [];

export const validateCompositeMeasure = jest.fn().mockResolvedValue([]);
