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
