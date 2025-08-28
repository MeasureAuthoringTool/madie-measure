import axios from "../../../../api/axios-instance";
import useServiceConfig from "../../../../api/useServiceConfig";
import { ServiceConfig } from "../../../../api/ServiceContext";
import { Measure, TestCaseConfiguration } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import { Bundle } from "fhir/r4";

export class MeasureServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}
  async fetchMeasureBundle(measure: Measure): Promise<Bundle> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/measures/${measure.id}/bundle`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("Bundle Error", err?.response);
      throw new Error(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    }
  }

  async updateMeasureTestCaseConfiguration(
    testCaseConfig: TestCaseConfiguration,
    measureId: String
  ): Promise<Response> {
    return await axios.put(
      `${this.baseUrl}/measures/${measureId}/test-case-config`,
      testCaseConfig,
      {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      }
    );
  }

  async updateMeasure(measure: Measure): Promise<Response> {
    return await axios.put(`${this.baseUrl}/measures/${measure.id}`, measure, {
      headers: {
        Authorization: `Bearer ${this.getAccessToken()}`,
      },
    });
  }

  async getCqmMeasure(
    measureId: String,
    abortController: AbortController
  ): Promise<Response> {
    try {
      const result = await axios.get(
        `${this.baseUrl}/measures/${measureId}/cqmmeasure`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          signal: abortController.signal,
        }
      );
      return result.data;
    } catch (err) {
      const message = `Unable to retrieve CqmMeasure`;
      console.warn(message);
      throw err;
    }
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
