import { ElmTranslationError } from "../../api/useElmTranslationServiceApi";
import { CustomCqlCode } from "./MeasureEditor";

const getCqlErrors = (cqlObj, errorSeverity, errorType) => {
  return {
    startLine: cqlObj.start.line,
    startChar: cqlObj.start.position,
    endChar: cqlObj.stop.position,
    endLine: cqlObj.stop.line,
    errorSeverity: errorSeverity,
    errorType: errorType,
    message: cqlObj.errorMessage,
    targetIncludeLibraryId: "",
    targetIncludeLibraryVersionId: "",
    type: errorType,
  };
}

const processCodeSystemErrors = (
  cqlCodes: CustomCqlCode[]
): ElmTranslationError[] => {
  const result = [];
  cqlCodes
    .filter((code) => !code.valid || !code.codeSystem.valid)
    .forEach((code) => {
      if (!code.valid) {
        result.push(getCqlErrors(code, "Error", "Code"));
      }
      if (!code.codeSystem.valid) {
        result.push(getCqlErrors(code.codeSystem, "Error", "CodeSystem"));
      }
    });
  return result;
};

export { processCodeSystemErrors };
