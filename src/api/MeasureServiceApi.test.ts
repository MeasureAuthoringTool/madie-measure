import { MeasureServiceApi } from "./useMeasureServiceApi";
import { libraryElm } from "./__mocks__/cqlLibraryElm";
import axios from "axios";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
import {
  EndorsementOrganization,
  Measure,
  Model,
  Organization,
} from "@madie/madie-models";

describe("MeasureServiceApi Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseUrl = "madie.com";
  const accessToken = jest.fn();
  const measureServiceApi = new MeasureServiceApi(baseUrl, accessToken);

  it("test fetchMeasures success", async () => {
    const measures: Measure[] = [
      {
        id: "IDIDID1",
        measureName: "measure - A",
      } as Measure,
      {
        id: "IDIDID2",
        measureName: "measure - B",
      } as Measure,
      {
        id: "IDIDID3",
        measureName: "measure - C",
      } as Measure,
    ];
    const resp = { status: 200, data: measures };
    mockedAxios.get.mockResolvedValue(resp);

    const measuresList = await measureServiceApi.fetchMeasures(true, 25, 0);
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(measuresList).toEqual(measures);
  });

  it("test fetchMeasures fail", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.fetchMeasures(true, 25, 0);
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch measures");
    }
  });

  it("handles fetch measure draft status rejection", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.fetchMeasureDraftStatuses([
        "aaaaa",
        "bbbbb",
        "ccccc",
      ]);
      expect(false).toBeTruthy(); // expecting a failure
    } catch (error) {
      expect(error.message).toBe("Unable to fetch measure draft statuses");
    }
  });

  it("fetches measure draft statuses", async () => {
    const resp = {
      status: 200,
      data: {
        aaaaa: true,
        bbbbb: true,
        ccccc: false,
      },
    };
    mockedAxios.get.mockResolvedValueOnce(resp);

    try {
      const statuses = await measureServiceApi.fetchMeasureDraftStatuses([
        "aaaaa",
        "bbbbb",
        "ccccc",
      ]);
      expect(statuses).toEqual(resp.data);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch measure draft statuses");
    }
  });

  it("get return types for all cql definitions when no definition is found", () => {
    let returnTypes = measureServiceApi.getReturnTypesForAllCqlDefinitions("");
    expect(returnTypes).toEqual({});

    returnTypes =
      measureServiceApi.getReturnTypesForAllCqlDefinitions('{"library":{}}');
    expect(returnTypes).toEqual({});

    returnTypes = measureServiceApi.getReturnTypesForAllCqlDefinitions(
      '{"library":{"statements": {}}}'
    );
    expect(returnTypes).toEqual({});
  });

  it("get return types for all cql definitions", () => {
    let returnTypes =
      measureServiceApi.getReturnTypesForAllCqlDefinitions(libraryElm);
    expect(returnTypes["initialPopulation"]).toEqual("Boolean");

    expect(returnTypes["firstBladderCancerStagingProcedure"]).toEqual(
      "Procedure"
    );

    expect(returnTypes["numerator"]).toEqual("Boolean");

    expect(returnTypes["firstBcgAdministered"]).toEqual(
      "MedicationAdministration"
    );

    expect(returnTypes["normalizePeriod"]).toEqual("DateTime");
  });

  it("build error message from server side error response", () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          message: "Invalid group",
          validationErrors: undefined,
        },
      },
    };
    const baseMessage = "default error";
    let message = measureServiceApi.buildErrorMessage(
      errorResponse,
      baseMessage
    );
    expect(message).toEqual("Invalid group");

    errorResponse.response.data.validationErrors = { group: "group error" };
    message = measureServiceApi.buildErrorMessage(errorResponse, baseMessage);
    expect(message).toEqual(
      "Missing required populations for selected scoring type."
    );
  });

  it("test searchMeasuresByMeasureNameOrEcqmTitle success", async () => {
    const measures: Measure[] = [
      {
        id: "IDIDID1",
        measureName: "measure - A",
      } as Measure,
      {
        id: "IDIDID2",
        measureName: "measure - B",
      } as Measure,
      {
        id: "IDIDID3",
        measureName: "measure - C",
      } as Measure,
    ];
    const resp = { status: 200, data: measures };
    mockedAxios.get.mockResolvedValue(resp);

    const measuresList =
      await measureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle(
        true,
        25,
        0,
        "test"
      );
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(measuresList).toEqual(measures);
  });

  it("test searchMeasuresByMeasureNameOrEcqmTitle fail", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle(
        true,
        25,
        0,
        "test"
      );
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to search measures");
    }
  });

  it("test getAllPopulationBasisOptions error", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.getAllPopulationBasisOptions();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch population basis options");
    }
  });

  it("test getAllOrganizations success", async () => {
    const organizations: Organization[] = [
      {
        id: "testId1",
        name: "test organization 1",
        oid: "testOid1",
      },
    ];
    const resp = { status: 200, data: organizations };
    mockedAxios.get.mockResolvedValueOnce(resp);

    const returnedOrgList = measureServiceApi.getAllOrganizations();

    expect(mockedAxios.get).toBeCalledTimes(1);
    expect((await returnedOrgList).length).toEqual(1);
  });

  it("test getAllOrganizations error", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.getAllOrganizations();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch organizations");
    }
  });

  it("test getAllOrganizations error when returned list is empty", async () => {
    const resp = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValueOnce(resp);

    try {
      await measureServiceApi.getAllOrganizations();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch organizations");
    }
  });

  it("test createVersion success", async () => {
    const measure: Measure = {
      id: "testId",
      measureName: "measure - A",
      version: "1.001",
      revisionNumber: 1,
    } as unknown as Measure;

    const resp = { status: 200, data: measure };
    mockedAxios.put.mockResolvedValue(resp);

    await measureServiceApi.createVersion("testId", "MAJOR");
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(resp.data).toEqual(measure);
  });

  it("creates a draft for a measure", async () => {
    const measure = {
      id: "1",
      measureName: "Measure - A",
    } as unknown as Measure;

    const resp = { status: 200, data: measure };
    mockedAxios.post.mockResolvedValue(resp);

    await measureServiceApi.draftMeasure(
      measure.id,
      Model.QICORE,
      measure.measureName
    );
    expect(mockedAxios.post).toBeCalledTimes(1);
    expect(resp.data).toEqual(measure);
  });

  it("test getMeasureExport success", async () => {
    const zippedMeasureData = {
      size: 635581,
      type: "application/octet-stream",
    };
    const resp = { status: 200, data: zippedMeasureData };
    mockedAxios.get.mockResolvedValue(resp);

    const measureExportData = await measureServiceApi.getMeasureExport(
      "IDIDID1",
      new AbortController().signal
    );
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(measureExportData).toEqual(zippedMeasureData);
  });

  it("test getMeasureExport failure", async () => {
    const resp = {
      status: 500,
    };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.getMeasureExport(
        "1",
        new AbortController().signal
      );
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.status).toBe(500);
    }
  });

  it("test getAllEndorsers success", async () => {
    const endorsers: EndorsementOrganization[] = [
      {
        id: "testId1",
        endorserOrganization: "test organization 1",
      },
    ];
    const resp = { status: 200, data: endorsers };
    mockedAxios.get.mockResolvedValueOnce(resp);

    const returnedOrgList = measureServiceApi.getAllEndorsers();

    expect(mockedAxios.get).toBeCalledTimes(1);
    expect((await returnedOrgList).length).toEqual(1);
  });

  it("test getAllEndorsers error", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.getAllEndorsers();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch endorsers");
    }
  });

  it("test getAllEndorsers error when returned list is empty", async () => {
    const resp = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValueOnce(resp);

    try {
      await measureServiceApi.getAllEndorsers();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch endorsers");
    }
  });
});
