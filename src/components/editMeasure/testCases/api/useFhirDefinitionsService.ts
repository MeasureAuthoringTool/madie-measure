import { ServiceConfig } from "../../../../api/ServiceContext";
import useServiceConfig from "../../../../api/useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";
import axios from "../../../../api/axios-instance";
import { ResourceIdentifier } from "./models/ResourceIdentifier";
import { StructureDefinitionDto } from "./models/StructureDefinitionDto";

export class FhirDefinitionsServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}

  isComponentDataType(datatype) {
    switch (datatype) {
      case "boolean":
      case "date":
      case "dateTime":
      case "http://hl7.org/fhirpath/System.DateTime":
      case "decimal":
      case "id":
      case "instant":
      case "integer":
      case "integer64":
      case "positiveInt":
      case "time":
      case "unsignedInt":
      case "uri":
      case "url":
      case "uuid":
      case "canonical":
      case "string":
      case "markdown":
      case "http://hl7.org/fhirpath/System.String":
      case "code":
      case "Extension":
      case "Reference":
        return true;
      default:
        return false;
    }
  }

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

  getBasePath(resource: any): string {
    return resource?.definition?.snapshot?.element?.[0]?.path;
  }

  getTopLevelElements(resource: any) {
    const elements = [...resource?.definition?.snapshot?.element];
    return elements?.filter(
      (e) => e.path.split(".")?.length === 2 && e.max !== "0"
    );
  }

  stripResourcePath(resourcePath, elementPath) {
    return elementPath.substring(`${resourcePath}.`.length);
  }

  getAllChildren(resource, path) {
    const elements = [...resource?.definition?.snapshot?.element];
    return elements?.filter((e) => e.path !== path && e.path.includes(path));
  }
}

export default function useFhirDefinitionsServiceApi(): FhirDefinitionsServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.fhirService;

  return new FhirDefinitionsServiceApi(baseUrl, getAccessToken);
}
