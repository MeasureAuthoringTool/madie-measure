import axios, { AxiosResponse } from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import {
  HapiOperationOutcome,
  TestCase,
  TestCaseImportRequest,
} from "@madie/madie-models";
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
      const message = "Unable to retrieve test cases, please try later.";
      throw new Error(message);
    }
  }
}
const useTestCaseServiceApi = (): TestCaseServiceApi => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new TestCaseServiceApi(
    serviceConfig?.testCaseService.baseUrl,
    getAccessToken
  );
};

export default useTestCaseServiceApi;
