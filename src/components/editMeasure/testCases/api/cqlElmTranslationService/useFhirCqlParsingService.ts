import axios from "../../../../../api/axios-instance";
import { CqlDefinitionCallstack } from "../../components/editTestCase/groupCoverage/QiCoreGroupCoverage";
import useServiceConfig from "../../../../../api/useServiceConfig";
import { ServiceConfig } from "../../../../../api/ServiceContext";
import { useOktaTokens } from "@madie/madie-util";

export class FhirCqlParsingService {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  async getDefinitionCallstacks(
    cql: string,
    signal: AbortSignal
  ): Promise<CqlDefinitionCallstack> {
    try {
      const response = await axios.put<string>(
        `${this.baseUrl}/fhir/cql/callstacks`,
        cql,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
            "Content-Type": "text/plain",
          },
          signal,
        }
      );
      return response.data as unknown as CqlDefinitionCallstack;
    } catch (err) {
      const message = `Unable to retrieve used definition references`;
      throw new Error(message);
    }
  }
}

const useFhirCqlParsingService = (): FhirCqlParsingService => {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  return new FhirCqlParsingService(
    serviceConfig?.fhirElmTranslationService.baseUrl,
    getAccessToken
  );
};

export default useFhirCqlParsingService;
