import { Measure } from "@madie/madie-models";

export default function getInitialValues(measure: Measure, typeLower: string) {
  switch (typeLower) {
    case "steward":
      const steward = measure?.measureMetaData?.steward;
      return !!steward ? steward : "";
    case "description":
      const description = measure?.measureMetaData?.description;
      return !!description ? description : "";
    case "copyright":
      const copyright = measure?.measureMetaData?.copyright;
      return !!copyright ? copyright : "";
    case "disclaimer":
      const diclaimer = measure?.measureMetaData?.disclaimer;
      return !!diclaimer ? diclaimer : "";
    case "rationale":
      const rationale = measure?.measureMetaData?.rationale;
      return !!rationale ? rationale : "";
    case "author":
      const author = measure?.measureMetaData?.author;
      return !!author ? author : "";
    case "guidance":
      const guidance = measure?.measureMetaData?.guidance;
      return !!guidance ? guidance : "";
    case "clinical":
      const clinical = measure?.measureMetaData?.clinicalRecommendation;
      return !!clinical ? clinical : "";
    default:
      return "";
  }
}

export const setMeasureMetadata = (
  measure: Measure,
  typeLower: string,
  newValue: string
) => {
  switch (typeLower) {
    case "steward":
      measure.measureMetaData.steward = newValue;
      break;
    case "description":
      measure.measureMetaData.description = newValue;
      break;
    case "copyright":
      measure.measureMetaData.copyright = newValue;
      break;
    case "disclaimer":
      measure.measureMetaData.disclaimer = newValue;
      break;
    case "rationale":
      measure.measureMetaData.rationale = newValue;
      break;
    case "author":
      measure.measureMetaData.author = newValue;
      break;
    case "guidance":
      measure.measureMetaData.guidance = newValue;
      break;
    case "clinical":
      measure.measureMetaData.clinicalRecommendation = newValue;
      break;
    default:
      break;
  }
};
