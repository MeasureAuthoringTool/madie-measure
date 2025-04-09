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

export const overlappingCodes = [
  {
    code: "123456",
    codeSystem: "SNOMEDCT",
    description: "Test Code System",
    codeSystemName: "Test Code System Name",
    codeSystemVersion: "1.0",
    valueSets: [
      {
        name: "Test Value Set 1",
        oid: "2.16.840.1.113883.3.1234",
        url: "http://example.com/valueset1",
      },
      {
        name: "Test Value Set 2",
        oid: "2.16.840.1.113883.3.5678",
        url: "http://example.com/valueset2",
      },
    ],
  },
  {
    code: "789012",
    codeSystem: "LOINC",
    description: "Another Test Code System",
    codeSystemName: "Another Test Code System Name",
    codeSystemVersion: "1.0",
    valueSets: [
      {
        name: "Another Test Value Set 1",
        oid: "2.16.840.1.113883.3.91011",
        url: "http://example.com/valueset3",
      },
      {
        name: "Another Test Value Set 2",
        oid: "2.16.840.1.113883.3.121314",
        url: "http://example.com/valueset4",
      },
    ],
  },
  {
    code: "345678",
    codeSystem: "RXNORM",
    description: "Yet Another Test Code System",
    codeSystemName: "Yet Another Test Code System Name",
    codeSystemVersion: "1.0",
    valueSets: [
      {
        name: "Yet Another Test Value Set 1",
        oid: "2.16.840.1.113883.3.151617",
        url: "http://example.com/valueset5",
      },
      {
        name: "Yet Another Test Value Set 2",
        oid: "2.16.840.1.113883.3.181920",
        url: "http://example.com/valueset6",
      },
    ],
  },
  {
    code: "901234",
    codeSystem: "ICD10",
    description: "Final Test Code System",
    codeSystemName: "Final Test Code System Name",
    codeSystemVersion: "1.0",
    valueSets: [
      {
        name: "Final Test Value Set 1",
        oid: "2.16.840.1.113883.3.212223",
        url: "http://example.com/valueset7",
      },
      {
        name: "Final Test Value Set 2",
        oid: "2.16.840.1.113883.3.242526",
        url: "http://example.com/valueset8",
      },
    ],
  },
  {
    code: "567890",
    codeSystem: "CPT",
    description: "Test Code System 5",
    codeSystemName: "Test Code System Name 5",
    codeSystemVersion: "1.0",
    valueSets: [
      {
        name: "Test Value Set 5",
        oid: "2.16.840.1.113883.3.272829",
        url: "http://example.com/valueset9",
      },
      {
        name: "Test Value Set 6",
        oid: "2.16.840.1.113883.3.303132",
        url: "http://example.com/valueset10",
      },
    ],
  },
  {
    code: "678901",
    codeSystem: "HCPCS",
    description: "Test Code System 6",
    codeSystemName: "Test Code System Name 6",
    codeSystemVersion: "1.0",
    valueSets: [
      {
        name: "Test Value Set 7",
        oid: "2.16.840.1.113883.3.333435",
        url: "http://example.com/valueset11",
      },
      {
        name: "Test Value Set 8",
        oid: "2.16.840.1.113883.3.363738",
        url: "http://example.com/valueset12",
      },
    ],
  },
] as Array<OverlappingCode>;
