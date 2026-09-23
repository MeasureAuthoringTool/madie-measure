import * as _ from "lodash";
import { ResourceIdentifier } from "../../../../../../../../../api/models/ResourceIdentifier";
import { ElementDefinition } from "fhir/r4";

export type ResourceProfile = ResourceIdentifier;

export type ResourceProfileOption = {
  label: string;
  value: string;
  profile: string;
};

export type ReferenceOption = {
  label: string;
  value: string;
};

export const getReferenceComponentLabel = (label: string) => {
  const componentLabel = label
    .split(".")
    ?.pop()
    ?.replace(/\[.*]$/, "");
  return componentLabel ? _.startCase(componentLabel) : "";
};

// The abstract base FHIR "Resource" type. When an element's reference targets
// this profile it is a generic `Reference(Resource)` and can point at any
// resource valid for the measure model - it is never a valid concrete target
// on its own.
export const GENERIC_RESOURCE_PROFILE_URL =
  "http://hl7.org/fhir/StructureDefinition/Resource";
// Cross-version profile title prefix
const CROSS_VERSION_PROFILE_TITLE_PREFIX = "Cross-version Profile";

// Detects a generic `Reference(Resource)`: a Reference whose target is the
// abstract base Resource profile (or which declares no concrete targetProfile).
export const isGenericResourceReference = (
  structureDefinition: ElementDefinition
): boolean => {
  const targetProfiles =
    structureDefinition?.type?.find(
      (type: { code: string }) => type.code === "Reference"
    )?.targetProfile || [];

  if (targetProfiles.length === 0) return true;
  return targetProfiles.some((profile) =>
    profile.includes(GENERIC_RESOURCE_PROFILE_URL)
  );
};

// Maps every profile applicable to the measure model to a Reference Type
// option, de-duplicated by profile URL and sorted by label. Used for generic
// `Reference(Resource)` where all model profiles are valid targets. The abstract
// generic Resource profile and cross versioned profiles are excluded because it is not a valid
// reference target.
export const mapProfilesToReferenceTypeOptions = (
  allResourceProfiles: ResourceProfile[]
): ResourceProfileOption[] =>
  allResourceProfiles
    .filter(
      (resourceProfile) =>
        !resourceProfile.profile.startsWith(
          CROSS_VERSION_PROFILE_TITLE_PREFIX
        ) && resourceProfile.type !== "Resource"
    )
    .filter(
      (resourceProfile, index, profiles) =>
        index ===
        profiles.findIndex(
          (profile) => profile.profile === resourceProfile.profile
        )
    )
    .map((resourceProfile) => ({
      label: resourceProfile.title,
      value: resourceProfile.type,
      profile: resourceProfile.profile,
    }))
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

export const getHighestPriorityResourceList = (
  qiCoreProfiles: ResourceProfile[],
  usQualityCoreProfiles: ResourceProfile[],
  usCoreProfiles: ResourceProfile[],
  baseFhirProfiles: ResourceProfile[]
) => {
  if (qiCoreProfiles.length > 0) return qiCoreProfiles;
  if (usQualityCoreProfiles.length > 0) return usQualityCoreProfiles;
  if (usCoreProfiles.length > 0) return usCoreProfiles;
  return baseFhirProfiles;
};

export const getProfileMatchTypes = (profileUrl: string) => {
  if (profileUrl.includes("/fhir/us/qicore")) return ["/fhir/us/qicore"];
  if (profileUrl.includes("/onc/us-quality-core"))
    return ["/onc/us-quality-core"];
  if (profileUrl.includes("/fhir/us/core"))
    return ["/fhir/us/core", "/onc/us-quality-core", "/fhir/us/qicore"];
  if (profileUrl.includes("/fhir/StructureDefinition/"))
    return [
      "/fhir/StructureDefinition/",
      "/fhir/us/core",
      "/onc/us-quality-core",
      "/fhir/us/qicore",
    ];
  return [];
};

export const findProfileUrlFromReferenceType = (
  referenceType: string,
  resourceProfileOptions: ResourceProfileOption[]
) => {
  if (!referenceType || resourceProfileOptions.length === 0) return "";

  return (
    resourceProfileOptions.find((option) => option.value === referenceType)
      ?.profile || ""
  );
};

const emptyOption: ReferenceOption[] = [
  { label: "ID Not Present (Add New)", value: "add_new_id" },
];

export const getSpecificResourceOptions = (
  selectedReferenceType: string,
  selectedProfileUrl: string,
  bundleEntries: any[],
  resource?: any
) => {
  if (!selectedReferenceType || !selectedProfileUrl) return emptyOption;

  const hasPatient = bundleEntries.some(
    (entry) => entry.resource.resourceType === "Patient"
  );
  const matchTypes = getProfileMatchTypes(selectedProfileUrl);
  const filtered = bundleEntries.filter((entry) => {
    if (entry.resource.resourceType !== selectedReferenceType) return false;
    if (entry.resource.id === resource?.id) return false;

    const profiles = entry.resource.meta?.profile || [];
    return profiles.some((url) =>
      matchTypes.some((type) => url.includes(type))
    );
  });

  if (filtered.length === 0) return emptyOption;

  const uniqueResults = filtered
    .map((entry) => ({
      label: `${selectedReferenceType}/${entry.resource.id}`,
      value: `${selectedReferenceType}/${entry.resource.id}`,
    }))
    .filter(
      (item, index, allItems) =>
        index ===
        allItems.findIndex((candidate) => candidate.label === item.label)
    )
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));

  const options = [...uniqueResults, ...emptyOption];
  if (selectedReferenceType === "Patient" && hasPatient) {
    options.pop();
  }
  return options;
};

// Builds the "Reference Type" dropdown options from the element's allowed
// targetProfiles, de-duplicated by profile and sorted by label.
export const getReferenceTypeOptions = (
  structureDefinition: ElementDefinition,
  allResourceProfiles: ResourceProfile[] | null = []
): ResourceProfileOption[] => {
  const profiles = allResourceProfiles ?? [];

  // Generic `Reference(Resource)`: expand to every profile valid for the
  // measure model. `allResourceProfiles` is already scoped to the measure model
  // by the backend (QI-Core -> QI-Core/US Core/base FHIR; US Quality Core ->
  // US Quality Core/US Core/base FHIR), so no cross-profile options leak in and
  // the invalid abstract Resource option is dropped by the mapper.
  if (isGenericResourceReference(structureDefinition)) {
    return mapProfilesToReferenceTypeOptions(profiles);
  }

  const targetProfiles =
    structureDefinition.type?.find(
      (type: { code: string }) => type.code === "Reference"
    )?.targetProfile || [];

  return profiles
    .filter((resourceProfile) =>
      targetProfiles.includes(resourceProfile.profile)
    )
    .filter(
      (resourceProfile, index, profiles) =>
        index ===
        profiles.findIndex(
          (profile) => profile.profile === resourceProfile.profile
        )
    )
    .map((resourceProfile) => ({
      label: resourceProfile.title,
      value: resourceProfile.type,
      profile: resourceProfile.profile,
    }))
    .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
};

export const getProfilesForResourceType = (
  resourceType: string,
  allResourceProfiles: ResourceProfile[] | null = []
) => {
  const profiles = (allResourceProfiles ?? []).filter(
    (profile) => profile.type === resourceType
  );

  return getHighestPriorityResourceList(
    profiles.filter((profile) => profile.profile.includes("qicore")),
    profiles.filter((profile) =>
      profile.profile.includes("/onc/us-quality-core")
    ),
    profiles.filter((profile) => profile.profile.includes("us-core")),
    profiles.filter(
      (profile) =>
        profile.profile.includes("fhir/StructureDefinition") &&
        !profile.profile.includes("/us/")
    )
  );
};

export const getAddNewProfileOptions = (
  profiles: ResourceProfile[]
): ReferenceOption[] =>
  profiles
    .filter(
      (profile, index, allProfiles) =>
        index ===
        allProfiles.findIndex(
          (candidate) => candidate.profile === profile.profile
        )
    )
    .map((profile) => ({
      label: profile.title,
      value: profile.profile,
    }));
