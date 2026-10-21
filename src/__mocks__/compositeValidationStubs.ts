// Shared jest stubs for @madie/madie-util's composite measure validation. Bodies
// mirror madie-util/src/util/compositeMeasureValidation.ts
import { MeasureScoring } from "@madie/madie-models";

export const COMPOSITE_VALIDATION_MESSAGES = {
  TWO_COMPONENTS_REQUIRED: "Two component measures must be selected",
  SCORING_MUST_BE_COMPOSITE: "Measure score must be Composite",
  COMPOSITE_SCORING_REQUIRED: "Composite measure score is required",
  COMPOSITE_SCORING_INVALID: "Component measures score is inaccurate",
  COMPONENT_MEASURE_TYPES_INVALID:
    "The measure type of the component measure(s) is invalid",
  COMPONENT_POPULATION_BASIS_INVALID:
    "The population basis for the component measure(s) is inaccurate",
  UNABLE_TO_VALIDATE_COMPONENTS:
    "Unable to validate component measures. Please try again and contact the Help Desk if the problem persists.",
};

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

export const getCompositeValidationErrors = (message: string): string[] => {
  if (!message) {
    return [];
  }
  return Object.values(COMPOSITE_VALIDATION_MESSAGES)
    .filter((error) => message.includes(error))
    .sort((a, b) => message.indexOf(a) - message.indexOf(b));
};
