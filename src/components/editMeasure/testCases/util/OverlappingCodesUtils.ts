import { Bundle, Library, Measure, ValueSet } from "fhir/r4";
import { ValueSet as CqmValueSet } from "cqm-models";
import { OverlappingCodeDto } from "@madie/madie-models";

export function generateQdmReport(
  valueSets: CqmValueSet[]
): OverlappingCodeDto[] {
  // Reverse the value set mapping such that the code is the key and value is an array of value sets containing that code.
  if (!valueSets || valueSets.length === 0) {
    return [];
  }
  const codeValueSetMap: OverlappingCodeDto[] = [];
  for (const valueSet of valueSets) {
    valueSet.concepts?.forEach((concept) => {
      let code = codeValueSetMap.find(
        (c) =>
          c.code === concept.code &&
          c.codeSystem === concept.code_system_oid &&
          c.codeSystemVersion === concept.code_system_version
      );
      if (!code) {
        code = {
          code: concept.code,
          description: concept.display_name || "",
          codeSystem: concept.code_system_oid,
          codeSystemVersion: concept.code_system_version,
          codeSystemName: concept.code_system_name,
          valueSets: [],
        };
        codeValueSetMap.push(code);
      }
      if (!code.valueSets.some((vs) => vs.oid === valueSet.oid)) {
        code.valueSets.push({
          name: valueSet.display_name,
          oid: valueSet.oid,
          url: "",
        });
      }
    });
  }
  return codeValueSetMap.filter((code) => code.valueSets.length > 1);
}

export function generateQiCoreReport(
  valueSets: ValueSet[],
  measureBundle: Bundle
): OverlappingCodeDto[] {
  // Reverse the value set mapping such that the code is the key and value is an array of value sets containing that code.
  if (!valueSets?.length) {
    return [];
  }
  // This is required because we want to show overlapping codes only for the value sets that are used in the measure
  // used value sets re part of effectiveDataRequirements
  const usedValueSets = getUsedValueSets(measureBundle);
  if (!usedValueSets?.length) {
    return [];
  }
  const codeValueSetMap: OverlappingCodeDto[] = [];
  for (const valueSet of valueSets) {
    // Check if the value set is used in the measure
    if (!usedValueSets.includes(valueSet.url)) {
      continue;
    }
    valueSet.expansion?.contains?.forEach((contained) => {
      const codeSystemVersion = extractVersionNumber(contained.version);
      let code = codeValueSetMap.find(
        (c) =>
          c.code === contained.code &&
          c.codeSystem === contained.system &&
          c.codeSystemVersion === codeSystemVersion
      );
      if (!code) {
        code = {
          code: contained.code,
          description: contained.display || "",
          codeSystem: contained.system,
          codeSystemVersion: codeSystemVersion,
          codeSystemName: contained.system,
          valueSets: [],
        };
        codeValueSetMap.push(code);
      }
      if (!code.valueSets.some((vs) => vs.oid === valueSet.id)) {
        code.valueSets.push({
          name: valueSet.name,
          oid: valueSet.id,
          url: valueSet.url,
        });
      }
    });
  }
  return codeValueSetMap.filter((code) => code.valueSets.length > 1);
}

// Utility function to extract the last part of a URL or return the string itself if no slashes are present
export function extractVersionNumber(version: string): string {
  if (!version) {
    return "";
  }
  const parts = version.split("/");
  return parts.length > 1 ? parts[parts.length - 1] : version;
}

export function getUsedValueSets(measureBundle: Bundle): Array<string> {
  if (!measureBundle?.entry) {
    return [];
  }
  const measureEntry = measureBundle.entry.find(
    (entry) => entry.resource?.resourceType === "Measure"
  );
  if (!measureEntry) {
    return [];
  }
  const measure = measureEntry.resource as Measure;
  const moduleDefinition = measure.contained as Library[];
  if (!moduleDefinition?.length) {
    return [];
  }
  // relatedArtifact is an array of used artifacts
  // we need to collect the artifacts that are of type "ValueSet"
  return moduleDefinition[0].relatedArtifact?.reduce((oids, artifact) => {
    if (artifact.resource?.includes("ValueSet/")) {
      oids.push(artifact.resource);
    }
    return oids;
  }, [] as string[]);
}
