import { getValueSetsForDemographic } from "./DemographicsSectionConst";

describe("getValueSetsForDemographic", () => {
  it("should return null when cqmMeasure is undefined", () => {
    expect(getValueSetsForDemographic(undefined, "gender")).toBeNull();
  });

  it("should return null when no source_data_criteria match the demographicType", () => {
    const cqmMeasure: any = {
      source_data_criteria: [{ qdmStatus: "race", codeListId: "oid-1" }],
      value_sets: [],
    };
    expect(getValueSetsForDemographic(cqmMeasure, "gender")).toEqual([]);
  });

  it("should return valueSets with concepts mapped correctly", () => {
    const cqmMeasure: any = {
      source_data_criteria: [{ qdmStatus: "gender", codeListId: "oid-1" }],
      value_sets: [
        {
          oid: "oid-1",
          display_name: "CMSSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Female",
            },
            {
              code: "M",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Male",
            },
          ],
        },
      ],
    };

    const result = getValueSetsForDemographic(cqmMeasure, "gender");
    expect(result).toHaveLength(1);
    expect(result[0].concepts).toHaveLength(2);
    expect(result[0].concepts[0]).toEqual({
      system: "sys-1",
      version: "1.0",
      code: "F",
      display: "Female",
    });
  });

  it("should deduplicate concepts with same code AND same code_system_oid across valueSets", () => {
    // Two valueSets both have "Female" with code "F" from the same code system "sys-1".
    // The second occurrence should be removed as a duplicate.
    const cqmMeasure: any = {
      source_data_criteria: [
        { qdmStatus: "gender", codeListId: "oid-1" },
        { qdmStatus: "gender", codeListId: "oid-2" },
      ],
      value_sets: [
        {
          oid: "oid-1",
          display_name: "CMSSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Female",
            },
            {
              code: "M",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Male",
            },
          ],
        },
        {
          oid: "oid-2",
          display_name: "ONCAdminSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Female",
            },
            {
              code: "M",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Male",
            },
          ],
        },
      ],
    };

    const result = getValueSetsForDemographic(cqmMeasure, "gender");
    // First valueSet keeps both concepts; second valueSet has all concepts
    // deduplicated so it gets filtered out entirely
    expect(result).toHaveLength(1);
    expect(result[0].oid).toBe("oid-1");
    expect(result[0].concepts).toHaveLength(2);
  });

  it("should keep concepts with same code but DIFFERENT code_system_oid (different code systems)", () => {
    // Two valueSets both have code "F" but from different code systems.
    // These are considered distinct concepts and both should be kept.
    const cqmMeasure: any = {
      source_data_criteria: [
        { qdmStatus: "gender", codeListId: "oid-1" },
        { qdmStatus: "gender", codeListId: "oid-2" },
      ],
      value_sets: [
        {
          oid: "oid-1",
          display_name: "CMSSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-SNOMED",
              code_system_version: "1.0",
              display_name: "Female (finding)",
            },
          ],
        },
        {
          oid: "oid-2",
          display_name: "AdminSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-HL7",
              code_system_version: "2.0",
              display_name: "Female",
            },
          ],
        },
      ],
    };

    const result = getValueSetsForDemographic(cqmMeasure, "gender");
    // Both valueSets should be returned since the code systems differ
    expect(result).toHaveLength(2);
    expect(result[0].concepts).toHaveLength(1);
    expect(result[0].concepts[0].system).toBe("sys-SNOMED");
    expect(result[1].concepts).toHaveLength(1);
    expect(result[1].concepts[0].system).toBe("sys-HL7");
  });

  it("should partially deduplicate: keep unique concepts and remove duplicates within mixed valueSets", () => {
    // First valueSet has Female and Male from sys-1.
    // Second valueSet has Female from sys-1 (duplicate) and Unknown from sys-1 (unique).
    const cqmMeasure: any = {
      source_data_criteria: [
        { qdmStatus: "gender", codeListId: "oid-1" },
        { qdmStatus: "gender", codeListId: "oid-2" },
      ],
      value_sets: [
        {
          oid: "oid-1",
          display_name: "CMSSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Female",
            },
            {
              code: "M",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Male",
            },
          ],
        },
        {
          oid: "oid-2",
          display_name: "ExtendedSex",
          concepts: [
            {
              code: "F",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Female",
            },
            {
              code: "U",
              code_system_oid: "sys-1",
              code_system_version: "1.0",
              display_name: "Unknown",
            },
          ],
        },
      ],
    };

    const result = getValueSetsForDemographic(cqmMeasure, "gender");
    // First valueSet: Female, Male (both kept)
    // Second valueSet: Female removed (dup), Unknown kept
    expect(result).toHaveLength(2);
    expect(result[0].concepts).toHaveLength(2);
    expect(result[1].concepts).toHaveLength(1);
    expect(result[1].concepts[0].code).toBe("U");
    expect(result[1].concepts[0].display).toBe("Unknown");
  });
});
