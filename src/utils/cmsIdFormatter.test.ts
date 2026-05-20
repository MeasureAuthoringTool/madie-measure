import { describe, expect, it } from "@jest/globals";
import { formatCmsId, padCmsId } from "./cmsIdFormatter";

describe("padCmsId", () => {
  it("returns empty string for null / undefined / empty / non-positive", () => {
    expect(padCmsId(null)).toBe("");
    expect(padCmsId(undefined)).toBe("");
    expect(padCmsId("")).toBe("");
    expect(padCmsId(0)).toBe("");
    expect(padCmsId(-3)).toBe("");
  });

  it("zero-pads to four digits", () => {
    expect(padCmsId(2)).toBe("0002");
    expect(padCmsId(22)).toBe("0022");
    expect(padCmsId(222)).toBe("0222");
    expect(padCmsId(2222)).toBe("2222");
  });

  it("leaves values wider than four digits unchanged", () => {
    expect(padCmsId(12345)).toBe("12345");
  });
});

describe("formatCmsId", () => {
  it("appends FHIR for QI-Core measures", () => {
    expect(formatCmsId(2, "QI-Core v4.1.1")).toBe("0002FHIR");
    expect(formatCmsId(2222, "QI-Core v6.0.0")).toBe("2222FHIR");
  });

  it("omits FHIR for QDM measures", () => {
    expect(formatCmsId(2, "QDM v5.6")).toBe("0002");
    expect(formatCmsId(2222, "QDM v5.6")).toBe("2222");
  });

  it("handles null model", () => {
    expect(formatCmsId(2, null)).toBe("0002");
  });

  it("returns empty string when cmsId is missing", () => {
    expect(formatCmsId(null, "QI-Core v4.1.1")).toBe("");
    expect(formatCmsId(0, "QI-Core v4.1.1")).toBe("");
    expect(formatCmsId(undefined, "QDM v5.6")).toBe("");
  });
});
