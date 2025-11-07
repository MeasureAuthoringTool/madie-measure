import * as ucum from "@lhncbc/ucum-lhc";

export class ValidationResult {
  label?: string;
  helperText?: string;
  ucumUnitCode?: number;
  error: boolean;
}

// users want additional support for non ucum units
export const ADDITIONAL_UCUM_UNIT_SUPPORT = {
  years: true, // this would be a_ as a ucum unit, but not intuitive.
  year: true,
  months: true,
  month: true,
  weeks: true,
  week: true,
  days: true,
  day: true,
  hours: true,
  hour: true,
  minutes: true,
  minute: true,
  seconds: true,
  second: true,
  milliseconds: true,
  millisecond: true,
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
