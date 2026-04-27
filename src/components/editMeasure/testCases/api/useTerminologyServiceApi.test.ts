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

  it("gives no ValueSets when no bundle provided", () => {
    terminologyService.getValueSetsExpansionForBundle(null).then((data) => {
      expect(data.length).toEqual(0);
    });
  });

  it("gives expanded ValueSets for ValueSets in measure bundle", () => {
    axios.put = jest
      .fn()
      .mockResolvedValueOnce({ data: [officeVisitValueSet] });

    terminologyService
      .getValueSetsExpansionForBundle(officeVisitMeasureBundle)
      .then((data) => {
        expect(data.length).toEqual(1);
        expect(data[0].name).toEqual("Office Visit");
        expect(data[0].name).toEqual("Office Visit");
        expect(data[0].id).toEqual("2.16.840.1.113883.3.464.1003.101.12.1001");
        expect(data[0].compose.include[0].concept.length).toEqual(5);
      });
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
        includeDraft: "true",
        manifestExpansion: undefined,
        activeOnly: "false",
        valueSetParams: [{ oid: "2.16.840.1.113883.3.464.1003.101.12.1001" }],
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
        includeDraft: "true",
        manifestExpansion: {
          fullUrl: "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
          id: "mu2-update-2015-05-01",
        },
        activeOnly: "true",
        valueSetParams: [{ oid: "2.16.840.1.113883.3.464.1003.101.12.1001" }],
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

  it("Should return expansions for value set oids", () => {
    axios.put = jest
      .fn()
      .mockResolvedValue({ status: 200, data: [officeVisitValueSet] });
    const oid = "2.16.840.1.113883.3.464.1003.101.12.1001";
    terminologyService
      .getValueSetsExpansionForOids([oid])
      .then((valueSets: ValueSet[]) => {
        expect(valueSets.length).toEqual(1);
        expect(valueSets[0].name).toEqual("Office Visit");
        expect(valueSets[0].name).toEqual("Office Visit");
        expect(valueSets[0].id).toEqual(oid);
        expect(valueSets[0].compose.include[0].concept.length).toEqual(5);
      });
  });

  it("Should return empty expansion list if oids not provided", () => {
    axios.put = jest
      .fn()
      .mockResolvedValue({ status: 200, data: [officeVisitValueSet] });
    terminologyService
      .getValueSetsExpansionForOids([])
      .then((valueSets: ValueSet[]) => {
        expect(valueSets.length).toEqual(0);
      });
  });

  it("gives no ValueSets when no cqm measure provided", () => {
    terminologyService
      .getQdmValueSetsExpansion(
        null,
        testManifestExpansion,
        abortController.signal
      )
      .then((data) => {
        expect(data).toBeNull();
      });
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
        includeDraft: "yes",
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
        includeDraft: "yes",
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

  it("gives expanded ValueSets for ValueSets in cqm measure", () => {
    axios.put = jest
      .fn()
      .mockResolvedValueOnce({ data: cqm_measure_basic_valueset });

    terminologyService
      .getQdmValueSetsExpansion(
        cqm_measure_basic,
        testManifestExpansion,
        abortController.signal
      )
      .then((data: ValueSet[]) => {
        expect(axios.put).toBeCalledWith(
          "test.url/terminology/value-sets/expansion/qdm",
          {
            includeDraft: "yes",
            manifestExpansion: {
              fullUrl:
                "https://cts.nlm.nih.gov/fhir/Library/mu2-update-2015-05-01",
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
});
