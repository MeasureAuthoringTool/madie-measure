import * as Yup from "yup";
// https://hl7.org/fhir/R4/datatypes.html

// Fields can be required or not required, we need a place to house all the individual validations and a build a dynamic form validation spot
export const getMarkDownValidator = (required) => {
  const markdownRegex = /^\s*(\S|\s)*$/;
  const baseValidator = Yup.string().matches(markdownRegex, "Invalid markdown format");
  if (required) {
    return baseValidator.required("This field is required");
  }
}



/*
  This object will hold all our possible validations with keys for type matching up against a validation
  We can then use the lookup to see if it exists, if it does, we return the validation function, we pass in the required value attached,
  And we should get a validation that fits our object. 
*/

export const validationLookup = {
  markdown: getMarkDownValidator
}



export const getValidation = (type) => {
  return validationLookup[type];
}
