import { ElementDefinition } from "fhir/r4";
import { v4 as uuidv4 } from "uuid";
import { ResourceIdentifier } from "./models/ResourceIdentifier";
import * as Yup from "yup";
import * as _ from "lodash";

export const PRIMITIVE_DEFAULT_VALUES = {
  instant: "",
  time: "",
  boolean: false,
  date: "",
  datetime: "",
  decimal: 0,
  integer: 0,
  unsignedInt: 0,
  positiveInt: 1,
  uri: "",
  url: "",
  uuid: "",
  canonical: "",
  string: "",
  code: "",
};

export const isPrimitiveType = (typeCode: string) =>
  PRIMITIVE_DEFAULT_VALUES.hasOwnProperty(typeCode);

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

// slicenames are separated with hyphens.
// example test case
//  const r4 = modifySliceNameForReadability("us-vital-signs");
//  expect(r4).toBe("US Vital Signs");
export function modifySliceNameForReadability(sliceName) {
  let sliceSplit = sliceName.split("-");
  sliceSplit = sliceSplit.map((el) => {
    if (el === "us") {
      return "US";
    } else {
      return _.startCase(el);
    }
  });
  return sliceSplit.join(" ");
}

/**
 * Formats an attribute path into a human-friendly label for display.
 * Strips resource names, path segments, and formats the terminal attribute to Title Case.
 * For paths ending with array indices, formats the segment before the index and appends the index.
 *
 * @param {string} path - The full FHIR path (e.g., "ClaimResponse.item[0].itemSequence")
 * @returns {string} - Human-friendly label (e.g., "Item Sequence")
 *
 * Examples:
 *   "ClaimResponse.item[0].itemSequence" -> "Item Sequence" (formats final attribute)
 *   "ClaimResponse.item[0]" -> "Item[0]" (formats segment before array index)
 *   "ClaimResponse.itemSequence[0]" -> "Item Sequence[0]" (handles camelCase with index)
 *   "Patient.name.family" -> "Family"
 *   "Claim.procedure.procedureCodeableConcept" -> "Procedure Codeable Concept"
 *   "Encounter.period.start" -> "Start"
 *   "Observation.component[0].value[x]" -> "Value" (strips [x] choice type indicator)
 */
export function formatAttributeLabel(path: string): string {
  if (!path) {
    return path;
  }

  // Check if path ends with array index like "ClaimResponse.item[0]"
  const arrayIndexMatch = path.match(/\.([^\.\[]+)(\[\d+\])$/);

  if (arrayIndexMatch) {
    // Extract the segment before the array index and the index itself
    const segment = arrayIndexMatch[1];
    const index = arrayIndexMatch[2];
    // Format the segment and append the array index
    return _.startCase(segment) + index;
  }

  // Check if path has array index followed by property like "Patient.photo[0].data"
  const arrayWithPropertyMatch = path.match(/\[\d+\]\.([^\.]+)$/);

  if (arrayWithPropertyMatch) {
    // Extract just the property name after the array index
    const propertyName = arrayWithPropertyMatch[1];
    // Strip [x] suffix if present (FHIR choice type indicator)
    const strippedPropertyName = propertyName.replace(/\[x\]$/, "");
    // Format just the property name
    return _.startCase(strippedPropertyName);
  }

  // Extract the last segment after the final dot
  const lastSegment = path.split(".").pop() || path;

  // Strip [x] suffix if present (FHIR choice type indicator)
  const strippedSegment = lastSegment.replace(/\[x\]$/, "");

  // Convert to Title Case with spaces (handles camelCase and choice types)
  return _.startCase(strippedSegment);
}

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
    return `${requiredIndicator}${_.startCase(
      getLastPart(element.path)
    )} (${modifySliceNameForReadability(element.sliceName)}${index})`;
  }
  if (element.path?.endsWith("[x]") || element.id?.endsWith("[x]")) {
    // if the path ends with [x], we need to get the type code (which in the values we have here is the only type on the element even though it's a choiceType because we handled that with the naming convention in testcase editor JSON as choice[x] == choiceType where x = Type )
    return `${extractNameWithoutIndex(
      element,
      requiredIndicator,
      basePath
    )}${_.upperFirst(element.type[0].code)}`;
  }
  const pathAfterBase = element.id.substring(basePath.length + 1);
  const strippedPath = stripAllIndexes(pathAfterBase);
  const formattedLabel = formatAttributeLabel(strippedPath);
  const result = `${requiredIndicator}${formattedLabel}${index}`;
  return result;
}

// Given a selected resource, we want to filter out any extensions that are not present on the resource.
// We do this by comparing the extension urls present at the extension key. This works at top level only.
export const filterUnusedExtensionsFromElements = (
  selectedResource,
  allDisplayedElements
) => {
  const extensions = selectedResource?.bundleEntry?.resource?.extension || [];
  // now we can filter out extensions not present on the extensions variable, from the topElements.
  const filteredElements = allDisplayedElements?.filter((el) => {
    if (el.id.includes("extension:")) {
      // find the extension in the extensions array that matches el.type[0].profile[0]
      const extUrl = el.type?.[0]?.profile?.[0];
      return extensions.some((ext) => ext.url === extUrl);
    }

    return true;
  });
  return filteredElements;
};

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
    if (node.max === "*") {
      return Yup.array().of(node.validation);
    }
    return node.validation;
  }

  // Array case
  if (
    node.max === "*" &&
    children.length > 0 &&
    node.id.split(".").length > 1
  ) {
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

// remove all the falsey values from an object recursively so we have only what the user has generated.
export function removeUndefinedProperties(obj) {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Clean each item in the array recursively
    return obj
      .map((item) => removeUndefinedProperties(item))
      .filter((item) => !_.isUndefined(item));
  }

  for (let key in obj) {
    if (obj.hasOwnProperty(key) && key !== "x") {
      const value = obj[key];
      const cleanedValue = removeUndefinedProperties(value);
      if (_.isUndefined(cleanedValue)) {
        delete obj[key];
      } else {
        obj[key] = cleanedValue;
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
// This function also filters out non-extension sliced elements (id contains ':') except for extension slices (extension:xxx)
export function getTopLevelElements(
  resource: any,
  maintainSortOrder: boolean = false
) {
  const elements = [...resource?.definition?.snapshot?.element];
  const basePath = resource?.definition?.type;
  const elementsFiltered = elements?.filter(
    (e) =>
      (e.path.split(".")?.length === 2 &&
        e.id !== "Extension.extension" &&
        e.id !== "Patient.extension" &&
        // Exclude generic extension (no sliceName) - only allow sliced extensions like extension:race
        !(e.path?.endsWith(".extension") && !e.sliceName) &&
        !/\.id$/.test(e.id) &&
        e.max !== "0" &&
        // Exclude entries where the path contains these attributes or matches these element names
        ![
          ".contained",
          ".text",
          ".meta",
          ".language",
          ".implicitRules",
          "modifierExtension",
        ].some(
          (attribute) =>
            e?.path?.includes(attribute) ||
            e.path.substring(basePath?.length + 1) === attribute
        )) ||
      (e?.path?.includes("extension") && e?.id.includes(":"))
  );

  // Filter out sliced elements (id contains ':') except extension slices
  const filteredWithoutSlices = elementsFiltered.filter((e) => {
    if (e.id?.includes(":")) {
      const parts = e.id.split(":");
      const beforeColon = parts[0];

      // Keep extension slices (e.g., "Patient.extension:ethnicity")
      if (beforeColon.endsWith(".extension")) {
        return true;
      }

      // Filter out non-extension slices (e.g., "Condition.category:us-core")
      return false;
    }

    return true;
  });

  //for each elementsFiltered, if type contains more than one type, duplicate the element and restrict the type to only that type

  filteredWithoutSlices.forEach((element) => {
    if (element?.type?.length > 1) {
      element?.type?.forEach((type, index) => {
        const newElement = { ...element };
        newElement.type = [type];
        filteredWithoutSlices.push(newElement);
      });
      filteredWithoutSlices.splice(filteredWithoutSlices.indexOf(element), 1);
    }
  });
  // Sort only if maintainSortOrder is false
  if (!maintainSortOrder) {
    if (basePath) {
      filteredWithoutSlices.sort((a, b) => {
        const labelA = a.path.substring(basePath.length + 1);
        const labelB = b.path.substring(basePath.length + 1);
        return labelA.localeCompare(labelB);
      });
    } else {
      // If no basePath, sort by full path
      filteredWithoutSlices.sort((a, b) => a.path.localeCompare(b.path));
    }
  }
  // Sort elements alphabetically by their path (after the basePath, if available)
  return filteredWithoutSlices;
}

// we want to build a set of all prefixes for quick lookup
export const buildPrefixSet = (ids) => {
  const prefixSet = new Set();
  for (const id of ids) {
    if (!id) continue;
    const parts = id.split(".");
    for (let i = 1; i < parts.length; i++) {
      prefixSet.add(parts.slice(0, i).join("."));
    }
  }
  return prefixSet;
};

// should we skip a ndode that we expanded earlier?
export const shouldSkip = (id, skipPrefixes) => {
  if (!id) return false;
  for (const prefix of skipPrefixes) {
    if (id.startsWith(prefix + ".")) return true;
  }
  return false;
};

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
    .filter(
      ([key, value]) =>
        key?.startsWith(`${path}.`) &&
        !key.slice(path.length + 1).includes(".") &&
        !value?.id?.endsWith(".id")
    )
    .map(([, el]) => el);
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
  const parts = path?.split(".");
  return parts[parts?.length - 1];
}

// gets the parent path by removing last part in the path.
// e.g. QuestionerResponse.item.answer -> QuestionerResponse.item
// e.g. QuestionerResponse.item -> QuestionerResponse
export function getParentPath(path: string): string {
  const parts = path?.split(".");
  parts?.pop();
  if (parts && parts.length > 0) {
    return parts.join(".");
  }
  return null;
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

export function buildMadieResourceFromResourceIdentifier(
  resourceIdentifier: ResourceIdentifier
) {
  const id = uuidv4();
  const newEntry = {
    fullUrl: `https://madie.cms.gov/${resourceIdentifier.type}/${id}`,
    resource: {
      id,
      resourceType: resourceIdentifier.type,
    },
  };
  if (!_.isEmpty(resourceIdentifier.profile)) {
    newEntry.resource["meta"] = {
      profile: [resourceIdentifier.profile],
    };
  }
  return newEntry;
}

export function addCardinalityToElement(nextEntry, elemPath, rootDefinition) {
  if (!nextEntry?.resource[elemPath]) {
    // make it accessible to avoid a null
    nextEntry.resource[elemPath] = {};
  }
  // is it an array already?
  if (!Array.isArray(nextEntry.resource[elemPath])) {
    // make it one
    nextEntry.resource[elemPath] = [nextEntry.resource[elemPath]];
  }
  // add a new element and add default values if it's a primitive type
  nextEntry.resource[elemPath] = nextEntry.resource[elemPath].concat(
    isPrimitiveType(rootDefinition?.type?.[0]?.code)
      ? PRIMITIVE_DEFAULT_VALUES[rootDefinition.type[0].code]
      : {}
  );
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
    case "money":
    case "positiveint":
    case "time":
    case "timing":
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
    case "quantity":
    case "range":
    case "period":
      return true;
    default:
      return false;
  }
}

export function getValueSetUrl(url: string) {
  if (!url) return "";
  return url.split("|").shift();
}
