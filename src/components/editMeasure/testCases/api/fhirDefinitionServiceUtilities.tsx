import { ElementDefinition } from "fhir/r4";
import * as Yup from "yup";
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
const removeArrayIndexes = (path) => {
  return (
    path
      .split(".")
      // Remove everything after the '['
      .map((part) => part.split("[")[0])
      .join(".")
  );
};

/**
 * Strips all array indexes from a dot/bracket path string.
 *
 * @param {string} path - The path with bracket indexes.
 *   Example: "ClaimResponse.item[0].modifierExtension[23].text[1114].note"
 *
 * @returns {string} - Path with all [x] indexes nuked.
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
    (e) =>
      e.path.split(".")?.length === 2 &&
      e.id !== "Extension.extension" &&
      e.max !== "0"
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

// old helper function to map all property paths at a root. I can't remember why this didn't work. Probably a skill issue.
// export function getAllPropertyPaths(obj, parentPath = "") {
//   const entries = [];

//   if (typeof obj === "object" && obj !== null) {
//     if (Array.isArray(obj)) {
//       obj.forEach((value, index) => {
//         const currentPath = `${parentPath}[${index}]`;
//         entries.push(...getAllPropertyPaths(value, currentPath));
//       });
//     } else {
//       Object.entries(obj).forEach(([key, value]) => {
//         const currentPath = parentPath ? `${parentPath}.${key}` : key;
//         entries.push(...getAllPropertyPaths(value, currentPath));
//       });
//     }
//   } else {
//     entries.push([parentPath, obj]);
//   }

//   return entries;
// }
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

/**
 * Recursively build Yup validation schema object from initialEntries and formInfo
 * Early implementation. This failed to work right.
 * @param {Object} initialEntries - The initial form values
 * @param {Object} formInfo - The form metadata with Yup validators
 * @param {String} resourceType - Top-level resource key (like 'Patient')
 * @param {String} parentPath - current path while traversing
 * @returns {Object} - Object shaped for Yup.object().shape()
 */
// export function buildValidationSchema(
//   initialEntries,
//   formInfo,
//   resourceType,
//   parentPath = ""
// ) {
//   const schema = {};

//   Object.entries(initialEntries).forEach(([key, value]) => {
//     const currentPath = parentPath ? `${parentPath}.${key}` : key;

//     if (Array.isArray(value)) {
//       const itemSchema = value.length
//         ? buildValidationSchema(
//             value[0],
//             formInfo,
//             resourceType,
//             `${currentPath}[0]`
//           )
//         : {}; // fallback if empty

//       schema[key] = Yup.array().of(Yup.object().shape(itemSchema));
//     } else if (typeof value === "object" && value !== null) {
//       schema[key] = Yup.object().shape(
//         buildValidationSchema(value, formInfo, resourceType, currentPath)
//       );
//     } else {
//       // Leaf value
//       const fullPath = `${resourceType}.${currentPath}`;
//       const normalizedPath = fullPath.replace(/\[\d+\]/g, ""); // remove [index] from paths so we can do a lookup

//       const formMeta = formInfo[normalizedPath];
//       if (formMeta?.validation) {
//         schema[key] = formMeta.validation;
//       }
//     }
//   });

//   return schema;
// }

/**
 * Inserts an array index into a FHIR path string at the correct position
 * based on the pathBefore (the path of the multiple cardinality element).
 *
 * @param {string} fullPath - The complete path to the property (e.g. "Patient.name.suffix")
 * @param {string} pathBefore - The path to the multiple cardinality property (e.g. "Patient.name")
 * @param {number} index - The index to insert (e.g. 0)
 * @returns {string} The updated path with the index inserted (e.g. "Patient.name[0].suffix")
 */
export function insertIndexIntoPath(fullPath, pathBefore, index) {
  const fullPathSegments = fullPath.split(".");
  const pathBeforeSegments = pathBefore.split(".");

  const insertIndexAt = pathBeforeSegments.length - 1;

  const pathWithIndex = [...fullPathSegments];
  pathWithIndex[insertIndexAt] = `${pathWithIndex[insertIndexAt]}[${index}]`;

  return pathWithIndex.join(".");
}
// given a path, find out if there's a suffix in it that ends in .[somenumber] and return it.
// Tool in figuring out cardinality elements and manipulating them.
// Only gets the index if it's terminated with an index
// Patient.name[1] -> [1]
// Patient.name[3].someOtherProperty[4] -> 4
// Patient.name[3].text[4].somethingElse -> null
export function getIndexFromPath(path) {
  const match = path.match(/(\[\d+\])$/);
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
// function mergePathsWithIndex(pathWithIndex, pathToAppend) {
//   const partsWithIndex = pathWithIndex.split(".");
//   const partsToAppend = pathToAppend.split(".");

//   const result = partsToAppend.map((part, i) => {
//     if (partsWithIndex[i] && partsWithIndex[i].match(/\[\d+\]$/)) {
//       return partsWithIndex[i];
//     }
//     return part;
//   });

//   // if pathWithIndex was longer (like Patient.name[0].something), preserve extra trailing parts
//   if (partsWithIndex.length > partsToAppend.length) {
//     result.push(...partsWithIndex.slice(partsToAppend.length));
//   }

//   return result.join(".");
// }

// We need to update labels based weather or not the parent has multiple cardinality as well as if the child is multiple cardinality
export function getChildLabelForCardinality(rootDefinition, i, itemId, index) {
  // if ()
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
    case "Coding":
    case "Extension":
    case "Reference":
      return true;
    default:
      return false;
  }
}
