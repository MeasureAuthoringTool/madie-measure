import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { useOktaTokens } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";

export interface RelevantElement {
  type: string;
  profile: string;
}

export class FhirElmTranslationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async translateCqlToElm(cql: string, checkContext: boolean): Promise<any> {
    if (this.baseUrl) {
      try {
        const resp = await axios.put(
          `${this.baseUrl}/fhir/cql/translator/cql`,
          cql,
          {
            headers: {
              Authorization: `Bearer ${this.getAccessToken()}`,
              "Content-Type": "text/plain",
            },
            params: {
              errorSeverity: "Info",
              annotations: true,
              locators: true,
              "disable-list-demotion": true,
              "disable-list-promotion": true,
              "validate-units": true,
              checkContext: checkContext,
            },
          }
        );
        if (resp.status === 200) {
          return JSON.parse(resp.data.json);
        }
      } catch (error) {
        console.warn(error.response.data.error, error.response.data.status);
        throw new Error(error.message);
      }
    } else {
      throw new Error(
        "Missing FHIR ELM translation service URL! Is it present in the service config?"
      );
    }
  }

  async fetchTranslatorVersion(draft: boolean): Promise<string> {
    try {
      const response = await axios.get<string>(
        `${this.baseUrl}/fhir/translator-version`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
          params: {
            draft,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error("unable to retrieve translator version:", err);
      throw new Error(err);
    }
  }

  async fetchRelevantDataElements(
    measure: Measure,
    signal?: AbortSignal
  ): Promise<Array<RelevantElement>> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/fhir/cql/relevant-elements`,
        measure,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "application/json",
          },
          signal,
        }
      );
      return response.data;
    } catch (error) {
      // For now, allow UI to finish loading, without relevant elements filter
      console.error(
        "An error occurred while fetching relevant data elements",
        error.message
      );
      return [];
    }
  }
}

export default function useFhirElmTranslationServiceApi(): FhirElmTranslationServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.fhirElmTranslationService;

  return new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
}
