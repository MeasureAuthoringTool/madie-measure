import axios from "../../../../api/axios-instance";
import { TerminologyServiceApi } from "./useTerminologyServiceApi";
import { officeVisitValueSet } from "./__mocks__/OfficeVisitValueSet";
import { officeVisitMeasureBundle } from "./__mocks__/OfficeVisitMeasureBundle";
import { cqm_measure_basic } from "../mockdata/qdm/CMS108/cqm_measure_basic";
import { cqm_measure_basic_valueset } from "../mockdata/qdm/CMS108/cqm_measure_basic_valueset";
import { Measure as CqmMeasure, ValueSet } from "cqm-models";
import * as _ from "lodash";
import { ManifestExpansion } from "@madie/madie-models";

jest.mock("../../../../api/axios-instance");

jest.mock("@madie/madie-util", () => ({
  getOidFromString: (oid) => oid.split("urn:oid:")[1],
}));

const testCqmMeasure: CqmMeasure = new CqmMeasure();

const testManifestExpansion: ManifestExpansion = {
  fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
  id: "mu2-update-2015-05-01",
};

describe("TerminologyServiceApi Tests", () => {
  let terminologyService: TerminologyServiceApi;
  let abortController: AbortController;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    terminologyService = new TerminologyServiceApi("test.url", getAccessToken);
    abortController = new AbortController();
  });

  it("gives no ValueSets when no bundle provided", async () => {
    const data = await terminologyService.getValueSetsExpansionForBundle(null);
    expect(data.length).toEqual(0);
  });

  it("gives expanded ValueSets for ValueSets in measure bundle", async () => {
    axios.put = jest
      .fn()
      .mockResolvedValueOnce({ data: [officeVisitValueSet] });

    const data = await terminologyService.getValueSetsExpansionForBundle(
      officeVisitMeasureBundle
    );
    expect(data.length).toEqual(1);
    expect(data[0].name).toEqual("Office Visit");
    expect(data[0].id).toEqual("2.16.840.1.113883.3.464.1003.101.12.1001");
    expect(data[0].compose.include[0].concept.length).toEqual(5);
  });

  it("gives expanded ValueSets for ValueSets in measure bundle when manifestExpansion is not provided (expansion type is Latest)", async () => {
    axios.put = jest
      .fn()
      .mockResolvedValueOnce({ data: [officeVisitValueSet] });

    const result = await terminologyService.getValueSetsExpansionForBundle(
      officeVisitMeasureBundle
    );

    expect(axios.put).toBeCalledWith(
      "test.url/terminology/value-sets/expansion/fhir",
      {
        includeDraft: true,
        manifestExpansion: undefined,
        activeOnly: "false",
        valueSetParams: [
          {
            oid: "2.16.840.1.113883.3.464.1003.101.12.1001",
            url: "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1001",
          },
        ],
      },
      { headers: { Authorization: "Bearer undefined" } }
    );

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("Office Visit");
    expect(result[0].id).toEqual("2.16.840.1.113883.3.464.1003.101.12.1001");
  });

  it("gives expanded ValueSets for ValueSets in measure bundle when manifestExpansion is provided (expansion type is Manifest)", async () => {
    axios.put = jest
      .fn()
      .mockResolvedValueOnce({ data: [officeVisitValueSet] });

    const result = await terminologyService.getValueSetsExpansionForBundle(
      officeVisitMeasureBundle,
      testManifestExpansion
    );

    expect(axios.put).toBeCalledWith(
      "test.url/terminology/value-sets/expansion/fhir",
      {
        includeDraft: true,
        manifestExpansion: {
          fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
          id: "mu2-update-2015-05-01",
        },
        activeOnly: "true",
        valueSetParams: [
          {
            oid: "2.16.840.1.113883.3.464.1003.101.12.1001",
            url: "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1001",
          },
        ],
      },
      { headers: { Authorization: "Bearer undefined" } }
    );

    expect(result.length).toEqual(1);
    expect(result[0].name).toEqual("Office Visit");
    expect(result[0].id).toEqual("2.16.840.1.113883.3.464.1003.101.12.1001");
  });

  it("throws an error when VSAC returns a NON-OK response when trying to fetch FHIR expansions with manifest", async () => {
    let message =
      "An error occurred, please try again. If the error persists, please contact the help desk. (003)";

    const response = {
      timestamp: "2025-04-15T22:47:15.924+00:00",
      message: "Failed to fetch batch resources from VSAC",
      status: 401,
      error: "Unauthorized",
    };
    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 404, data: response } });
    try {
      await terminologyService.getValueSetsExpansionForBundle(
        officeVisitMeasureBundle,
        testManifestExpansion
      );
    } catch (error) {
      expect(error.message).toContain(message);
      expect(error.message).toContain(response.message);
    }
  });

  test("throws an error when VSAC throws an error while trying to parse FHIR expansions with manifest", async () => {
    const response = {
      timestamp: "2025-04-15T22:17:12.205+00:00",
      message: "Failed to fetch VSAC value set expansions",
      status: 400,
      error: "Bad Request",
      validationErrors: {
        "/api": "Failed to fetch VSAC value set expansions",
      },
      diagnostic:
        "Content returned as invalid against the specification. Either the specification contains invalid elements, or the server failed to process due to internal errors.",
      manifestExpansionFullUrl:
        "http://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
      valueSetOid: "2.16.840.1.113762.1.4.1110.62",
    };

    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 400, data: response } });
    try {
      await terminologyService.getValueSetsExpansionForBundle(
        officeVisitMeasureBundle,
        testManifestExpansion
      );
    } catch (error) {
      expect(error.message).toContain(response.valueSetOid);
      expect(error.message).toContain("Manifest");
      expect(error.message).not.toContain("Latest");
      expect(error.message).toContain(response.manifestExpansionFullUrl);
      expect(error.message).toContain(`Per VSAC, \"${response.diagnostic}\"`);
    }
  });

  test("throws an error when VSAC throws an error while trying to parse FHIR expansions with no manifest", async () => {
    const response = {
      timestamp: "2025-04-15T22:17:12.205+00:00",
      message: "Failed to fetch VSAC value set expansions",
      status: 400,
      error: "Bad Request",
      validationErrors: {
        "/api": "Failed to fetch VSAC value set expansions",
      },
      diagnostic:
        "Content returned as invalid against the specification. Either the specification contains invalid elements, or the server failed to process due to internal errors.",
      manifestExpansionFullUrl:
        "http://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
      valueSetOid: "2.16.840.1.113762.1.4.1110.62",
    };

    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 400, data: response } });
    try {
      await terminologyService.getValueSetsExpansionForBundle(
        officeVisitMeasureBundle
      );
    } catch (error) {
      expect(error.message).toContain(response.valueSetOid);
      expect(error.message).toContain("Latest");
      expect(error.message).not.toContain("Manifest");
      expect(error.message).toContain(response.manifestExpansionFullUrl);
      expect(error.message).toContain(`Per VSAC, \"${response.diagnostic}\"`);
    }
  });

  it("Should return expansions for value set oids", async () => {
    axios.put = jest
      .fn()
      .mockResolvedValue({ status: 200, data: [officeVisitValueSet] });
    const oid = "2.16.840.1.113883.3.464.1003.101.12.1001";
    const valueSets: ValueSet[] =
      await terminologyService.getValueSetsExpansionForOids([oid]);
    expect(valueSets.length).toEqual(1);
    expect(valueSets[0].name).toEqual("Office Visit");
    expect(valueSets[0].id).toEqual(oid);
    expect(valueSets[0].compose.include[0].concept.length).toEqual(5);
  });

  it("Should return empty expansion list if oids not provided", async () => {
    axios.put = jest
      .fn()
      .mockResolvedValue({ status: 200, data: [officeVisitValueSet] });
    const valueSets: ValueSet[] =
      await terminologyService.getValueSetsExpansionForOids([]);
    expect(valueSets.length).toEqual(0);
  });

  it("gives no ValueSets when no cqm measure provided", async () => {
    const data = await terminologyService.getQdmValueSetsExpansion(
      null,
      testManifestExpansion,
      abortController.signal
    );
    expect(data).toBeNull();
  });

  it("Should call Terminology Service URL to fetch value set expansions when manifest Expansion feature flag is true and activeOnly is set to 'true' when manifestExpansion is truthy (expansion type is Manifest)", () => {
    axios.put = jest
      .fn()
      .mockResolvedValue({ data: cqm_measure_basic_valueset });
    terminologyService.getQdmValueSetsExpansion(
      cqm_measure_basic,
      testManifestExpansion,
      abortController.signal
    );
    expect(axios.put).toBeCalledWith(
      "test.url/terminology/value-sets/expansion/qdm",
      {
        includeDraft: true,
        manifestExpansion: {
          fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
          id: "mu2-update-2015-05-01",
        },
        activeOnly: "true",
        valueSetParams: [
          { oid: "2.16.840.1.113883.3.666.5.307" },
          { oid: "2.16.840.1.113883.3.464.1003.103.12.1001" },
        ],
      },
      {
        headers: { Authorization: "Bearer undefined" },
        signal: abortController.signal,
      }
    );
  });

  it("Should call Terminology Service URL to fetch value set expansions when manifest Expansion feature flag is true and activeOnly is set to 'false' when manifestExpansion is falsy (expansion type is Latest)", () => {
    axios.put = jest
      .fn()
      .mockResolvedValue({ data: cqm_measure_basic_valueset });
    terminologyService.getQdmValueSetsExpansion(
      cqm_measure_basic,
      null,
      abortController.signal
    );
    expect(axios.put).toBeCalledWith(
      "test.url/terminology/value-sets/expansion/qdm",
      {
        includeDraft: true,
        manifestExpansion: null,
        activeOnly: "false",
        valueSetParams: [
          { oid: "2.16.840.1.113883.3.666.5.307" },
          { oid: "2.16.840.1.113883.3.464.1003.103.12.1001" },
        ],
      },
      {
        headers: { Authorization: "Bearer undefined" },
        signal: abortController.signal,
      }
    );
  });

  it("gives expanded ValueSets for ValueSets in cqm measure", async () => {
    axios.put = jest
      .fn()
      .mockResolvedValueOnce({ data: cqm_measure_basic_valueset });

    const data: ValueSet[] = await terminologyService.getQdmValueSetsExpansion(
      cqm_measure_basic,
      testManifestExpansion,
      abortController.signal
    );
    expect(axios.put).toBeCalledWith(
      "test.url/terminology/value-sets/expansion/qdm",
      {
        includeDraft: true,
        manifestExpansion: {
          fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
          id: "mu2-update-2015-05-01",
        },
        activeOnly: "true",
        valueSetParams: [
          { oid: "2.16.840.1.113883.3.666.5.307" },
          { oid: "2.16.840.1.113883.3.464.1003.103.12.1001" },
        ],
      },
      {
        headers: { Authorization: "Bearer undefined" },
        signal: abortController.signal,
      }
    );
    expect(data.length).toEqual(2);
    expect(data[0].display_name).toEqual("Encounter Inpatient");
    expect(data[0].oid).toEqual("2.16.840.1.113883.3.666.5.307");
    expect(data[0].concepts.length).toEqual(3);
  });

  it("throws an error if the request was cancelled during QDM expansions with manifest", async () => {
    const error: Error & { code?: string } = new Error("Request canceled");
    error.code = "ERR_CANCELED";

    axios.put = jest.fn().mockRejectedValue(error);

    try {
      await terminologyService.getQdmValueSetsExpansion(
        cqm_measure_basic,
        testManifestExpansion,
        abortController.signal
      );
    } catch (err: any) {
      expect(err.code).toBe("ERR_CANCELED");
    }
  });

  it("throws an error when VSAC returns a NON-OK response when trying to fetch QDM expansions with manifest", async () => {
    let message =
      "An error occurred, please try again. If the error persists, please contact the help desk. (004)";

    const response = {
      timestamp: "2025-04-15T22:47:15.924+00:00",
      message: "Failed to fetch batch resources from VSAC",
      status: 401,
      error: "Unauthorized",
    };
    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 404, data: response } });
    try {
      await terminologyService.getQdmValueSetsExpansion(
        cqm_measure_basic,
        testManifestExpansion,
        abortController.signal
      );
    } catch (error) {
      expect(error.message).toContain(message);
      expect(error.message).toContain(response.message);
    }
  });

  test("throws an error when VSAC throws an error while trying to parse QDM expansions with manifest", async () => {
    const response = {
      timestamp: "2025-04-15T22:17:12.205+00:00",
      message: "Failed to fetch VSAC value set expansions",
      status: 400,
      error: "Bad Request",
      validationErrors: {
        "/api": "Failed to fetch VSAC value set expansions",
      },
      diagnostic:
        "Content returned as invalid against the specification. Either the specification contains invalid elements, or the server failed to process due to internal errors.",
      manifestExpansionFullUrl:
        "http://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
      valueSetOid: "2.16.840.1.113762.1.4.1110.62",
    };

    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 400, data: response } });
    try {
      await terminologyService.getQdmValueSetsExpansion(
        cqm_measure_basic,
        testManifestExpansion,
        abortController.signal
      );
    } catch (error) {
      expect(error.message).toContain(response.valueSetOid);
      expect(error.message).toContain("Manifest");
      expect(error.message).not.toContain("Latest");
      expect(error.message).toContain(response.manifestExpansionFullUrl);
      expect(error.message).toContain(`Per VSAC, \"${response.diagnostic}\"`);
    }
  });

  test("throws an error when VSAC throws an error while trying to parse QDM expansions with no manifest", async () => {
    const response = {
      timestamp: "2025-04-15T22:17:12.205+00:00",
      message: "Failed to fetch VSAC value set expansions",
      status: 400,
      error: "Bad Request",
      validationErrors: {
        "/api": "Failed to fetch VSAC value set expansions",
      },
      diagnostic:
        "Content returned as invalid against the specification. Either the specification contains invalid elements, or the server failed to process due to internal errors.",
      manifestExpansionFullUrl:
        "http://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
      valueSetOid: "2.16.840.1.113762.1.4.1110.62",
    };

    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 400, data: response } });
    try {
      await terminologyService.getQdmValueSetsExpansion(
        cqm_measure_basic,
        null,
        abortController.signal
      );
    } catch (error) {
      expect(error.message).toContain(response.valueSetOid);
      expect(error.message).toContain("Latest");
      expect(error.message).not.toContain("Manifest");
      expect(error.message).toContain(response.manifestExpansionFullUrl);
      expect(error.message).toContain(`Per VSAC, \"${response.diagnostic}\"`);
    }
  });

  it("test getQdmValueSetsExpansion no search param", async () => {
    const result = await terminologyService.getQdmValueSetsExpansion(
      testCqmMeasure,
      testManifestExpansion,
      abortController.signal
    );
    expect(_.isEmpty(result)).toBe(true);
  });

  it("test getOidFromString no match", () => {
    const result = terminologyService.getOidFromString("test");
    expect(result).toBeNull();
  });

  it("test getValueSetsOIdsFromBundle if bundle is null", () => {
    const result = terminologyService.getValueSetsOIdsFromBundle(null);
    expect(_.isEmpty(result)).toBe(true);
  });

  it("test getValueSetsOIdsFromBundle no bundle entry available", () => {
    const bundle = {
      resourceType: "Bundle",
    } as fhir4.Bundle;
    const result = terminologyService.getValueSetsOIdsFromBundle(bundle);
    expect(_.isEmpty(result)).toBe(true);
  });

  it("test getValueSetsOIdsFromBundle if measure entry not found", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Library",
            id: "test",
          },
        } as fhir4.BundleEntry,
      ],
    } as fhir4.Bundle;
    const result = terminologyService.getValueSetsOIdsFromBundle(bundle);
    expect(_.isEmpty(result)).toBe(true);
  });

  it("test getCqlCodesForDRCs", () => {
    const result = terminologyService.getCqlCodesForDRCs(cqm_measure_basic);
    expect(result.length).toBe(3);

    expect(result[0].cqlCode.code).toBe("drc-bdb8b89536181a411ad034378b7ceef6");
    expect(result[0].cqlCode.system).toBe("LOINC");
    expect(result[0].cqlCode.display).toBe("Housing status");
    expect(result[0].codeSystemOid).toBe("2.16.840.1.113883.6.1");
    expect(result[1].cqlCode.code).toBe("160734000");
    expect(result[1].cqlCode.system).toBe("SNOMEDCT");
    expect(result[1].cqlCode.display).toBe("Lives in a nursing home (finding)");
    expect(result[1].codeSystemOid).toBe("2.16.840.1.113883.6.96");
    expect(result[2].cqlCode.code).toBe("98181-1");
    expect(result[2].cqlCode.system).toBe("LOINC");
    expect(result[2].cqlCode.display).toBe("Medical equipment used");
    expect(result[2].codeSystemOid).toBe("2.16.840.1.113883.6.1");
  });

  it("test getCqlCodesForDRCs no codes", () => {
    const result = terminologyService.getCqlCodesForDRCs(testCqmMeasure);
    expect(_.isEmpty(result)).toBe(true);
  });

  it("test getDrcOid", () => {
    const result = terminologyService.getDrcOid(
      cqm_measure_basic,
      "drc-bdb8b89536181a411ad034378b7ceef6"
    );
    expect(result).toBe("drc-bdb8b89536181a411ad034378b7ceef6");
  });

  it("test getValueSetsForDRCs", () => {
    const result: ValueSet[] =
      terminologyService.getValueSetsForDRCs(cqm_measure_basic);

    expect(result.length).toBe(3);

    expect(result[0].oid).toBe("drc-bdb8b89536181a411ad034378b7ceef6");
    expect(result[0].concepts[0].code).toBe(
      "drc-bdb8b89536181a411ad034378b7ceef6"
    );
    expect(result[0].concepts[0].code_system_name).toBe("LOINC");
    expect(result[0].concepts[0].display_name).toBe("Housing status");
    expect(result[0].concepts[0].code_system_oid).toBe("2.16.840.1.113883.6.1");

    expect(result[1].oid).not.toBe("drc-bdb8b89536181a411ad034378b7ceef6");
    expect(result[1].oid).toContain("drc-");
  });

  it("test getValueSetsForDRCs no value sets", () => {
    const result = terminologyService.getValueSetsForDRCs(testCqmMeasure);
    expect(_.isEmpty(result)).toBe(true);
  });

  it("Should return empty expansion list if oids is null", async () => {
    const result = await terminologyService.getValueSetsExpansionForOids(null);
    expect(result).toEqual([]);
  });

  it("should call getManifestList and return manifest data", async () => {
    const mockManifests = [
      { id: "mu2-update-2015-05-01", fullUrl: "https://example.com" },
    ];
    axios.get = jest.fn().mockResolvedValue({ data: mockManifests });

    const result = await terminologyService.getManifestList();
    expect(axios.get).toBeCalledWith("test.url/terminology/manifest-list", {
      headers: { Authorization: "Bearer undefined" },
    });
    expect(result.data).toEqual(mockManifests);
  });

  it("should throw error when getManifestList fails", async () => {
    axios.get = jest.fn().mockRejectedValue(new Error("Network error"));

    await expect(terminologyService.getManifestList()).rejects.toThrow(
      "Network error"
    );
  });

  it("test getOidFromString with valid OID string", () => {
    const result = terminologyService.getOidFromString(
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1001"
    );
    expect(result).toBe("2.16.840.1.113883.3.464.1003.101.12.1001");
  });

  it("test getValueSetsOIdsFromBundle with Library having relatedArtifacts", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Library",
            id: "test-lib",
            type: { coding: [] },
            relatedArtifact: [
              {
                type: "depends-on",
                resource:
                  "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1001",
              },
              {
                type: "depends-on",
                resource: "http://some-other-resource/Library/test",
              },
            ],
          },
        } as fhir4.BundleEntry,
      ],
    } as fhir4.Bundle;
    const result = terminologyService.getValueSetsOIdsFromBundle(bundle);
    expect(result.length).toBe(1);
    expect(result[0].oid).toBe("2.16.840.1.113883.3.464.1003.101.12.1001");
  });

  it("test getValueSetsOIdsFromBundle with Library having no relatedArtifacts", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Library",
            id: "test-lib",
            type: { coding: [] },
          },
        } as fhir4.BundleEntry,
      ],
    } as fhir4.Bundle;
    const result = terminologyService.getValueSetsOIdsFromBundle(bundle);
    expect(result).toEqual([]);
  });

  it("test getDrcOid returns undefined when code not found", () => {
    const result = terminologyService.getDrcOid(
      cqm_measure_basic,
      "non-existent-code"
    );
    expect(result).toBeUndefined();
  });

  it("should handle getExpansion error with response message but no diagnostic", async () => {
    const response = {
      timestamp: "2025-04-15T22:47:15.924+00:00",
      message: "Some VSAC error message",
      status: 500,
      error: "Internal Server Error",
    };
    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 500, data: response } });
    try {
      await terminologyService.getValueSetsExpansionForBundle(
        officeVisitMeasureBundle
      );
    } catch (error) {
      expect(error.message).toContain("(003)");
      expect(error.message).toContain("Some VSAC error message");
      expect(error.message).not.toContain("Per VSAC");
    }
  });

  it("should handle QDM expansion error with response message but no diagnostic", async () => {
    const response = {
      timestamp: "2025-04-15T22:47:15.924+00:00",
      message: "Some QDM VSAC error",
      status: 500,
      error: "Internal Server Error",
    };
    axios.put = jest
      .fn()
      .mockRejectedValue({ response: { status: 500, data: response } });
    try {
      await terminologyService.getQdmValueSetsExpansion(
        cqm_measure_basic,
        testManifestExpansion,
        abortController.signal
      );
    } catch (error) {
      expect(error.message).toContain("(004)");
      expect(error.message).toContain("Some QDM VSAC error");
      expect(error.message).not.toContain("Per VSAC");
    }
  });

  it("should extract FHIR CQL codes for DRCs from measure bundle", () => {
    const measureBundle = {
      entry: [
        {
          resource: {
            resourceType: "Measure",
            contained: [
              {
                resourceType: "Library",
                extension: [
                  {
                    url: "http://example.com/directReferenceCode",
                    valueCoding: {
                      code: "code1",
                      system: "http://snomed.info/sct",
                      display: "SNOMED Code",
                    },
                  },
                  {
                    url: "http://example.com/directReferenceCode",
                    valueCoding: {
                      code: "code2",
                      system: "http://loinc.org",
                      display: "LOINC Code",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    } as fhir4.Bundle;

    const result = terminologyService.getFhirCqlCodesForDRCs(measureBundle);

    expect(result.length).toBe(2);
    expect(result[0].cqlCode.code).toBe("code1");
    expect(result[0].cqlCode.system).toBe("http://snomed.info/sct");
    expect(result[0].codeSystemOid).toBe("http://snomed.info/sct");
    expect(result[1].cqlCode.code).toBe("code2");
    expect(result[1].cqlCode.system).toBe("http://loinc.org");
    expect(result[1].codeSystemOid).toBe("http://loinc.org");
  });

  it("should return empty array when no DRCs in FHIR measure bundle", () => {
    const measureBundle = {
      entry: [
        {
          resource: {
            resourceType: "Measure",
            contained: [
              {
                resourceType: "Library",
                extension: [],
              },
            ],
          },
        },
      ],
    } as fhir4.Bundle;

    const result = terminologyService.getFhirCqlCodesForDRCs(measureBundle);

    expect(result.length).toBe(0);
  });

  it("should handle FHIR measure bundle with no contained libraries", () => {
    const measureBundle = {
      entry: [
        {
          resource: {
            resourceType: "Measure",
            contained: [],
          },
        },
      ],
    } as fhir4.Bundle;

    const result = terminologyService.getFhirCqlCodesForDRCs(measureBundle);

    expect(result.length).toBe(0);
  });

  it("should handle FHIR DRCs with version in valueCoding", () => {
    const measureBundle = {
      entry: [
        {
          resource: {
            resourceType: "Measure",
            contained: [
              {
                resourceType: "Library",
                extension: [
                  {
                    url: "http://example.com/directReferenceCode",
                    valueCoding: {
                      code: "code1",
                      system: "http://snomed.info/sct",
                      version: "2023-03-01",
                      display: "SNOMED Code",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    } as fhir4.Bundle;

    const result = terminologyService.getFhirCqlCodesForDRCs(measureBundle);

    expect(result[0].cqlCode.version).toBe("2023-03-01");
  });

  it("should handle FHIR DRCs without version in valueCoding", () => {
    const measureBundle = {
      entry: [
        {
          resource: {
            resourceType: "Measure",
            contained: [
              {
                resourceType: "Library",
                extension: [
                  {
                    url: "http://example.com/directReferenceCode",
                    valueCoding: {
                      code: "code1",
                      system: "http://snomed.info/sct",
                      display: "SNOMED Code",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    } as fhir4.Bundle;

    const result = terminologyService.getFhirCqlCodesForDRCs(measureBundle);

    expect(result[0].cqlCode.version).toBe("N/A");
  });

  it("should create DRC value sets with correct structure from FHIR bundle", () => {
    const measureBundle = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Measure",
            contained: [
              {
                resourceType: "Library",
                id: "lib1",
                extension: [
                  {
                    name: "DRC",
                    url: "http://example.com/directReferenceCode",
                    valueCoding: {
                      code: "code1",
                      system: "http://snomed.info/sct",
                      display: "Test Code 1",
                    },
                  },
                ],
              },
            ],
          },
        } as fhir4.BundleEntry,
      ],
    } as unknown as Bundle;

    const result = terminologyService.getFhirValueSetsForDRCs(measureBundle);

    expect(result.length).toBeGreaterThan(0);
    result.forEach((vs) => {
      expect(vs.id).toMatch(/^drc-/);
      expect(vs.expansion).toBeDefined();
      expect(vs.expansion.contains).toBeDefined();
      expect(vs.expansion.contains.length).toBeGreaterThan(0);
      expect(vs.url).toMatch(/^drc-/);
      expect(vs.title).toBeDefined();
      expect(vs.name).toBeDefined();
    });
  });

  it("should return empty array when FHIR bundle has no DRC codes", () => {
    const emptyBundle = {
      resourceType: "Bundle",
      entry: [],
    } as unknown as Bundle;

    const result = terminologyService.getFhirValueSetsForDRCs(emptyBundle);

    expect(result).toEqual([]);
  });

  it("should return empty array when FHIR bundle is null", () => {
    const result = terminologyService.getFhirValueSetsForDRCs(null);

    expect(result).toEqual([]);
  });

  it("should create separate DRC value sets for different CQL codes", () => {
    const measureBundle = officeVisitMeasureBundle;

    const result = terminologyService.getFhirValueSetsForDRCs(measureBundle);

    const uniqueIds = new Set(result.map((vs) => vs.id));
    expect(uniqueIds.size).toBe(result.length);
  });

  it("should handle FHIR bundle without contained libraries", () => {
    const bundleWithoutLibraries = {
      resourceType: "Bundle",
      entry: [
        {
          resource: {
            resourceType: "Measure",
            id: "test-measure",
            contained: [],
          },
        } as fhir4.BundleEntry,
      ],
    } as unknown as Bundle;

    const result = terminologyService.getFhirValueSetsForDRCs(
      bundleWithoutLibraries
    );

    expect(result).toEqual([]);
  });

  it("should set all required FHIR ValueSet properties for DRC", () => {
    const measureBundle = officeVisitMeasureBundle;

    const result = terminologyService.getFhirValueSetsForDRCs(measureBundle);

    result.forEach((vs) => {
      expect(vs).toHaveProperty("id");
      expect(vs).toHaveProperty("expansion");
      expect(vs).toHaveProperty("url");
      expect(vs).toHaveProperty("title");
      expect(vs).toHaveProperty("name");
    });
  });
});
