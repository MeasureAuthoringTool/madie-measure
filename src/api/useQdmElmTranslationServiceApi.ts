import axios from "./axios-instance";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";
import { useOktaTokens } from "@madie/madie-util";

export class QdmElmTranslationServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}
  async translateCqlToElm(cql: string): Promise<any> {
    if (this.baseUrl) {
      try {
        const resp = await axios.put(
          `${this.baseUrl}/qdm/cql/translator/cql`,
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
            },
            timeout: 15000,
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
        "Missing QDM ELM translation service URL! Is it present in the service config?"
      );
    }
  }

  async fetchTranslatorVersion(draft: boolean): Promise<string> {
    try {
      const response = await axios.get<string>(
        `${this.baseUrl}/qdm/translator-version`,
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
}

export default function useQdmElmTranslationServiceApi(): QdmElmTranslationServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.qdmElmTranslationService;

  return new QdmElmTranslationServiceApi(baseUrl, getAccessToken);
}
