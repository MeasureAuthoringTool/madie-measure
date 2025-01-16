import { StructureDefinition } from "fhir/r4";

export interface StructureDefinitionDto {
  resourceName: string;
  category: string;
  primaryCodePath: string;
  definition: StructureDefinition;
}
