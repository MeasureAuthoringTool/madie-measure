import {
  generateQdmReport,
  generateQiCoreReport,
} from "./OverlappingCodesUtils";
import { ValueSet as CqmValueSet } from "cqm-models";
import { ValueSet } from "fhir/r4";

describe("OverlappingCodesUtils", () => {
  describe("generateQdmReport", () => {
    it("should return an empty array when no overlapping value sets exist", () => {
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

    it("should return overlapping value sets", () => {
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
    it("should return an empty array when no overlapping value sets exist", () => {
      const valueSets: ValueSet[] = [
        {
          id: "1",
          name: "Test ValueSet 1",
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
      ];

      const result = generateQiCoreReport(valueSets);
      expect(result).toEqual([]);
    });

    it("should return overlapping value sets", () => {
      const valueSets: ValueSet[] = [
        {
          id: "1",
          name: "Test ValueSet 1",
          url: "http://example.com/valueset1",
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
          url: "http://example.com/valueset2",
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
      ];

      const result = generateQiCoreReport(valueSets);
      expect(result).toHaveLength(1);
      expect(result[0].valueSets).toHaveLength(2);
    });

    it("should return an empty array when no value sets are provided", () => {
      const valueSets: ValueSet[] = [];
      const result = generateQiCoreReport(valueSets);
      expect(result).toEqual([]);
    });
  });
});
