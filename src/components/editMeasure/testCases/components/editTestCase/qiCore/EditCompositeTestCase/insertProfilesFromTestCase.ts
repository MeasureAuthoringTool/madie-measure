import { v4 as uuidv4 } from "uuid";
import _ from "lodash";

export interface FhirResource {
  resourceType?: string;
  id?: string;
  [key: string]: any;
}

export interface BundleEntry {
  fullUrl?: string;
  resource?: FhirResource;
  [key: string]: any;
}

export interface FhirBundle {
  resourceType: string;
  type?: string;
  id?: string;
  entry?: BundleEntry[];
  [key: string]: any;
}

const PATIENT = "Patient";
const FHIR_REFERENCE_PATTERN = /^[A-Za-z][A-Za-z0-9]+\/[A-Za-z0-9\-.]{1,}$/;

const buildReferenceKey = (resourceType: string, id: string): string =>
  `${resourceType}/${id}`;

const safeParseBundle = (json?: string): FhirBundle | null => {
  if (!json?.trim()) return null;

  try {
    const parsed = JSON.parse(json);
    if (parsed?.resourceType === "Bundle") {
      return parsed as FhirBundle;
    }
  } catch (error) {
    console.error("Failed to parse test case JSON bundle", error);
  }

  return null;
};

const getPatientIdFromBundle = (bundle: FhirBundle): string | null => {
  const patientEntry = bundle?.entry?.find(
    (entry) => entry?.resource?.resourceType === PATIENT
  );
  return patientEntry?.resource?.id ?? null;
};

const replaceIdInFullUrl = (fullUrl: string, newId: string): string => {
  if (!fullUrl) return `urn:uuid:${newId}`;

  if (fullUrl.startsWith("urn:uuid:")) {
    return `urn:uuid:${newId}`;
  }

  const parts = fullUrl.split("/");
  if (parts.length < 2) {
    return `urn:uuid:${newId}`;
  }

  parts[parts.length - 1] = newId;
  return parts.join("/");
};

const replaceReferenceValue = (
  ref: string,
  referenceMap: Record<string, string>
): string => {
  if (!ref || typeof ref !== "string") {
    return ref;
  }

  // Only handle direct FHIR references like "ResourceType/id".
  if (!FHIR_REFERENCE_PATTERN.test(ref)) {
    return ref;
  }

  return referenceMap[ref] ?? ref;
};

const updateReferencesInObject = (
  value: any,
  referenceMap: Record<string, string>
): any => {
  if (Array.isArray(value)) {
    return value.map((item) => updateReferencesInObject(item, referenceMap));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((acc, [key, child]) => {
      if (key === "reference" && typeof child === "string") {
        acc[key] = replaceReferenceValue(child, referenceMap);
      } else {
        acc[key] = updateReferencesInObject(child, referenceMap);
      }
      return acc;
    }, {} as Record<string, any>);
  }

  return value;
};

export const buildBundleWithInsertedProfiles = (
  currentJson: string,
  selectedJson: string
): FhirBundle | null => {
  const currentBundle = safeParseBundle(currentJson);
  const selectedBundle = safeParseBundle(selectedJson);

  if (!currentBundle || !selectedBundle) {
    return null;
  }

  const currentPatientId = getPatientIdFromBundle(currentBundle);
  if (!currentPatientId) {
    console.error(
      "Current composite test case bundle does not contain a Patient"
    );
    return null;
  }

  const referenceMap: Record<string, string> = {};

  selectedBundle.entry?.forEach((entry) => {
    const resource = entry?.resource;
    const resourceType = resource?.resourceType;
    const resourceId = resource?.id;
    if (!resourceType || !resourceId) return;

    const oldReference = buildReferenceKey(resourceType, resourceId);

    if (resourceType === PATIENT) {
      referenceMap[oldReference] = buildReferenceKey(PATIENT, currentPatientId);
    } else {
      referenceMap[oldReference] = buildReferenceKey(resourceType, uuidv4());
    }
  });

  const copiedEntries =
    selectedBundle.entry
      ?.filter((entry) => entry?.resource?.resourceType !== PATIENT)
      .map((entry) => {
        const originalResource = entry.resource;
        const originalReference = buildReferenceKey(
          originalResource.resourceType,
          originalResource.id
        );
        const mappedReference = referenceMap[originalReference];
        const newId = mappedReference?.split("/")[1];
        if (!newId) {
          return null;
        }

        const clonedResource = _.cloneDeep(originalResource);

        clonedResource.id = newId;
        const updatedResource = updateReferencesInObject(
          clonedResource,
          referenceMap
        );

        return {
          ..._.cloneDeep(entry),
          fullUrl: replaceIdInFullUrl(entry.fullUrl, newId),
          resource: updatedResource,
        };
      })
      .filter(Boolean) ?? [];

  const currentEntries = currentBundle.entry
    ? _.cloneDeep(currentBundle.entry)
    : [];

  return {
    ..._.cloneDeep(currentBundle),
    entry: [...currentEntries, ...copiedEntries],
  };
};
