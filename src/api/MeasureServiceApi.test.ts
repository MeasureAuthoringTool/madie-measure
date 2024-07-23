import { MeasureServiceApi } from "./useMeasureServiceApi";
import { libraryElm } from "./__mocks__/cqlLibraryElm";
import axios from "../api/axios-insatnce";
jest.mock("../api/axios-insatnce");
const mockedAxios = axios as jest.Mocked<typeof axios>;
import {
  EndorsementOrganization,
  Measure,
  MeasureSet,
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
    const resp: any = { status: 200, data: measures };
    mockedAxios.get.mockResolvedValue(resp);

    const measuresList = await measureServiceApi.fetchMeasures(true, 25, 0, {});
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(measuresList).toEqual(measures);
  });

  it("test fetchMeasures fail", async () => {
    const resp = { status: 500, data: "failure", error: { message: "error" } };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.fetchMeasures(
        true,
        25,
        0,
        new AbortController().signal
      );
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch measures");
    }
  });

  it("test fetchMeasures cancels", async () => {
    const resp: any = {
      status: 500,
      data: "failure",
      message: "canceled",
    };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.fetchMeasures(
        true,
        25,
        0,
        new AbortController().signal
      );
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("canceled");
    }
  });

  it("test fetchMeasure success", async () => {
    const measure: Measure = {
      id: "1234AFDE",
      measureName: "measure - A",
    } as Measure;
    const resp: any = { status: 200, data: measure };
    mockedAxios.get.mockResolvedValue(resp);

    const measuresList = await measureServiceApi.fetchMeasure("1234AFDE");
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(measuresList).toEqual(measure);
  });

  it("test fetchMeasure failure", async () => {
    const errorMessage = "Unable to fetch measure 1234AFDE";
    mockedAxios.get.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );
    await expect(measureServiceApi.fetchMeasure("1234AFDE")).rejects.toThrow(
      errorMessage
    );
  });

  it("fails to delete a Measure Group if groupId is falsy", async () => {
    const errorMessage = "Failed to delete the measure group.";
    mockedAxios.delete.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );
    await expect(measureServiceApi.deleteMeasureGroup("", "")).rejects.toThrow(
      errorMessage
    );
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
    const resp: any = {
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
    const errorResponse: any = {
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
    const resp: any = { status: 200, data: measures };
    mockedAxios.get.mockResolvedValue(resp);

    const measuresList =
      await measureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle(
        true,
        25,
        0,
        "test",
        new AbortController().signal
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
        "test",
        new AbortController().signal
      );
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to search measures");
    }
  });

  it("test searchMeasuresByMeasureNameOrEcqmTitle cancels", async () => {
    const resp = {
      status: 500,
      data: "failure",
      message: "canceled",
    };
    mockedAxios.get.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle(
        true,
        25,
        0,
        "test",
        new AbortController().signal
      );
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("canceled");
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
    const resp: any = { status: 200, data: organizations };
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
    const resp: any = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValueOnce(resp);

    try {
      await measureServiceApi.getAllOrganizations();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch organizations");
    }
  });

  it("test checkValidVersion success", async () => {
    const resp: any = { status: 200 };
    mockedAxios.get.mockResolvedValue(resp);

    await measureServiceApi.checkValidVersion("testId", "MAJOR");
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(resp.status).toEqual(200);
  });

  it("test createVersion success", async () => {
    const measure: Measure = {
      id: "testId",
      measureName: "measure - A",
      version: "1.001",
      revisionNumber: 1,
    } as unknown as Measure;

    const resp: any = { status: 200, data: measure };
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

    const resp: any = { status: 200, data: measure };
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
    const resp: any = { status: 200, data: zippedMeasureData };
    mockedAxios.get.mockResolvedValue(resp);

    const measureExportData = await measureServiceApi.getMeasureExport(
      "IDIDID1",
      new AbortController().signal
    );
    expect(mockedAxios.get).toBeCalledTimes(1);
    expect(measureExportData).toEqual({ status: 200, data: zippedMeasureData });
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
    const resp: any = { status: 200, data: endorsers };
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
    const resp: any = { status: 200, data: [] };
    mockedAxios.get.mockResolvedValueOnce(resp);

    try {
      await measureServiceApi.getAllEndorsers();
      expect(mockedAxios.get).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Unable to fetch endorsers");
    }
  });

  it("test createCmsId success", async () => {
    const resp: any = { status: 200, data: 2 };
    mockedAxios.put.mockResolvedValue(resp);

    await measureServiceApi.createCmsId("testMeasureSetId");
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(resp.data).toEqual(2);
  });

  it("test createCmsId failure", async () => {
    const resp = {
      status: 400,
      message: "Failed to create cms id.",
    };
    mockedAxios.put.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.createCmsId("testMeasureSetId");
      expect(mockedAxios.put).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe("Failed to create cms id.");
    }
  });

  it("test associate cms id failure", async () => {
    const resp = {
      status: 400,
      message: "CMS ID could not be associated. Please try again.",
    };
    mockedAxios.put.mockRejectedValueOnce(resp);

    try {
      await measureServiceApi.associateCmdId("qiCoreMeasureId", "qdmMeasureId");
      expect(mockedAxios.put).toBeCalledTimes(1);
    } catch (error) {
      expect(error.message).toBe(
        "CMS ID could not be associated. Please try again."
      );
    }
  });

  it("successfully associate cms id", async () => {
    const measureSet = {
      id: "1",
      cmsId: 6,
      measureSetId: "testMesureSetId",
      owner: "owner",
      acls: null,
    } as unknown as MeasureSet;

    const resp: any = { status: 200, data: measureSet };
    mockedAxios.put.mockResolvedValue(resp);

    await measureServiceApi.associateCmdId("qiCoreMeasureId", "qdmMeasureId");
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(resp.data).toEqual(measureSet);
  });
});
