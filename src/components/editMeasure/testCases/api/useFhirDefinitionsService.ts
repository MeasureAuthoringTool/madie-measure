import { ServiceConfig } from "../../../../api/ServiceContext";
import useServiceConfig from "../../../../api/useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";
import axios from "../../../../api/axios-instance";
import { ResourceIdentifier } from "./models/ResourceIdentifier";
import { StructureDefinitionDto } from "./models/StructureDefinitionDto";

export class FhirDefinitionsServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}
  async getResources(): Promise<ResourceIdentifier[]> {
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/qicore/resources`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Get Resources Error", error?.response);
      throw new Error(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    }
  }

  async getResourceTree(resourceId): Promise<StructureDefinitionDto> {
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/qicore/resources/structure-definitions/${resourceId}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `An error occurred while loading definition for resourceId [${resourceId}]: `,
        error
      );
    }
    return null;
  }
}

export default function useFhirDefinitionsServiceApi(): FhirDefinitionsServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.fhirService;

  return new FhirDefinitionsServiceApi(baseUrl, getAccessToken);
}
