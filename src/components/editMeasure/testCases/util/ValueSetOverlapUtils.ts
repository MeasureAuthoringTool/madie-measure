import { ValueSet } from "fhir/r4";
import { ValueSet as CqmValueSet } from "cqm-models";

export interface OverlappingValueSet {
  name: string;
  oid: string;
  url: string;
}

export interface OverlappingValueSetReport {
  code: string;
  codeSystem: string;
  description: string;
  codeSystemName: string;
  codeSystemVersion: string;
  valueSets: Array<OverlappingValueSet>;
}

export function generateQdmReport(
  valueSets: CqmValueSet[]
): OverlappingValueSetReport[] {
  // Reverse the value set mapping such that the code is the key and value is an array of value sets containing that code.
  if (!valueSets || valueSets.length === 0) {
    return [];
  }
  const codeValueSetMap: OverlappingValueSetReport[] = [];
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
      code.valueSets.push({
        name: valueSet.display_name,
        oid: valueSet.oid,
        url: "",
      });
    });
  }
  return codeValueSetMap.filter((code) => code.valueSets.length > 1);
}

export function generateQiCoreReport(
  valueSets: ValueSet[]
): OverlappingValueSetReport[] {
  // Reverse the value set mapping such that the code is the key and value is an array of value sets containing that code.
  if (!valueSets || valueSets.length === 0) {
    return [];
  }
  const codeValueSetMap: OverlappingValueSetReport[] = [];
  for (const valueSet of valueSets) {
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
      code.valueSets.push({
        name: valueSet.name,
        oid: valueSet.id,
        url: valueSet.url,
      });
    });
  }
  return codeValueSetMap.filter((code) => code.valueSets.length > 1);
}
