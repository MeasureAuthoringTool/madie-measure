import * as Yup from "yup";
import {
  POSITIVEINT_MINIMUM,
  UNSIGNED_MINIMUM,
  SIGNED_MINIMUM,
  INTEGER_MAXIMUM,
} from "./FhirNumbers";
// https://hl7.org/fhir/R4/datatypes.html

// Fields can be required or not required, we need a place to house all the individual validations and a build a dynamic form validation spot

// stu references markdown regex as \s*(\S|\s)*  our matcher should look like /^\s*(\S|\s)*$/;
export const getMarkDownValidator = (required) => {
  // const markdownRegex = /^\s*(\S|\s)*$/; //this is hl7 regex, but it allows required fields to be empty.
  const stringRegex = /^[ \r\n\t\S]+$/;
  const baseValidator = Yup.string().matches(
    stringRegex,
    "Invalid markdown format"
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getIdValidator = (required) => {
  const idRegex = /^[A-Za-z0-9\-\.]{1,64}$/;
  const baseValidator = Yup.string().matches(idRegex, "Invalid ID format");
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getBooleanValidator = (required) => {
  const booleanReg = /^true$|^false$/;
  const baseValidator = Yup.string().matches(
    booleanReg,
    "Invalid Boolean format"
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getPositiveIntegerValidator = (required) => {
  const integerReg = /[0]|[-+]?[1-9][0-9]*/;
  const baseValidator = Yup.string()
    .matches(integerReg, "Invalid Integer format")
    .test(
      "len",
      `Positive integer range is [${POSITIVEINT_MINIMUM} to ${INTEGER_MAXIMUM}]`,
      (val) => {
        if (val && val.length > 0) {
          return (
            Number(val) >= POSITIVEINT_MINIMUM && Number(val) <= INTEGER_MAXIMUM
          );
        } else {
          return true;
        }
      }
    );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};
export const getUnsignedIntegerValidator = (required) => {
  const integerReg = /[0]|[-+]?[1-9][0-9]*/;
  const baseValidator = Yup.string()
    .matches(integerReg, "Invalid Integer format")
    .test(
      "len",
      `Unsigned integer range is [${UNSIGNED_MINIMUM} to ${INTEGER_MAXIMUM}]`,
      (val) => {
        if (val && val.length) {
          return (
            val.length >= UNSIGNED_MINIMUM && val.length <= INTEGER_MAXIMUM
          );
        }
        return true;
      }
    );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getSignedIntegerValidator = (required) => {
  const integerReg = /[0]|[-+]?[1-9][0-9]*/;
  const baseValidator = Yup.string()
    .matches(integerReg, "Invalid Integer format")
    .test(
      "len",
      `Signed integer range is [${SIGNED_MINIMUM} to ${INTEGER_MAXIMUM}]`,
      (val) => {
        if (val && val.length) {
          return val.length >= SIGNED_MINIMUM && val.length <= INTEGER_MAXIMUM;
        }
        return true;
      }
    );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getStringValidator = (required) => {
  const stringRegex = /^[ \r\n\t\S]+$/;
  const baseValidator = Yup.string().matches(
    stringRegex,
    "Invalid String format"
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getDecimalValidator = (required) => {
  const decimalRegex = /^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/;
  const baseValidator = Yup.string().matches(
    decimalRegex,
    "Invalid Decimal format"
  );

  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getUriValidator = (required) => {
  const uriRegex = /\S*/;
  const baseValidator = Yup.string().matches(uriRegex, "Invalid Uri format");

  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getDateTimeValidator = (required) => {
  const dateTimeRegex =
    /^(?:\d{4}|\d{4}\/(?:0[1-9]|1[0-2])|\d{4}\/(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])|\d{4}\/(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:0[0-9]|1[0-4]):[0-5]\d))$/;
  const baseValidator = Yup.string().matches(
    dateTimeRegex,
    "Invalid DateTime format"
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getDateValidator = (required) => {
  // Regex breakdown:
  const dateRegex =
    /^(?:\d{4}(?:\/(?:0[1-9]|1[0-2])(?:\/(?:0[1-9]|[12]\d|3[01]))?)?)$/;
  const baseValidator = Yup.string().matches(dateRegex, "Invalid Date format");

  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getTimeValidator = (required) => {
  const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
  const baseValidator = Yup.string().matches(timeRegex, "Invalid Time format");
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getInstantValidator = (required: boolean) => {
  const regex =
    /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]{1,9})?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))/;
  const baseValidator = Yup.string().matches(regex, "Invalid Instant format");
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

/*
  This object will hold all references to validations with keys for type matching up against a validation
  We can then use the lookup to see if it exists, if it does, we return the validation function, we pass in the required value attached,
  And we should get a validation that fits our object. 
*/

export const validationLookup = {
  "http://hl7.org/fhirpath/System.Integer": getSignedIntegerValidator,
  positiveInt: getPositiveIntegerValidator,
  unsignedInt: getUnsignedIntegerValidator,
  boolean: getBooleanValidator,
  "http://hl7.org/fhirpath/System.String": getStringValidator,
  string: getStringValidator,
  markdown: getMarkDownValidator,
  id: getIdValidator,
  uri: getUriValidator,
  decimal: getDecimalValidator,
  dateTime: getDateTimeValidator,
  date: getDateValidator,
  time: getTimeValidator,
  instant: getInstantValidator,
};

export const getValidation = (type, required) => {
  if (validationLookup[type]) {
    const validation = validationLookup[type];
    return validation(required);
  }
  return Yup.mixed();
};
