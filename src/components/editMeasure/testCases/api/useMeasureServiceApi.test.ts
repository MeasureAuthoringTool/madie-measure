import axios from "../../../../api/axios-instance";
import { MeasureServiceApi } from "./useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
jest.mock("../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const measure = {
  id: "1",
  measureName: "CQM01",
  cqlLibraryName: "CQM01",
  measureSetId: "1-2-3",
  scoring: "Continuous Variable",
  patientBasis: true,
  cql: "mock cql",
  supplementalData: [
    {
      definition: "SDE Definition Initial Population",
      description: "",
    },
  ],
  testCaseConfiguration: {
    sdeIncluded: true,
  },
} as Measure;

describe("MeasureServiceApi", () => {
  let measureServiceApi: MeasureServiceApi;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    measureServiceApi = new MeasureServiceApi("test.url", getAccessToken);
  });

  it("It should trigger success fetchMeasureBundle", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    const result = await measureServiceApi.fetchMeasureBundle(measure);
    expect(result).toEqual({});
  });

  it("It should trigger catch fetchMeasureBundle", async () => {
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    mockedAxios.get.mockRejectedValueOnce({ data: {} });
    await expect(measureServiceApi.fetchMeasureBundle(measure)).rejects.toThrow(
      ""
    );
    expect(consoleErrorMock).toHaveBeenCalledWith("Bundle Error", undefined);
    consoleErrorMock.mockRestore();
  });

  it("should succeed updateMeasure", async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: {} });
    const result = await measureServiceApi.updateMeasure(measure);
    expect(mockedAxios.put).toBeCalledTimes(1);
    expect(result.data).toEqual({});
  });

  it("should succeed getCqmMeasure", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: {} });
    const abortController = new AbortController();
    await measureServiceApi.getCqmMeasure("id", abortController);
    expect(mockedAxios.get).toHaveBeenCalled();
  });
  it("should fail getCqmMeasure", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("failure"));
    const consoleWarnMock = jest.spyOn(console, "warn").mockImplementation();
    const abortController = new AbortController();
    await expect(
      measureServiceApi.getCqmMeasure("id", abortController)
    ).rejects.toThrow("");
    expect(consoleWarnMock).toHaveBeenCalledWith(
      "Unable to retrieve CqmMeasure"
    );
    expect(mockedAxios.get).toHaveBeenCalled();
  });

  it("should return the axios response for updateMeasureTestCaseConfiguration", async () => {
    const response = { data: "updated" };
    (axios.put as jest.Mock).mockResolvedValue(response);

    const result = await measureServiceApi.updateMeasureTestCaseConfiguration(
      measure.testCaseConfiguration,
      measure.id
    );

    expect(result).toBe(response);
  });

  it("should propagate errors from axios.put for updateMeasureTestCaseConfiguration", async () => {
    const error = new Error("Network error");
    (axios.put as jest.Mock).mockRejectedValue(error);

    await expect(
      measureServiceApi.updateMeasureTestCaseConfiguration(
        measure.testCaseConfiguration,
        measure.id
      )
    ).rejects.toThrow("Network error");
  });
});
