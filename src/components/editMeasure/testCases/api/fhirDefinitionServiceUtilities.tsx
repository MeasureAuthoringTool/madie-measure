import { ElementDefinition } from "fhir/r4";

/**
 * Prepares the element name to be displayed for tab labels
 * for sliced elements- it will be sliceName. e.g. Patient.extension:race results into race
 * for regular element- it will be the path of an element. e.g. Patient.gender results gender
 */
export function getElementName(element: ElementDefinition, basePath: string) {
  const requiredIndicator = element.min > 0 ? " *" : "";
  if (element.sliceName) {
    return `${element.sliceName}${requiredIndicator}`;
  }
  return `${element.path.substring(basePath.length + 1)}${requiredIndicator}`;
}

// given an object that we want to copy to
// a path that looks like "Claimresponse.item.something"
// and a value that can be anything
// We're going to go and break the apart the paths and then individually add them to the object
export function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let currentObj = obj;
  // start nested structure
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      currentObj[key] = value;
    } else {
      currentObj[key] = currentObj[key] || {};
      currentObj = currentObj[key];
    }
  });
}

// we want to get all the displayed elements, and then compare them to formik, to make sure we have the first two paths so we know we should add them to the form
export function getDisplayedElementsTree(uniqueElements) {
  const displayedElementPaths = {};
  const setNestedValue = (obj, path, value) => {
    const keys = path.split(".");
    let currentObj = obj;
    // start nested structure
    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        currentObj[key] = value;
      } else {
        currentObj[key] = currentObj[key] ? { ...currentObj[key] } : {};
        currentObj = currentObj[key];
      }
    });
  };
  uniqueElements.forEach(({ path }) => {
    if (path) {
      setNestedValue(displayedElementPaths, path, true);
    }
  });
  return { ...displayedElementPaths };
}

// remove all the falsey values from an object recursively so we have only what the user has generated.
export function removeUndefinedAndEmptyObjects(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      // Remove the key if the value is undefined
      if (value === undefined) {
        delete obj[key];
      } else if (typeof value === "object") {
        // Recursively remove undefined values and empty objects
        removeUndefinedAndEmptyObjects(value);
        if (Object.keys(value).length === 0) {
          delete obj[key];
        }
      }
    }
  }
  return obj;
}

export function getBasePath(resource: any): string {
  return resource?.definition?.snapshot?.element?.[0]?.path;
}

// For ClaimResponse.item.adjudication
// we want to get only the elements at the top of the tree for the render
export function getTopLevelElements(resource: any) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter(
    (e) => e.path.split(".")?.length === 2 && e.max !== "0"
  );
}
// find out who needs to be required on formik validation
export function getRequiredElements(resource: any) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter((e) => e.min > 0 && e.path.split(".")?.length === 2);
}

// remove the base path of a string like ClaimResponse.item in order to use it as an accessor key.
export function stripResourcePath(resourcePath, elementPath) {
  return elementPath.substring(`${resourcePath}.`.length);
}

/**
 * In the provided list of FHIR resource's elements,
 * return the list of elements that is not the original path but all its child attributes.
 * Ex: path = claimResponse.item then return all its child elements such as claimResponse.item.id, claimResponse.item.detail etc.
 * @param resource a FHIR resource ex: ClaimResponse
 * @param path path to a resource or its child attributes ex: claimResponse.status
 */
export function getAllChildren(resource, path) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter(
    (e) => e.path !== path && e.path.startsWith(`${path}.`)
  );
}

export function updateChildrenPaths(structureDefinition, elements) {
  // these childType defs need to have their id and path manipulated to play nice.
  // Instead of Procedure.Annotation.text, it should be Procedure.note.text
  const currentPath = structureDefinition?.id;
  const updatedElements = elements.map((el) => {
    let targetPath = el.id.split(".");
    targetPath.shift();
    targetPath.unshift(currentPath);
    targetPath = targetPath.join(".");
    el.id = targetPath;
    el.path = targetPath;
    return el;
  });
  return updatedElements;
}

// This switch is a check to see weather we have the means to render an input for a given fhir type. needs to be udpated with all validations.
export function isComponentDataType(datatype) {
  switch (datatype) {
    case "boolean":
    case "date":
    case "dateTime":
    case "http://hl7.org/fhirpath/System.DateTime":
    case "decimal":
    case "id":
    case "instant":
    case "integer":
    case "integer64":
    case "positiveInt":
    case "time":
    case "unsignedInt":
    case "uri":
    case "url":
    case "uuid":
    case "canonical":
    case "string":
    case "markdown":
    case "http://hl7.org/fhirpath/System.String":
    case "code":
    case "Extension":
    case "Reference":
      return true;
    default:
      return false;
  }
}
