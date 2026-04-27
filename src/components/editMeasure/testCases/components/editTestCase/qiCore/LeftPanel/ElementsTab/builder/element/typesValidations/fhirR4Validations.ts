import * as Yup from "yup";
import {
  POSITIVEINT_MINIMUM,
  UNSIGNED_MINIMUM,
  SIGNED_MINIMUM,
  INTEGER_MAXIMUM,
} from "./FhirNumbers";
import { validate } from "../../../../../../../common/quantityInput/validate";
import { notEmptyHtml } from "../../../../../../../../../../../validations/ReadOnlyValidator";

export const INSTANT_REGEX =
  /([0-9]([0-9]([0-9][1-9]|[1-9]0)|[1-9]00)|[1-9]000)-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])T([01][0-9]|2[0-3]):[0-5][0-9]:([0-5][0-9]|60)(\.[0-9]{1,9})?(Z|(\+|-)((0[0-9]|1[0-3]):[0-5][0-9]|14:00))$/;

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

// Any positive integer in the range 1..2,147,483,647
export const getPositiveIntegerValidator = (required) => {
  const integerReg = /^[0-9]+$/;
  const baseValidator = Yup.string()
    .nullable()
    .test(
      "range",
      `Only the following numerical range of values are allowed: [${POSITIVEINT_MINIMUM} to ${INTEGER_MAXIMUM}]`,
      (val) => {
        if (val && val.length > 0) {
          if (!integerReg.test(val)) {
            return false;
          }
          const num = Number(val);
          return num >= POSITIVEINT_MINIMUM && num <= INTEGER_MAXIMUM;
        }
        return true;
      }
    );

  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

// Any non-negative integer in the range 0..2,147,483,647
export const getUnsignedIntegerValidator = (required) => {
  const integerReg = /^(0|[1-9][0-9]*)$/;
  const baseValidator = Yup.string()
    .nullable()
    .test(
      "range",
      `Only the following numerical range of values are allowed: [0 to ${INTEGER_MAXIMUM}]`,
      (val) => {
        if (val && val.length > 0) {
          if (!integerReg.test(val)) {
            return false;
          }
          const num = Number(val);
          return num >= 0 && num <= INTEGER_MAXIMUM;
        }
        return true;
      }
    );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

// Any integer in the range -2,147,483,648..2,147,483,647
export const getSignedIntegerValidator = (required) => {
  const integerReg = /[0]|[-+]?[1-9][0-9]*/;
  const baseValidator = Yup.string()
    .nullable()
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
  const uriRegex: RegExp = /\S*/;
  const urnRegex: RegExp = /^urn:oid:[0-2](\.(0|[1-9][0-9]*))+$/;
  const baseValidator = Yup.string()
    .test(
      "urn-specific-test",
      "Invalid OID Format (example format: urn:oid:1.2.36.146.595.217.0.1 ).",
      function (value) {
        if (value && value.startsWith("urn:oid")) {
          return urnRegex.test(value);
        } else {
          return true;
        }
      }
    )
    .matches(uriRegex, "Invalid Uri format");

  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getBinaryValidator = (required) => {
  const binaryRegex = /(\s*([0-9a-zA-Z\+\=]){4}\s*)+/;
  const baseValidator = Yup.string().matches(
    binaryRegex,
    "Invalid Binary format"
  );

  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getDateTimeValidator = (required) => {
  const dateTimeRegex =
    /^(?:\d{4}|\d{4}-(?:0[1-9]|1[0-2])|\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])|\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:0[0-9]|1[0-4]):[0-5]\d))$/;
  const baseValidator = Yup.string().test(
    "matches-regex",
    "Invalid DateTime format",
    function (value) {
      if (!value) return true;
      return dateTimeRegex.test(value);
    }
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getDateValidator = (required) => {
  const dateRegex =
    /^(?:\d{4}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?)$/;
  const baseValidator = Yup.string().test(
    "matches-regex",
    "Invalid Date format",
    function (value) {
      if (!value) return true;
      return dateRegex.test(value);
    }
  );
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
  const baseValidator = Yup.string().test(
    "matches-regex",
    "Invalid instant format",
    function (value) {
      if (!value) return true;
      return INSTANT_REGEX.test(value);
    }
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getQuantityValidator = (required: boolean) => {
  const codeSchema = Yup.string()
    .when([], {
      is: () => required,
      then: (s) => s.required("Code is required"),
      otherwise: (s) => s.notRequired(),
    })
    .test("validate-quantity", "Invalid quantity unit", (value) => {
      if (!value) return !required; // allow empty when not required
      const res = validate(value); // your UCUM validator
      return !res?.error;
    });

  // If you validate the whole Quantity, do it like this:
  const quantitySchema = Yup.object({
    value: Yup.number().when([], {
      is: () => required,
      then: (s) =>
        s.typeError("Value must be a number").required("Value is required"),
      otherwise: (s) => s.notRequired(),
    }),
    system: Yup.string()
      .default("http://unitsofmeasure.org")
      .when([], {
        is: () => required,
        then: (s) => s.required("System is required"),
        otherwise: (s) => s.notRequired(),
      }),
    code: codeSchema,
    unit: Yup.string().notRequired(),
  }).nullable();

  return required
    ? quantitySchema.required("This field is required")
    : quantitySchema;
};

/*
  This object will hold all references to validations with keys for type matching up against a validation
  We can then use the lookup to see if it exists, if it does, we return the validation function, we pass in the required value attached,
  And we should get a validation that fits our object. 
*/

export const getCodingValidator = (required) => {
  const baseValidator = Yup.object()
    .nullable()
    .test(
      "coding-complete",
      "Both Code System and Code are required",
      (val: any) => {
        if (!val) return !required;
        const hasSystem = !!val.system;
        const hasCode = !!val.code;
        // Reject if system or code key exists but value is incomplete
        if ("system" in val || "code" in val) {
          return hasSystem && hasCode;
        }
        return true;
      }
    );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const getCodeableConceptValidator = (required) => {
  const baseValidator = Yup.object()
    .nullable()
    .test(
      "codeable-concept-complete",
      "Both Code System and Code are required for each coding",
      (val: any) => {
        if (!val) return !required;
        const codings = val.coding;
        if (!Array.isArray(codings)) return true;
        return codings.every((coding) => {
          if (!coding) return true;
          if ("system" in coding || "code" in coding) {
            return !!coding.system && !!coding.code;
          }
          return true;
        });
      }
    );
  if (required) {
    return baseValidator.required("This field is required");
  }
  return baseValidator;
};

export const validationLookup = {
  "http://hl7.org/fhirpath/System.Integer": getSignedIntegerValidator,
  integer: getSignedIntegerValidator,
  unsignedInt: getUnsignedIntegerValidator,
  positiveInt: getPositiveIntegerValidator,
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
  base64Binary: getBinaryValidator,
  Quantity: getQuantityValidator,
  Coding: getCodingValidator,
  CodeableConcept: getCodeableConceptValidator,
};

export const getValidation = (type, required, label?) => {
  let validation;
  if (
    (type === "http://hl7.org/fhirpath/System.String" || type === "string") &&
    label === "id"
  ) {
    validation = validationLookup[label];

    return validation(required);
  } else if (validationLookup[type]) {
    validation = validationLookup[type];
    return validation(required);
  }

  return Yup.mixed();
};
