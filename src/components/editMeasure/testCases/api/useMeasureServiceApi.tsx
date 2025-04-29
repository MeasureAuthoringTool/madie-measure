import axios from "../../../../api/axios-instance";
import useServiceConfig from "../../../../api/useServiceConfig";
import { ServiceConfig } from "../../../../api/ServiceContext";
import { Measure } from "@madie/madie-models";
import { useOktaTokens } from "@madie/madie-util";
import { Bundle } from "fhir/r4";
import { OverlappingCode } from "../util/OverlappingCodesUtils";

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

  async getOverlappingValueSets(
    measureId: string,
    overlappingCodes: OverlappingCode[],
    abortController: AbortController
  ): Promise<any> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/measures/${measureId}/test-cases/exportOverlappingValueSets`,
        overlappingCodes,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Accept-Encoding": "application/vnd.ms-excel",
          },
          signal: abortController.signal,
          responseType: "blob",
        }
      );
      return response;
    } catch (err) {
      console.error("getOverlappingValueSets error", err);
      throw new Error(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    }
  }
}

export default function useMeasureServiceApi(): MeasureServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.measureService;

  return new MeasureServiceApi(baseUrl, getAccessToken);
}
