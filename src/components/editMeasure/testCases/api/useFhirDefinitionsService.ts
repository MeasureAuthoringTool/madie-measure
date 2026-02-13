import { ServiceConfig } from "../../../../api/ServiceContext";
import useServiceConfig from "../../../../api/useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";
import axios from "../../../../api/axios-instance";
import { ResourceIdentifier } from "./models/ResourceIdentifier";
import { StructureDefinitionDto } from "./models/StructureDefinitionDto";
import { ValueSet } from "fhir/r4";
import { TestCase } from "@madie/madie-models";
import { qicoreVerionModelTypeMap } from "../util/CalculationTestHelpers";

export interface TestCaseExecutionBundlesDTO {
  testCases: TestCase[];
  modifiedTestCaseIds: string[];
}

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
      throw new Error(error);
    }
  }

  async getValueSetDefinition(url: string): Promise<ValueSet> {
    try {
      const response = await axios.get<ValueSet>(
        `${this.baseUrl}/qicore/resources/value-set-definition?url=${url}`,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `An error occurred while loading definition for resourceId [${url}]: `,
        error
      );
    }
    return null;
  }

  async getTestCaseExecutionBundle(
    model: string,
    testCases: TestCase[]
  ): Promise<TestCaseExecutionBundlesDTO> {
    try {
      const versionModel = qicoreVerionModelTypeMap(model);
      const response = await axios.post<TestCaseExecutionBundlesDTO>(
        `${this.baseUrl}/fhir/test-cases/qicore/${versionModel}/execution-bundles`,
        testCases,
        {
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `An error occurred while generating test case execution bundle for model version [${model}]: `,
        error
      );
    }
  }
}

export default function useFhirDefinitionsServiceApi(): FhirDefinitionsServiceApi {
  const serviceConfig: ServiceConfig = useServiceConfig();
  const { getAccessToken } = useOktaTokens();
  const { baseUrl } = serviceConfig.fhirService;

  return new FhirDefinitionsServiceApi(baseUrl, getAccessToken);
}
