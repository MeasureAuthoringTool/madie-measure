import {
  generateQdmReport,
  generateQiCoreReport,
  extractVersionNumber,
} from "./OverlappingCodesUtils";
import { ValueSet as CqmValueSet } from "cqm-models";
import {
  Bundle,
  BundleEntry,
  FhirResource,
  Library,
  Measure,
  ValueSet,
} from "fhir/r4";

describe("OverlappingCodesUtils", () => {
  describe("generateQdmReport", () => {
    it("should return an empty array when no overlapping codes exist", () => {
      const valueSets: CqmValueSet[] = [
        {
          oid: "1.2.3",
          display_name: "Test ValueSet 1",
          concepts: [
            {
              code: "123",
              display_name: "Test Code 1",
              code_system_oid: "1.2.3.4",
              code_system_version: "1",
              code_system_name: "Test System",
            },
          ],
        },
        {
          oid: "2.3.4",
          display_name: "Test ValueSet 2",
          concepts: [
            {
              code: "456",
              display_name: "Test Code 2",
              code_system_oid: "2.3.4.5",
              code_system_version: "1",
              code_system_name: "Another System",
            },
          ],
        },
        {
          oid: "5.6.7",
          display_name: "Test ValueSet 3",
          concepts: [
            {
              code: "10000",
              display_name: "Test Code 10000",
              code_system_oid: "2.3.4.5",
              code_system_version: "1",
              code_system_name: "Another System",
            },
          ],
        },
      ];

      const result = generateQdmReport(valueSets);
      expect(result).toEqual([]);
    });

    it("should return overlapping codes", () => {
      const valueSets: CqmValueSet[] = [
        {
          oid: "1.2.3",
          display_name: "Test ValueSet 1",
          concepts: [
            {
              code: "123",
              display_name: "Test Code 1",
              code_system_oid: "1.2.3.4",
              code_system_version: "1",
              code_system_name: "Test System",
            },
          ],
        },
        {
          oid: "2.3.4",
          display_name: "Test ValueSet 2",
          concepts: [
            {
              code: "123",
              display_name: "Test Code 1",
              code_system_oid: "1.2.3.4",
              code_system_version: "1",
              code_system_name: "Test System",
            },
          ],
        },
        {
          oid: "5.6.7",
          display_name: "Test ValueSet 3",
          concepts: [
            {
              code: "10000",
              display_name: "Test Code 10000",
              code_system_oid: "1.2.3.4",
              code_system_version: "1",
              code_system_name: "Test System",
            },
          ],
        },
      ];

      const result = generateQdmReport(valueSets);
      expect(result).toHaveLength(1);
      expect(result[0].valueSets).toHaveLength(2);
    });

    it("should return an empty array when no value sets are provided", () => {
      const valueSets: CqmValueSet[] = [];
      const result = generateQdmReport(valueSets);
      expect(result).toEqual([]);
    });
  });

  describe("generateQiCoreReport", () => {
    const measureBundle = {
      entry: [
        {
          resource: {
            resourceType: "Measure",
            status: "active",
            contained: [
              {
                resourceType: "Library",
                relatedArtifact: [
                  {
                    type: "depends-on",
                    display: "Value Test ValueSet 1",
                    resource: "http://example.com/ValueSet/1",
                  },
                  {
                    type: "depends-on",
                    display: "Value Test ValueSet 2",
                    resource: "http://example.com/ValueSet/2",
                  },
                ],
              } as FhirResource,
            ],
          } as FhirResource,
        },
      ] as BundleEntry[],
    } as Bundle;

    it("should return an empty array when no overlapping codes exist", () => {
      const valueSets: ValueSet[] = [
        {
          id: "1",
          name: "Test ValueSet 1",
          url: "http://example.com/ValueSet/1",
          expansion: {
            contains: [
              {
                code: "123",
                display: "Test Code 1",
                system: "http://example.com/system1",
                version: "1",
              },
            ],
          },
        },
        {
          id: "2",
          name: "Test ValueSet 2",
          url: "http://example.com/ValueSet/2",
          expansion: {
            contains: [
              {
                code: "456",
                display: "Test Code 2",
                system: "http://example.com/system2",
                version: "1",
              },
            ],
          },
        },
      ] as ValueSet[];
      const result = generateQiCoreReport(valueSets, measureBundle);
      expect(result).toEqual([]);
    });

    it("should return overlapping value sets", () => {
      const valueSets: ValueSet[] = [
        {
          id: "1",
          name: "Test ValueSet 1",
          url: "http://example.com/ValueSet/1",
          expansion: {
            contains: [
              {
                code: "123",
                display: "Test Code 1",
                system: "http://example.com/system1",
                version: "1",
              },
            ],
          },
        },
        {
          id: "2",
          name: "Test ValueSet 2",
          url: "http://example.com/ValueSet/2",
          expansion: {
            contains: [
              {
                code: "123",
                display: "Test Code 1",
                system: "http://example.com/system1",
                version: "1",
              },
            ],
          },
        },
      ] as ValueSet[];

      const result = generateQiCoreReport(valueSets, measureBundle);
      expect(result).toHaveLength(1);
      expect(result[0].valueSets).toHaveLength(2);
    });

    it("should return an empty array when no value sets are provided", () => {
      const valueSets: ValueSet[] = [];
      expect(generateQiCoreReport(valueSets, measureBundle)).toEqual([]);
      expect(generateQiCoreReport(undefined, measureBundle)).toEqual([]);
    });

    it("should return an empty array when no used value sets found", () => {
      const valueSets: ValueSet[] = [];
      const measureResource = measureBundle.entry[0].resource as Measure;
      // no value sets in the effectiveDr
      (measureResource.contained as Library[])[0].relatedArtifact = [];
      const result = generateQiCoreReport(valueSets, measureBundle);
      expect(result).toEqual([]);
    });

    it("should return an empty array when no effectiveDr present", () => {
      const valueSets: ValueSet[] = [];
      const measureResource = measureBundle.entry[0].resource as Measure;
      // no value sets in the effectiveDr
      measureResource.contained = [];
      const result = generateQiCoreReport(valueSets, measureBundle);
      expect(result).toEqual([]);
    });

    it("should return an empty array when measure entry is not provided", () => {
      const valueSets: ValueSet[] = [];
      measureBundle.entry = [];
      const result = generateQiCoreReport(valueSets, measureBundle);
      expect(result).toEqual([]);
    });

    it("should return an empty array when measure bundle is not provided", () => {
      const valueSets: ValueSet[] = [];
      const result = generateQiCoreReport(valueSets, undefined);
      expect(result).toEqual([]);
    });
  });

  describe("extractVersionNumber", () => {
    it("should return the version number from a URL", () => {
      const result = extractVersionNumber("http://example.com/version/1");
      expect(result).toBe("1");
    });

    it("should return the input string if no slashes are present", () => {
      const result = extractVersionNumber("1");
      expect(result).toBe("1");
    });

    it("should return an empty string if input is undefined", () => {
      const result = extractVersionNumber(undefined);
      expect(result).toBe("");
    });
  });
});
