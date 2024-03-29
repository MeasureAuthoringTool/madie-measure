import { Measure } from "@madie/madie-models";

export function mappingMeasureMetaDataType(lowerCaseMeasureMetaData: string) {
  return lowerCaseMeasureMetaData === "clinical-recommendation-statement"
    ? "clinicalRecommendation"
    : lowerCaseMeasureMetaData;
}
export default function getInitialValues(measure: Measure, typeLower: string) {
  switch (mappingMeasureMetaDataType(typeLower)) {
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
    case "guidance-usage":
      const guidance = measure?.measureMetaData?.guidance;
      return !!guidance ? guidance : "";
    case "clinicalRecommendation":
      const clinical = measure?.measureMetaData?.clinicalRecommendation;
      return !!clinical ? clinical : "";
    case "definition":
      const definition = measure?.measureMetaData?.definition;
      return !!definition ? definition : "";
    case "measure-set":
      const measureSetTitle = measure?.measureMetaData?.measureSetTitle;
      return !!measureSetTitle ? measureSetTitle : "";
    default:
      return "";
  }
}

export const setMeasureMetadata = (
  measure: Measure,
  typeLower: string,
  newValue: string
) => {
  switch (mappingMeasureMetaDataType(typeLower)) {
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
    case "guidance-usage":
      measure.measureMetaData.guidance = newValue;
      break;
    case "clinicalRecommendation":
      measure.measureMetaData.clinicalRecommendation = newValue;
      break;
    case "definition":
      measure.measureMetaData.definition = newValue;
      break;
    case "measure-set":
      measure.measureMetaData.measureSetTitle = newValue;
      break;
    default:
      break;
  }
};
