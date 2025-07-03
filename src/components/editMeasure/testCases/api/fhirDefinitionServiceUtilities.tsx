import { ElementDefinition } from "fhir/r4";
import * as Yup from "yup";
import * as _ from "lodash";

/**
 * Prepares the element name to be displayed for tab labels
 * for sliced elements- it will be sliceName. e.g. Patient.extension:race results into race
 * for regular element- it will be the path of an element. e.g. Patient.gender results gender
 * Needs to also consider the formik values at that point.
 * formik.values cases
 * Patient.name = falsey: -> Name
 * Patient.name[0] = values at name: [name, name]: -> Name 1
 * Patient.name[1] = values at name: [name, name]: -> Name 2
 *  Need to check cardinality, then check if array and Up the index and display.
 */
export const formatChoiceType = (
  element: ElementDefinition,
  basePath: string = "",
  required: string = ""
) => {
  if (_.includes(element.id, "[x]")) {
    return `${extractNameWithoutIndex(
      element,
      required,
      basePath
    )}${_.upperFirst(element.type[0].code)}`;
  }
  return element.id;
};

export function getElementName(
  element: ElementDefinition,
  basePath: string,
  formikValue: any
) {
  const requiredIndicator = element.min > 0 ? " *" : "";
  element.type = element.type || [];

  let index = "";
  const retrievedIndex = getIndexFromPathWithoutBrackets(element.id);
  if (Array.isArray(formikValue)) {
    if (formikValue.length > 1) {
      if (retrievedIndex) {
        if (Number(retrievedIndex) > -1) {
          index = ` ${Number(retrievedIndex) + 1} `;
        }
      }
    }
  }
  if (element.sliceName) {
    return `${requiredIndicator}${element.sliceName}${index}`;
  }
  if (element.path?.endsWith("[x]") || element.id?.endsWith("[x]")) {
    // if the path ends with [x], we need to get the type code (which in the values we have here is the only type on the element even though it's a choiceType because we handled that with the naming convention in testcase editor JSON as choice[x] == choiceType where x = Type )
    return `${extractNameWithoutIndex(
      element,
      requiredIndicator,
      basePath
    )}${_.upperFirst(element.type[0].code)}`;
  }
  const result = `${requiredIndicator}${stripAllIndexes(
    element.id.substring(basePath.length + 1)
  )}${index}`;
  return result;
}

// given an object that we want to copy to
// a path that looks like "Claimresponse.item.something"
// and a value that can be anything
// We're going to go and break the apart the paths and then individually add them to the object
const removeArrayIndexes = (path) => {
  return (
    path
      .split(".")
      // Remove everything after the '['
      .map((part) => part.split("[")[0])
      .join(".")
  );
};

export function extractNameWithoutIndex(
  element: ElementDefinition,
  requiredIndicator: string = "",
  basePath: string = ""
) {
  if (basePath) {
    return `${requiredIndicator}${stripAllIndexes(
      element.id.substring(basePath.length + 1, element.id?.indexOf("[x]"))
    )}`;
  } else {
    return `${requiredIndicator}${stripAllIndexes(
      element.id.substring(0, element.id?.indexOf("[x]"))
    )}`;
  }
}

/**
 * Strips all array indexes from a dot/bracket path string.
 *
 * @param {string} path - The path with bracket indexes.
 *   Example: "ClaimResponse.item[0].modifierExtension[23].text[1114].note"
 *
 * @returns {string} - Path with all [x] indexes removed.
 *   Example: "ClaimResponse.item.modifierExtension.text.note"
 */
export function stripAllIndexes(path) {
  return path.replace(/\[\d+\]/g, "");
}

export function getRequired(requiredFields, path) {
  const cleanedPath = removeArrayIndexes(path);
  return requiredFields[cleanedPath];
}

// Helper to deeply set a value at a dot/bracket path
export function setNestedValue(obj, path, value) {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current = obj;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      current[part] = value;
    } else {
      if (!current[part]) {
        current[part] = isNaN(parts[index + 1]) ? {} : [];
      }
      current = current[part];
    }
  });
}
// get first children of node
export const getChildren = (formInfo, parentPath) => {
  const parentDepth = parentPath.split(".").length;
  return Object.entries(formInfo).filter(([key]) => {
    const parts = key.split(".");
    return key.startsWith(parentPath + ".") && parts.length === parentDepth + 1;
  });
};

export function recursiveAddYupObject(schemaObject) {
  for (const key in schemaObject) {
    const value = schemaObject[key];
    if (!Yup.isSchema(value) && typeof value === "object") {
      recursiveAddYupObject(value);
      schemaObject[key] = Yup.object().shape(value);
    }
  }
  return schemaObject;
}
// had to remake schema builder again.
export function buildSchemaRecursive(formInfo, path) {
  // it previously failed when running into a case where a schema was already at object property for Encounter
  const node = formInfo[path];

  if (!node) return Yup.mixed();

  const children = getChildren(formInfo, path);
  // assume this returns an array of paths like "Patient.name[0].given" , {}

  // Case has a validation
  if (node.validation && children.length === 0) {
    return node.validation;
  }

  // Array case
  if (node.max === "*" && children.length > 0) {
    const shape = {};
    children.forEach(([id]) => {
      const lastKey = id.split(".").pop();
      shape[lastKey] = buildSchemaRecursive(formInfo, id);
    });

    return Yup.array().of(Yup.object().shape(shape));
  }

  // objects with children
  if (children.length > 0) {
    const shape = {};
    children.forEach(([id]) => {
      const lastKey = id.split(".").pop();
      shape[lastKey] = buildSchemaRecursive(formInfo, id);
    });

    return Yup.object().shape(shape);
  }

  // Fallback
  return Yup.mixed();
}

// we want to build out every end of the tree before making yup object shapes since they're immutable.
export function buildFullValidationSchema(formInfo, rootPath: string = "") {
  const validationSchemaObject = buildSchemaRecursive(formInfo, rootPath);
  return Yup.object().shape({
    [rootPath]: validationSchemaObject,
  });
}

export function getNestedProperty(obj, path) {
  if (!path) return undefined;
  const keys = path.match(/([^[.\]]+)/g); // matches words between dots and brackets
  return keys?.reduce((current, key) => current && current[key], obj);
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
    if (obj.hasOwnProperty(key) && key !== "x") {
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
  const elementsFiltered = elements?.filter(
    (e) =>
      e.path.split(".")?.length === 2 &&
      e.id !== "Extension.extension" &&
      e.max !== "0"
  );
  //for each elementsFiltered, if type contains more than one type, duplicate the element and restrict the type to only that type

  elementsFiltered.forEach((element) => {
    if (element?.type?.length > 1) {
      element?.type?.forEach((type, index) => {
        const newElement = { ...element };
        newElement.type = [type];
        elementsFiltered.push(newElement);
      });
      elementsFiltered.splice(elementsFiltered.indexOf(element), 1);
    }
  });
  return elementsFiltered;
}
// find out who needs to be required on formik validation
export function getRequiredElements(resource: any) {
  const elements = [...resource?.definition?.snapshot?.element];
  return elements?.filter((e) => e.min > 0 && e.path.split(".")?.length === 2);
}

// remove the base path of a string like ClaimResponse.item in order to use it as an accessor key.
// EX (Patient, Patient.name) => returns name;
export function stripResourcePath(resourcePath, elementPath: string): string {
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

// given a path, access formInfo to get the parent. Patient.name -> Patient
export function getParentDefinition(path, formInfo) {
  const lastDotIndex = path.lastIndexOf(".");
  if (lastDotIndex === -1) return undefined; // No parent, it's a root-level node
  const parentPath = path.slice(0, lastDotIndex);
  const found = formInfo.find(([key]) => key === parentPath);
  return found?.[1];
}

// given a path, and formInfo, get all property paths one .[property] deep Patient.name -> Patient.name.given, Patient.name.family
export function getFirstChildren(path, formInfo) {
  return formInfo
    .filter((el) => {
      if (!el[0]?.startsWith(path + ".")) return false;
      const subPath = el[0].slice(path.length + 1);
      return !subPath.includes(".");
    })
    .map((el) => el[1]);
}
// Access from formInfo when array
export function stripArrayIndices(path) {
  return path.replace(/\[\d+\]/g, "");
}

// a way to figure out the parent path for a lookup.
// Early failed implementation because this created a render nightmare. Should never look up parent from child.
export function removeLastPathSegment(path) {
  const parts = path.split(".");
  parts.pop();
  return parts.join(".");
}
// Use this to access stuff from form info when object
export function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}
// function to get map all the property paths to values
export function mapElementsByPath(structureDefinition) {
  const elements = structureDefinition?.definition?.snapshot?.element || [];

  return elements.reduce((acc, element) => {
    acc[element.path] = element;
    return acc;
  }, {});
}

// generate a map of { label: [label] required: true/fales} so we don't need to prop drill poor component into the ground any worse than it is.
export function mapElementsRequired(structureDefinition) {
  const elements = structureDefinition?.definition?.snapshot?.element || [];

  return elements.reduce((acc, element) => {
    acc[element.path] = element.min > 0;
    return acc;
  }, {});
}

// given a path, find out if there's a suffix in it that ends in .[somenumber] and return it.
// Tool in figuring out cardinality elements and manipulating them.
// Only gets the index if it's terminated with an index
// Patient.name[1] -> [1]
// Patient.name[3].someOtherProperty[4] -> 4
// Patient.name[3].text[4].somethingElse -> null
export function getIndexFromPath(path) {
  const match = path.match(/(\[\d+\])$/);
  const result = match ? match[1] : null;
  return result;
}

// gets everything after the last . in a path.
export function getLastPart(path: string): string {
  const parts = path.split(".");
  return parts[parts.length - 1];
}

// removes all indexes from path
export function removeIndicesFromPath(path) {
  return path.replace(/\[\d+\]/g, "");
}

// same thing but we don't want the brackets.
export function getIndexFromPathWithoutBrackets(path) {
  const match = path.match(/\[(\d+)\]$/);
  return match ? match[1] : null;
}
/**
 * Takes a path with array indexes in it and another path without them,
 * and smashes the last index from the first one back into the right spot
 * in the second one.
 *
 * @param {string} pathWithIndex - The one that’s got [0], [1], etc. in it.
 *   Example: "Patient.name[3].text"
 *
 * @param {string} pathWithoutIndex - The cleaned one, no indexes.
 *   Example: "Patient.name.text"
 *
 * @returns {string} Path with the last index put back where it belongs.
 *   Example: "Patient.name[3].text"
 *
 * If there’s no index in the first one, it just concats the two together with a dot.
 */
export function mergePathWithIndex(pathWithIndex, pathWithoutIndex) {
  // Find all index matches in the path
  const indexMatches = pathWithIndex.match(/\[(\d+)\]/g);

  if (indexMatches) {
    // If there's at least one index match, take the last one
    const lastIndex = indexMatches[indexMatches.length - 1];
    const basePath = pathWithIndex.replace(lastIndex, ""); // Remove the last index part from the path

    // Merge the last index with the new path
    if (pathWithoutIndex.startsWith(basePath)) {
      return `${basePath}${lastIndex}.${pathWithoutIndex.replace(
        basePath + ".",
        ""
      )}`;
    } else {
      return `${basePath}${lastIndex}.${pathWithoutIndex}`;
    }
  }

  return pathWithIndex + "." + pathWithoutIndex; // Default fallback if no index
}

export function addCardinalityToElement(nextEntry, elemPath) {
  if (!nextEntry.resource[elemPath]) {
    // make it accessible to avoid a null
    nextEntry.resource[elemPath] = {};
  }
  // is it an array already?
  if (!Array.isArray(nextEntry.resource[elemPath])) {
    // make it one
    nextEntry.resource[elemPath] = [nextEntry.resource[elemPath]];
  }
  // add a new element;
  nextEntry.resource[elemPath] = nextEntry.resource[elemPath].concat({}); // add an empty object.
  return nextEntry;
}
// We need to update labels based weather or not the parent has multiple cardinality as well as if the child is multiple cardinality

// This switch is a check to see weather we have the means to render an input for a given fhir type. needs to be udpated with all validations.
export function isComponentDataType(datatype) {
  //adding a toLower to the datatype to allow this to handle choiceType when
  // the types have already been modified by a _toLowerCase function.
  switch (_.toLower(datatype)) {
    case "boolean":
    case "base64binary":
    case "date":
    case "datetime":
    case "http://hl7.org/fhirpath/system.datetime":
    case "decimal":
    case "id":
    case "instant":
    case "integer":
    case "integer64":
    case "positiveint":
    case "time":
    case "unsignedint":
    case "uri":
    case "url":
    case "uuid":
    case "canonical":
    case "string":
    case "markdown":
    case "http://hl7.org/fhirpath/system.string":
    case "code":
    case "coding":
    case "codeableconcept":
    case "extension":
    case "reference":
      return true;
    default:
      return false;
  }
}

export function getValueSetUrl(url: string) {
  if (!url) return "";
  return url.split("|").shift();
}
