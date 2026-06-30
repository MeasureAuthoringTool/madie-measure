import { buildInsertedProfiles } from "./insertProfilesFromTestCase";

jest.mock("uuid", () => {
  let idx = 0;
  const ids = [
    "test-case-set-id",
    "new-enc-id",
    "new-obs-id",
    "new-prac-id",
    "new-med-id",
  ];
  return {
    v4: jest.fn(() => ids[idx++]),
  };
});

describe("buildInsertedProfiles", () => {
  it("copies non-patient resources, regenerates ids, and remaps references", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "https://madie.cms.gov/Patient/current-patient-id",
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
            birthDate: "1900-01-01",
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "https://madie.cms.gov/Patient/source-patient-id",
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
            gender: "female",
            name: [{ family: "FromSelected" }],
          },
        },
        {
          fullUrl: "https://madie.cms.gov/Encounter/source-enc-id",
          resource: {
            resourceType: "Encounter",
            id: "source-enc-id",
            subject: { reference: "Patient/source-patient-id" },
          },
        },
        {
          fullUrl: "https://madie.cms.gov/Observation/source-obs-id",
          resource: {
            resourceType: "Observation",
            id: "source-obs-id",
            subject: { reference: "Patient/source-patient-id" },
            encounter: { reference: "Encounter/source-enc-id" },
            recorder: { reference: "Practitioner/example" },
            suspectEntity: [
              {
                instance: {
                  reference: "Medication/example",
                },
              },
            ],
          },
        },
        {
          fullUrl: "https://madie.cms.gov/Practitioner/example",
          resource: {
            resourceType: "Practitioner",
            id: "example",
          },
        },
        {
          fullUrl: "https://madie.cms.gov/Medication/example",
          resource: {
            resourceType: "Medication",
            id: "example",
          },
        },
      ],
    };

    const insertedProfiles = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle),
      {
        measureName: "Measure Alpha",
        measureVersion: "1.0.0",
        measureId: "measure-1",
        testCaseGroup: "Group A",
        testCaseTitle: "Selected Test Case",
        testCaseDescription: "Selected description",
        testCaseId: "tc-source",
      }
    );
    const bundle = insertedProfiles?.bundle;
    const componentProfiles = insertedProfiles?.componentProfiles ?? [];

    expect(bundle).toBeTruthy();
    expect((bundle as any).componentProfiles).toBeUndefined();
    expect(bundle!.entry).toHaveLength(5);

    const patientEntry = bundle!.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );

    const copiedEncounter = bundle!.entry.find(
      (entry) => entry.resource?.resourceType === "Encounter"
    );
    const copiedObservation = bundle!.entry.find(
      (entry) => entry.resource?.resourceType === "Observation"
    );
    const copiedPractitioner = bundle!.entry.find(
      (entry) => entry.resource?.resourceType === "Practitioner"
    );
    const copiedMedication = bundle!.entry.find(
      (entry) => entry.resource?.resourceType === "Medication"
    );

    expect(patientEntry.resource.id).toBe("current-patient-id");
    expect(patientEntry.resource.birthDate).toBe("1900-01-01");
    expect(patientEntry.resource.gender).toBeUndefined();
    expect(patientEntry.resource.name).toBeUndefined();

    expect(copiedEncounter.resource.id).toBe("new-enc-id");
    expect(copiedObservation.resource.id).toBe("new-obs-id");
    expect(copiedPractitioner.resource.id).toBe("new-prac-id");
    expect(copiedMedication.resource.id).toBe("new-med-id");

    expect(copiedEncounter.resource.subject.reference).toBe(
      "Patient/current-patient-id"
    );
    expect(copiedObservation.resource.subject.reference).toBe(
      "Patient/current-patient-id"
    );
    expect(copiedObservation.resource.encounter.reference).toBe(
      "Encounter/new-enc-id"
    );
    expect(copiedObservation.resource.recorder.reference).toBe(
      "Practitioner/new-prac-id"
    );
    expect(copiedObservation.resource.suspectEntity[0].instance.reference).toBe(
      "Medication/new-med-id"
    );

    expect(componentProfiles).toHaveLength(4);
    expect(componentProfiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          measureName: "Measure Alpha",
          measureVersion: "1.0.0",
          measureId: "measure-1",
          testCaseGroup: "Group A",
          testCaseTitle: "Selected Test Case",
          testCaseDescription: "Selected description",
          testCaseId: "tc-source",
          testCaseSetId: expect.any(String),
          originalProfileId: "source-enc-id",
          newProfileId: "new-enc-id",
        }),
      ])
    );
  });

  it("returns null for invalid bundle json", () => {
    const result = buildInsertedProfiles("not-json", "{}");
    expect(result).toBeNull();
  });

  it("returns null when current bundle has no patient", () => {
    const currentBundleNoPatient = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "https://madie.cms.gov/Encounter/enc-123",
          resource: {
            resourceType: "Encounter",
            id: "enc-123",
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "https://madie.cms.gov/Patient/pat-123",
          resource: {
            resourceType: "Patient",
            id: "pat-123",
            gender: "male",
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundleNoPatient),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeNull();
  });

  it("returns null when selected bundle has no patient", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "https://madie.cms.gov/Patient/current-pat-id",
          resource: {
            resourceType: "Patient",
            id: "current-pat-id",
            gender: "female",
          },
        },
      ],
    };

    const selectedBundleNoPatient = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "https://madie.cms.gov/Encounter/enc-456",
          resource: {
            resourceType: "Encounter",
            id: "enc-456",
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundleNoPatient)
    );

    expect(result).toBeTruthy();
    expect(result.bundle.entry).toHaveLength(2);

    const patientEntry = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );
    expect(patientEntry.resource.id).toBe("current-pat-id");
    expect(patientEntry.resource.gender).toBe("female");
  });

  it("preserves non-FHIR reference patterns and non-string references", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
          },
        },
        {
          resource: {
            resourceType: "Observation",
            id: "obs-id",
            method: { text: "direct-observation" },
            referrer: { reference: 123 },
            notes: "Patient/invalid/path",
            relatedUrl: "http://example.com",
            value: { reference: "Patient/current-patient-id" },
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeTruthy();

    const obsEntry = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Observation"
    );

    expect(obsEntry.resource.method.text).toBe("direct-observation");
    expect(obsEntry.resource.referrer.reference).toBe(123);
    expect(obsEntry.resource.notes).toBe("Patient/invalid/path");
    expect(obsEntry.resource.relatedUrl).toBe("http://example.com");
    expect(obsEntry.resource.value.reference).toBe(
      "Patient/current-patient-id"
    );
  });

  it("handles fullUrl with urn:uuid pattern", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "urn:uuid:current-patient-uuid",
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "urn:uuid:source-patient-uuid",
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
          },
        },
        {
          fullUrl: "urn:uuid:enc-uuid",
          resource: {
            resourceType: "Encounter",
            id: "enc-id",
            subject: { reference: "Patient/source-patient-id" },
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeTruthy();

    const patientEntry = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );
    expect(patientEntry.fullUrl).toBe("urn:uuid:current-patient-uuid");

    const encEntry = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Encounter"
    );
    expect(encEntry.fullUrl).toMatch(/urn:uuid:/);
  });

  it("handles fullUrl with short path patterns", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "http",
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          fullUrl: "http",
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
          },
        },
        {
          fullUrl: "http",
          resource: {
            resourceType: "Encounter",
            id: "enc-id",
            subject: { reference: "Patient/source-patient-id" },
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeTruthy();

    const patientEntry = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );
    expect(patientEntry.fullUrl).toBe("http");

    const encEntry = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Encounter"
    );
    expect(encEntry.fullUrl).toMatch(/urn:uuid:/);
  });

  it("appends new entries to existing non-patient entries and keeps current patient", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
            birthDate: "1950-01-01",
            name: [{ family: "Current" }],
          },
        },
        {
          resource: {
            resourceType: "Condition",
            id: "existing-condition-id",
            subject: { reference: "Patient/current-patient-id" },
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
            gender: "male",
            name: [{ family: "Selected" }],
          },
        },
        {
          resource: {
            resourceType: "Encounter",
            id: "enc-id",
            subject: { reference: "Patient/source-patient-id" },
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeTruthy();
    expect(result.bundle.entry).toHaveLength(3);

    const patient = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );
    expect(patient.resource.id).toBe("current-patient-id");
    expect(patient.resource.birthDate).toBe("1950-01-01");
    expect(patient.resource.gender).toBeUndefined();
    expect(patient.resource.name[0].family).toBe("Current");

    const existingCondition = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Condition"
    );
    expect(existingCondition.resource.id).toBe("existing-condition-id");

    const encounter = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Encounter"
    );
    expect(encounter.resource.id).not.toBe("enc-id");
    expect(encounter.resource.subject.reference).toBe(
      "Patient/current-patient-id"
    );
  });

  it("skips entries in reference map building when resourceType or id is missing", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
          },
        },
        {
          resource: {
            resourceType: "Encounter",
            id: "enc-id",
            subject: { reference: "Patient/source-patient-id" },
          },
        },
        {
          resource: {
            resourceType: "Medication",
            id: "med-id",
            code: { text: "Aspirin" },
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeTruthy();
    expect(result.bundle.entry).toHaveLength(3);

    const patient = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );
    expect(patient.resource.id).toBe("current-patient-id");

    const encounter = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Encounter"
    );
    expect(encounter).toBeTruthy();
    expect(encounter.resource.subject.reference).toBe(
      "Patient/current-patient-id"
    );

    const medication = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Medication"
    );
    expect(medication).toBeTruthy();
  });

  it("returns empty copied entries when all selected entries are patients", () => {
    const currentBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "current-patient-id",
            name: [{ family: "Current" }],
          },
        },
      ],
    };

    const selectedBundle = {
      resourceType: "Bundle",
      type: "collection",
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "source-patient-id",
            name: [{ family: "Source" }],
          },
        },
      ],
    };

    const result = buildInsertedProfiles(
      JSON.stringify(currentBundle),
      JSON.stringify(selectedBundle)
    );

    expect(result).toBeTruthy();
    expect(result.bundle.entry).toHaveLength(1);

    const patient = result.bundle.entry.find(
      (entry) => entry.resource?.resourceType === "Patient"
    );
    expect(patient.resource.id).toBe("current-patient-id");
    expect(patient.resource.name[0].family).toBe("Current");
  });
});
