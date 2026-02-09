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

export function getLastSegmentCapitalized(input: string): string {
  if (!input) return "";
  const segments = input.split(".");
  const last = segments[segments.length - 1];
  if (!last) return "";
  return last.charAt(0).toUpperCase() + last.slice(1);
}
