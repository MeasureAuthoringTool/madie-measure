import * as Yup from "yup";
// https://hl7.org/fhir/R4/datatypes.html

// Fields can be required or not required, we need a place to house all the individual validations and a build a dynamic form validation spot

// stu references markdown regex as \s*(\S|\s)*  our matcher should look like /^\s*(\S|\s)*$/;
export const getMarkDownValidator = (required) => {
  const markdownRegex = /^\s*(\S|\s)*$/;
  const baseValidator = Yup.string().matches(
    markdownRegex,
    "Invalid markdown format"
  );
  if (required) {
    return baseValidator.required("This field is required");
  }
};

export const getIdValidator = (required) => {
  const idRegex = /^[A-Za-z0-9\-\.]{1,64}$/;
  const baseValidator = Yup.string().matches(idRegex, "Invalid ID format");
  if (required) {
    return baseValidator.required("This field is required");
  }
};

export const getStringValidator = (required) => {
  const stringRegex = /^[ \r\n\t\S]+$/;
  const baseValidator = Yup.string().matches(
    stringRegex,
    "Invalid String format"
  );
  return baseValidator.required("This field is required");
};

/*
  This object will hold all references to validations with keys for type matching up against a validation
  We can then use the lookup to see if it exists, if it does, we return the validation function, we pass in the required value attached,
  And we should get a validation that fits our object. 
*/

export const validationLookup = {
  "http://hl7.org/fhirpath/System.String": getStringValidator,
  string: getStringValidator,
  markdown: getMarkDownValidator,
  id: getIdValidator,
};

export const getValidation = (type, required) => {
  // return Yup.string().required();
  if (validationLookup[type]) {
    const validation = validationLookup[type];
    return validation(required);
  }
  return Yup.mixed();
};
