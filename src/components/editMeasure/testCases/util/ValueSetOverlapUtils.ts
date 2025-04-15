import { Bundle, Library, Measure, ValueSet } from "fhir/r4";
import { ValueSet as CqmValueSet } from "cqm-models";

export interface OverlappingValueSet {
  name: string;
  oid: string;
  url: string;
}

export interface OverlappingCode {
  code: string;
  codeSystem: string;
  description: string;
  codeSystemName: string;
  codeSystemVersion: string;
  valueSets: Array<OverlappingValueSet>;
}

export function generateQdmReport(valueSets: CqmValueSet[]): OverlappingCode[] {
  // Reverse the value set mapping such that the code is the key and value is an array of value sets containing that code.
  if (!valueSets || valueSets.length === 0) {
    return [];
  }
  const codeValueSetMap: OverlappingCode[] = [];
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
      if (
        !code.valueSets.some(
          (vs) => vs.oid === valueSet.oid
        )
      ) {
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
): OverlappingCode[] {
  // Reverse the value set mapping such that the code is the key and value is an array of value sets containing that code.
  if (!valueSets || valueSets.length === 0) {
    return [];
  }
  // This is required because we want to show overlapping codes only for the value sets that are used in the measure
  // used valuesets re part of effectiveDataRequirements
  const usedValueSets = getUsedValueSets(measureBundle);
  if (!usedValueSets?.length) {
    return [];
  }
  const codeValueSetMap: OverlappingCode[] = [];
  for (const valueSet of valueSets) {
    // Check if the value set is used in the measure
    if (!usedValueSets.includes(valueSet.url)) {
      continue;
    }
    valueSet.expansion?.contains?.forEach((contained) => {
      let code = codeValueSetMap.find(
        (c) =>
          c.code === contained.code &&
          c.codeSystem === contained.system &&
          c.codeSystemVersion === contained.version
      );
      if (!code) {
        code = {
          code: contained.code,
          description: contained.display || "",
          codeSystem: contained.system,
          codeSystemVersion: contained.version,
          codeSystemName: contained.system,
          valueSets: [],
        };
        codeValueSetMap.push(code);
      }
      if (
        !code.valueSets.some(
          (vs) => vs.oid === valueSet.id
        )
      ) {
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
