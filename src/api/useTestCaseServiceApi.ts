import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { TestCase } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";

export class TestCaseServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getTestCasesByMeasureId(measureId: string): Promise<TestCase[]> {
    try {
      const response = await axios.get<TestCase[]>(
        `${this.baseUrl}/measures/${measureId}/test-cases`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data || [];
    } catch (err) {
      if (err?.message?.includes("401") || err?.status === 401) {
        throw new Error("You Lack Permissions For Test Cases");
      } else {
        throw new Error("Unable to retrieve test cases, please try later.");
      }
    }
  }
}
const useTestCaseServiceApi = (): TestCaseServiceApi => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new TestCaseServiceApi(
    serviceConfig?.measureService.baseUrl,
    getAccessToken
  );
};

export default useTestCaseServiceApi;
