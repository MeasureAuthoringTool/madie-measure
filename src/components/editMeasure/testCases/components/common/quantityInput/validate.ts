import * as ucum from "@lhncbc/ucum-lhc";

export class ValidationResult {
  label?: string;
  helperText?: string;
  ucumUnitCode?: number;
  error: boolean;
}

// QI-Core only: maps easier-to-remember timing display values (e.g. "days")
// to the correct UCUM code (e.g. "d"). Also serves as the list of additional
// non-UCUM units we explicitly support (any key present here is valid).
export const TIMING_DISPLAY_TO_UCUM_CODE: Record<string, string> = {
  years: "a", // this would be a_ as a ucum unit, but not intuitive.
  year: "a",
  months: "mo",
  month: "mo",
  weeks: "wk",
  week: "wk",
  days: "d",
  day: "d",
  hours: "h",
  hour: "h",
  minutes: "min",
  minute: "min",
  seconds: "s",
  second: "s",
  milliseconds: "ms",
  millisecond: "ms",
};

// Derived from TIMING_DISPLAY_TO_UCUM_CODE for backward compatibility.
export const ADDITIONAL_UCUM_UNIT_SUPPORT: Record<string, boolean> =
  Object.fromEntries(
    Object.keys(TIMING_DISPLAY_TO_UCUM_CODE).map((key) => [key, true])
  );

// Returns the UCUM code for a QI-Core timing display value, or undefined when
// the input is not one of the supported timing display values. Input is
// normalized (trimmed + lower-cased) before lookup so casing/whitespace is safe.
export const getUcumCodeForTimingDisplay = (
  input?: string
): string | undefined => {
  if (!input) {
    return undefined;
  }
  const normalized = input.trim().toLowerCase();
  return TIMING_DISPLAY_TO_UCUM_CODE[normalized];
};

export const validate = (code): ValidationResult => {
  const validationResult: ValidationResult = new ValidationResult();
  if (code) {
    let parseResp;
    // Force a valid status on any values we explicitly support.
    if (code && ADDITIONAL_UCUM_UNIT_SUPPORT[code]) {
      parseResp = {
        unit: { name: code },
        status: "valid",
      };
    } else {
      parseResp = ucum.UcumLhcUtils.getInstance().validateUnitString(
        code,
        true
      );
    }
    if (parseResp.status === "valid") {
      validationResult.error = false;
      validationResult.label = parseResp.unit.name;
      validationResult.ucumUnitCode = parseResp.unit.code;
    } else {
      if (parseResp?.suggestions) {
        let errorMsg: string = parseResp.suggestions[0]?.msg + ": ";

        parseResp.suggestions[0].units.forEach((value) => {
          errorMsg += value[0] + ", ";
        });
        validationResult.error = true;
        validationResult.helperText = errorMsg;
      } else {
        validationResult.error = true;
        validationResult.helperText = parseResp.msg[0];
      }
    }
  }
  return validationResult;
};
