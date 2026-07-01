export const getHl7ProfileLink = (
  profileId?: string,
  measureModel?: string
) => {
  if (!profileId) return "";

  const id = profileId.toLowerCase();

  // QI-Core profiles live under STU6 or STU7
  if (id.startsWith("qicore-")) {
    //get version number
    const versionNum = measureModel?.match(/(\d+)(?:\.\d+)?/);
    const major = versionNum ? parseInt(versionNum[1], 10) : 6;
    const stu = major >= 7 ? "STU7" : "STU6";
    return `https://hl7.org/fhir/us/qicore/${stu}/StructureDefinition-${profileId}.html`;
  }
  if (id.startsWith("us-core-")) {
    return `https://hl7.org/fhir/us/core/StructureDefinition-${profileId}.html`;
  }

  // Fallback
  const parts = profileId.split("-");
  const last = parts.length > 0 ? parts[parts.length - 1] : profileId;
  const resource = last.charAt(0).toUpperCase() + last.slice(1);
  return `https://hl7.org/fhir/${resource}.html`;
};

export default getHl7ProfileLink;
