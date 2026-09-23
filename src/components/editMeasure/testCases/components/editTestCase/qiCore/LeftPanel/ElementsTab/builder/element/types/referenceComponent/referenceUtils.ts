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
  const targetProfiles =
    structureDefinition.type?.find(
      (type: { code: string }) => type.code === "Reference"
    )?.targetProfile || [];

  return (allResourceProfiles ?? [])
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
