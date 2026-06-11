// Helper function to get the default/empty value for a given type
export const getEmptyValueForType = (type: string) => {
  switch (type) {
    // Primitive string types - return empty string
    case "string":
    case "http://hl7.org/fhirpath/System.String":
    case "base64Binary":
    case "markdown":
    case "dateTime":
    case "http://hl7.org/fhirpath/System.DateTime":
    case "date":
    case "time":
    case "http://hl7.org/fhir/R4/datatypes.html#time":
    case "instant":
    case "http://hl7.org/fhir/R4/datatypes.html#instant":
    case "uri":
    case "url":
    case "canonical":
    case "oid":
    case "uuid":
    case "id":
    case "code":
    case "decimal":
    case "integer":
    case "http://hl7.org/fhirpath/System.Integer":
    case "positiveInt":
    case "unsignedInt":
      return "";

    // Boolean type - return null
    case "boolean":
    case "http://hl7.org/fhirpath/System.Boolean":
      return null;

    // Complex/Object types - return empty object
    default:
      return {};
  }
};

// True if value contains any user-entered data (deep check).
export const hasNonEmptyValue = (value: any): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim() !== "";
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some((entry) => hasNonEmptyValue(entry));
  }
  if (typeof value === "object") {
    return Object.values(value).some((entry) => hasNonEmptyValue(entry));
  }
  return Boolean(value);
};
