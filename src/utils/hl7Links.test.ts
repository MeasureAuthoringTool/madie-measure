import { getHl7ProfileLink } from "./hl7Links";

describe("getHl7ProfileLink", () => {
  it("returns an STU6 QI-Core URL when measureModel is QI-Core 6.0", () => {
    expect(getHl7ProfileLink("qicore-patient", "QI-Core 6.0")).toBe(
      "https://hl7.org/fhir/us/qicore/STU6/StructureDefinition-qicore-patient.html"
    );
  });

  it("returns an STU7 QI-Core URL when measureModel is QI-Core 7.0", () => {
    expect(getHl7ProfileLink("qicore-patient", "QI-Core 7.0")).toBe(
      "https://hl7.org/fhir/us/qicore/STU7/StructureDefinition-qicore-patient.html"
    );
  });

  it("returns a US Core URL for us-core profile IDs", () => {
    expect(getHl7ProfileLink("us-core-patient", "QI-Core 6.0")).toBe(
      "https://hl7.org/fhir/us/core/StructureDefinition-us-core-patient.html"
    );
  });

  it.each([
    "us-quality-core-patient",
    "http://fhir.org/guides/onc/us-quality-core/StructureDefinition/us-quality-core-patient",
  ])("returns a US Quality Core URL for %s", (profileId) => {
    expect(getHl7ProfileLink(profileId, "US Quality Core v0.5.0")).toBe(
      "https://fhir.org/guides/onc/us-quality-core/en/StructureDefinition-us-quality-core-patient.html"
    );
  });

  it("returns a base FHIR URL for a canonical profile", () => {
    expect(
      getHl7ProfileLink(
        "http://hl7.org/fhir/StructureDefinition/Patient",
        "US Quality Core v0.5.0"
      )
    ).toBe("https://hl7.org/fhir/Patient.html");
  });

  it("returns a fallback FHIR URL for unknown profile IDs", () => {
    expect(getHl7ProfileLink("custom-resource", "QI-Core 6.0")).toBe(
      "https://hl7.org/fhir/Resource.html"
    );
  });
});
