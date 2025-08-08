import { Measure } from "@madie/madie-models";

export function mappingMeasureMetaDataType(lowerCaseMeasureMetaData: string) {
  return lowerCaseMeasureMetaData === "clinical-recommendation-statement"
    ? "clinicalRecommendation"
    : lowerCaseMeasureMetaData;
}

export function ensureParagraphTags(
  text: string,
  isEnhancedTextFormatting: boolean
): string {
  console.log(text);
  if (!isEnhancedTextFormatting) return text;
  if (!text) return "";
  // If text contains any HTML tags, return as is
  // if (/<[a-z][\s\S]*>/i.test(text)) {
  if(text.match(/^<p>(.*)<\/p>$/)){
    console.log("Text already contains HTML tags, returning as is:", text);
    return text;
  }
  // Otherwise, wrap plain text in <p>...</p>
  console.log("Wrapping text in paragraph tags:", `<p>${text}</p>`);
  return `<p>${text}</p>`;
}



export default function getInitialValues(
  measure: Measure,
  typeLower: string,
  isEnhancedTextFormatting: boolean
) {
  switch (mappingMeasureMetaDataType(typeLower)) {
    case "description":
      const description = measure?.measureMetaData?.description;
      return ensureParagraphTags(
        !!description ? description : "",
        isEnhancedTextFormatting
      );
    case "copyright":
      const copyright = measure?.measureMetaData?.copyright;
      return ensureParagraphTags(
        !!copyright ? copyright : "",
        isEnhancedTextFormatting
      );
    case "disclaimer":
      const diclaimer = measure?.measureMetaData?.disclaimer;
      return ensureParagraphTags(
        !!diclaimer ? diclaimer : "",
        isEnhancedTextFormatting
      );
    case "rationale":
      const rationale = measure?.measureMetaData?.rationale;
      return ensureParagraphTags(
        !!rationale ? rationale : "",
        isEnhancedTextFormatting
      );
    case "purpose":
      const purpose = measure?.measureMetaData?.purpose;
      return ensureParagraphTags(
        !!purpose ? purpose : "",
        isEnhancedTextFormatting
      );
    case "guidance-usage":
      const guidance = measure?.measureMetaData?.guidance;
      return ensureParagraphTags(
        !!guidance ? guidance : "",
        isEnhancedTextFormatting
      );
    case "clinicalRecommendation":
      const clinical = measure?.measureMetaData?.clinicalRecommendation;
      return ensureParagraphTags(
        !!clinical ? clinical : "",
        isEnhancedTextFormatting
      );
    case "definition":
      const definition = measure?.measureMetaData?.definition;
      return ensureParagraphTags(
        !!definition ? definition : "",
        isEnhancedTextFormatting
      );
    case "measure-set":
      const measureSetTitle = measure?.measureMetaData?.measureSetTitle;
      return ensureParagraphTags(
        !!measureSetTitle ? measureSetTitle : "",
        isEnhancedTextFormatting
      );
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
    case "purpose":
      measure.measureMetaData.purpose = newValue;
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
