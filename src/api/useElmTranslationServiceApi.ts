import axios from "axios";
import useServiceConfig from "./useServiceConfig";
import { ServiceConfig } from "./ServiceContext";

export type ElmTranslationError = {
  startLine: number;
  startChar: number;
  endChar: number;
  endLine: number;
  errorSeverity: string;
  errorType: string;
  message: string;
  targetIncludeLibraryId: string;
  targetIncludeLibraryVersionId: string;
  type: string;
};

export type ElmTranslationLibrary = {
  annotation: any[];
  contexts: any;
  identifier: any;
  parameters: any;
  schemaIdentifier: any;
  statements: any;
  usings: any;
  valueSets: any;
};

export type ElmTranslation = {
  errorExceptions: ElmTranslationError[];
  externalErrors: any[];
  library: ElmTranslationLibrary;
};

export class ElmTranslationServiceApi {
  constructor(private baseUrl: string) {}

  async translateCqlToElm(cql: string): Promise<ElmTranslation> {
    const resp = await axios.put(`${this.baseUrl}/cql/translator/cql`, cql, {
      headers: { "Content-Type": "text/plain" },
      params: {
        showWarnings: true,
        annotations: true,
        locators: true,
        "disable-list-demotion": true,
        "disable-list-promotion": true,
        "disable-method-invocation": true,
        "validate-units": true,
      },
      timeout: 15000,
    });
    if (resp.status === 200) {
      return JSON.parse(resp.data.json);
    } else {
      const message = "received non-OK response for CQL-to-ELM translation";
      console.warn(message, resp.status);
      throw new Error(message);
    }
  }
}

export default function useElmTranslationServiceApi(): ElmTranslationServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { baseUrl } = serviceConfig.elmTranslationService;

  return new ElmTranslationServiceApi(baseUrl);
}
