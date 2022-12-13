import { MeasureServiceApi } from "./useMeasureServiceApi";
import { libraryElm } from "./__mocks__/cqlLibraryElm";
import axios from "axios";
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
import { Measure } from "@madie/madie-models";

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
});
