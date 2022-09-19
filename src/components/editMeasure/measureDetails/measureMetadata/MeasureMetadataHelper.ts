import { Measure } from "@madie/madie-models";

export default function getInitialValues(measure: Measure, typeLower: string) {
  switch (typeLower) {
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
    case "guidance":
      const guidance = measure?.measureMetaData?.guidance;
      return !!guidance ? guidance : "";
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
    case "guidance":
      measure.measureMetaData.guidance = newValue;
      break;
    default:
      break;
  }
};
