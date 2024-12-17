import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { useOktaTokens } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";

export interface SourceDataCriteria {
  oid: string;
  title: string;
  description: string;
  type: string;
  drc: string;
  codeId: string;
  name: string;
}

export class FhirElmTranslationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

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
    measure: Measure
  ): Promise<Array<SourceDataCriteria>> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/fhir/cql/relevant-elements`,
        measure,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.message ||
          "An Error occurred while fetching relevant data elements"
      );
    }
  }
}

export default function useFhirElmTranslationServiceApi(): FhirElmTranslationServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.fhirElmTranslationService;

  return new FhirElmTranslationServiceApi(baseUrl, getAccessToken);
}
