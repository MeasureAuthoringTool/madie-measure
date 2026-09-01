export const normalizeProfileId = (profileId?: string) => {
  if (!profileId) return "";

  // Supports plain ids and canonical profile URLs.
  if (profileId.includes("/")) {
    const cleaned = profileId.split("?")[0].replace(/\.html$/i, "");
    const structureDefinitionSegment = cleaned.split("/").pop() || "";
    return structureDefinitionSegment
      .replace(/^StructureDefinition[-/]/i, "")
      .trim();
  }

  return profileId.trim();
};

export const getHl7ProfileLink = (
  profileId?: string,
  measureModel?: string
) => {
  const normalizedProfileId = normalizeProfileId(profileId);
  if (!normalizedProfileId) return "";

  const id = normalizedProfileId.toLowerCase();

  // QI-Core profiles live under STU6 or STU7
  if (id.startsWith("qicore-")) {
    //get version number
    const versionNum = measureModel?.match(/(\d+)(?:\.\d+)?/);
    const major = versionNum ? parseInt(versionNum[1], 10) : 6;
    const stu = major >= 7 ? "STU7" : "STU6";
    return `https://hl7.org/fhir/us/qicore/${stu}/StructureDefinition-${normalizedProfileId}.html`;
  }
  if (id.startsWith("us-core-")) {
    return `https://hl7.org/fhir/us/core/StructureDefinition-${normalizedProfileId}.html`;
  }
  if (id.startsWith("us-quality-core-")) {
    return `https://fhir.org/guides/onc/us-quality-core/en/StructureDefinition-${normalizedProfileId}.html`;
  }

  // Fallback
  const parts = normalizedProfileId.split("-");
  const last = parts.length > 0 ? parts[parts.length - 1] : normalizedProfileId;
  const resource = last.charAt(0).toUpperCase() + last.slice(1);
  return `https://hl7.org/fhir/${resource}.html`;
};

export default getHl7ProfileLink;
