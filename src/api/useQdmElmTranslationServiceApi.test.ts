import axios from "./axios-instance";
import useQdmElmTranslationServiceApi, {
  QdmElmTranslationServiceApi,
} from "./useQdmElmTranslationServiceApi";
import useServiceConfig from "./useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";

jest.mock("./axios-instance");
jest.mock("./useServiceConfig");
jest.mock("@madie/madie-util");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("QdmElmTranslationServiceApi", () => {
  const baseUrl = "http://qdm-base";
  const token = "test-token";
  const getAccessToken = jest.fn(() => token);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("translateCqlToElm", () => {
    const cql = "some cql";

    it("returns parsed JSON when status is 200", async () => {
      const responsePayload = { json: JSON.stringify({ elm: "data" }) };

      mockedAxios.put.mockResolvedValueOnce({
        status: 200,
        data: responsePayload,
      } as any);

      const api = new QdmElmTranslationServiceApi(baseUrl, getAccessToken);

      const result = await api.translateCqlToElm(cql);

      expect(result).toEqual({ elm: "data" });

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${baseUrl}/qdm/cql/translator/cql`,
        cql,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
          },
          params: {
            errorSeverity: "Info",
            annotations: true,
            locators: true,
            "disable-list-demotion": true,
            "disable-list-promotion": true,
            "validate-units": true,
          },
          timeout: 15000,
        }
      );
    });

    it("returns undefined if status is not 200", async () => {
      mockedAxios.put.mockResolvedValueOnce({
        status: 500,
        data: {},
      } as any);

      const api = new QdmElmTranslationServiceApi(baseUrl, getAccessToken);

      const result = await api.translateCqlToElm(cql);

      expect(result).toBeUndefined();
    });

    it("throws error and logs warning on failure", async () => {
      const error = {
        message: "fail message",
        response: {
          data: {
            error: "bad request",
            status: 400,
          },
        },
      };

      console.warn = jest.fn();

      mockedAxios.put.mockRejectedValueOnce(error);

      const api = new QdmElmTranslationServiceApi(baseUrl, getAccessToken);

      await expect(api.translateCqlToElm(cql)).rejects.toThrow("fail message");

      expect(console.warn).toHaveBeenCalledWith("bad request", 400);
    });

    it("throws error when baseUrl is missing", async () => {
      const api = new QdmElmTranslationServiceApi("" as any, getAccessToken);

      await expect(api.translateCqlToElm(cql)).rejects.toThrow(
        "Missing QDM ELM translation service URL"
      );
    });
  });

  describe("fetchTranslatorVersion", () => {
    it("returns version on success", async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: "3.1.0" });

      const api = new QdmElmTranslationServiceApi(baseUrl, getAccessToken);

      const result = await api.fetchTranslatorVersion(true);

      expect(result).toBe("3.1.0");

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/qdm/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { draft: true },
        }
      );
    });

    it("throws error on failure", async () => {
      const error = new Error("network");
      mockedAxios.get.mockRejectedValueOnce(error);

      const api = new QdmElmTranslationServiceApi(baseUrl, getAccessToken);

      await expect(api.fetchTranslatorVersion(false)).rejects.toThrow();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${baseUrl}/qdm/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { draft: false },
        }
      );
    });
  });
});

describe("useQdmElmTranslationServiceApi hook", () => {
  it("returns configured API instance and works", async () => {
    (useServiceConfig as jest.Mock).mockReturnValue({
      qdmElmTranslationService: {
        baseUrl: "http://hook-qdm",
      },
    });

    const mockTokenGetter = jest.fn(() => "hook-token");

    (useOktaTokens as jest.Mock).mockReturnValue({
      getAccessToken: mockTokenGetter,
    });

    const api = useQdmElmTranslationServiceApi();

    expect(api).toBeInstanceOf(QdmElmTranslationServiceApi);

    mockedAxios.get.mockResolvedValueOnce({ data: "4.0.0" });

    const result = await api.fetchTranslatorVersion(true);

    expect(result).toBe("4.0.0");

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://hook-qdm/qdm/translator-version",
      expect.objectContaining({
        headers: {
          Authorization: "Bearer hook-token",
        },
      })
    );
  });
});
