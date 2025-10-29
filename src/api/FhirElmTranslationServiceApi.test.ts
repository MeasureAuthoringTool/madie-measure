import { FhirElmTranslationServiceApi } from "./useFhirElmTranslationServiceApi";
import axios from "./axios-instance";
import { Measure } from "@madie/madie-models";

jest.mock("./axios-instance");

const mockGetAccessToken = jest.fn(() => "fake-token");
const baseUrl = "http://test-url";
const api = new FhirElmTranslationServiceApi(baseUrl, mockGetAccessToken);

describe("FhirElmTranslationServiceApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchTranslatorVersion", () => {
    it("returns translator version on success", async () => {
      (axios.get as jest.Mock).mockResolvedValue({ data: "1.2.3" });
      const result = await api.fetchTranslatorVersion(true);
      expect(result).toBe("1.2.3");
      expect(axios.get).toHaveBeenCalledWith(
        `${baseUrl}/fhir/translator-version`,
        expect.objectContaining({
          headers: { Authorization: "Bearer fake-token" },
          params: { draft: true },
        })
      );
    });

    it("throws error and logs on failure", async () => {
      const error = new Error("Network error");
      (axios.get as jest.Mock).mockRejectedValue(error);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(api.fetchTranslatorVersion(false)).rejects.toThrow(
        "Error: Network error"
      );
      expect(spy).toHaveBeenCalledWith(
        "unable to retrieve translator version:",
        error
      );
      spy.mockRestore();
    });
  });

  describe("fetchRelevantDataElements", () => {
    const measure = { id: "measure-1" } as Measure;
    it("returns relevant elements on success", async () => {
      const relevantElements = [{ type: "Condition", profile: "profile-1" }];
      (axios.put as jest.Mock).mockResolvedValue({ data: relevantElements });
      const result = await api.fetchRelevantDataElements(measure, undefined);
      expect(result).toEqual(relevantElements);
      expect(axios.put).toHaveBeenCalledWith(
        `${baseUrl}/fhir/cql/relevant-elements`,
        measure,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer fake-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("returns empty array and logs on error", async () => {
      const error = { message: "Request failed" };
      (axios.put as jest.Mock).mockRejectedValue(error);
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const result = await api.fetchRelevantDataElements(measure);
      expect(result).toEqual([]);
      expect(spy).toHaveBeenCalledWith(
        "An error occurred while fetching relevant data elements",
        error.message
      );
      spy.mockRestore();
    });
  });
});
