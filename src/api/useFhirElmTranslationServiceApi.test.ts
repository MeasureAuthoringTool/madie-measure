import axios from "./axios-instance";
import useFhirElmTranslationServiceApi, {
  FhirElmTranslationServiceApi,
  RelevantElement,
} from "./useFhirElmTranslationServiceApi";
import useServiceConfig from "./useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";

jest.mock("./axios-instance");
jest.mock("./useServiceConfig");
jest.mock("@madie/madie-util");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("FhirElmTranslationServiceApi", () => {
  const baseUrl = "http://test-base";
  const mockToken = "mock-token";

  const getAccessToken = jest.fn(() => mockToken);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchTranslatorVersion", () => {
    it("returns translator version on success", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "1.0.0" });

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
      const result = await api.fetchTranslatorVersion(true);

      expect(result).toBe("1.0.0");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/fhir/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
          params: { draft: true },
        }
      );
    });

    it("throws error on failure", async () => {
      const error = new Error("network error");
      mockedAxios.get.mockRejectedValueOnce(error);

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);

      await expect(api.fetchTranslatorVersion(false)).rejects.toThrow();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/fhir/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
          params: { draft: false },
        }
      );
    });
  });

  describe("fetchRelevantDataElements", () => {
    const measure = { id: "measure-1" } as any;

    it("returns relevant elements on success", async () => {
      const mockResponse: RelevantElement[] = [
        { type: "Observation", profile: "test-profile" },
      ];

      mockedAxios.put.mockResolvedValueOnce({ data: mockResponse });

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);

      const controller = new AbortController();

      const result = await api.fetchRelevantDataElements(
        measure,
        controller.signal
      );

      expect(result).toEqual(mockResponse);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/fhir/cql/relevant-elements`,
        measure,
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );
    });

    it("returns empty array on failure", async () => {
      mockedAxios.put.mockRejectedValueOnce(new Error("failure"));

      const api = new FhirElmTranslationServiceApi(baseUrl, getAccessToken);

      const result = await api.fetchRelevantDataElements({} as any);

      expect(result).toEqual([]);
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });
});

describe("useFhirElmTranslationServiceApi hook", () => {
  it("returns configured API instance", () => {
    (useServiceConfig as jest.Mock).mockReturnValue({
      fhirElmTranslationService: {
        baseUrl: "http://hook-base",
      },
    });

    const mockGetToken = jest.fn(() => "hook-token");

    (useOktaTokens as jest.Mock).mockReturnValue({
      getAccessToken: mockGetToken,
    });

    const api = useFhirElmTranslationServiceApi();

    expect(api).toBeInstanceOf(FhirElmTranslationServiceApi);

    // Validate it works end-to-end
    mockedAxios.get.mockResolvedValueOnce({ data: "2.0.0" });

    return api.fetchTranslatorVersion(true).then((result) => {
      expect(result).toBe("2.0.0");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `http://hook-base/fhir/translator-version`,
        expect.objectContaining({
          headers: {
            Authorization: `Bearer hook-token`,
          },
        })
      );
    });
  });
});
