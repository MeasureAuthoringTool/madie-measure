import { ServiceConfig } from "../../../../api/ServiceContext";
import useServiceConfig from "../../../../api/useServiceConfig";
import { useOktaTokens } from "@madie/madie-util";
import axios from "../../../../api/axios-instance";
import { ResourceIdentifier } from "./models/ResourceIdentifier";
import { StructureDefinitionDto } from "./models/StructureDefinitionDto";
import { ValueSet } from "fhir/r4";
import { getModelShortName, Measure, TestCase } from "@madie/madie-models";
import { qicoreVerionModelTypeMap } from "../util/CalculationTestHelpers";

export interface TestCaseExecutionBundlesDTO {
  testCases: TestCase[];
  modifiedTestCaseIds: string[];
}

export class FhirDefinitionsServiceApi {
  constructor(private baseUrl: string, private getAccessToken: () => string) {}
  async getResources(model: Measure["model"]): Promise<ResourceIdentifier[]> {
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/fhir/models/${getModelShortName(model)}/resources`,
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

  async getResourceTree(
    resourceId,
    model: Measure["model"]
  ): Promise<StructureDefinitionDto> {
    try {
      const response = await axios.get<any>(
        `${this.baseUrl}/fhir/models/${getModelShortName(
          model
        )}/resources/structure-definitions/${resourceId}`,
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

  async getValueSetDefinition(
    url: string,
    model: Measure["model"]
  ): Promise<ValueSet> {
    try {
      const response = await axios.get<ValueSet>(
        `${this.baseUrl}/fhir/models/${getModelShortName(
          model
        )}/resources/value-set-definition?url=${url}`,
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
    testCases: TestCase[],
    allowInvalidRefsForPatient: boolean
  ): Promise<TestCaseExecutionBundlesDTO> {
    try {
      const modelShortName = getModelShortName(model);
      const response = await axios.post<TestCaseExecutionBundlesDTO>(
        `${this.baseUrl}/fhir/test-cases/${modelShortName}/execution-bundles`,
        testCases,
        {
          params: { allowInvalidRefsForPatient },
          headers: {
            Authorization: `Bearer ${this.getAccessToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        `An error occurred while filtering resource and generating test case execution bundle for model version [${model}]: `,
        error
      );

      const errorMessage = error?.response?.data?.message;
      // Only show the message if it contains ':', otherwise throw general error
      if (errorMessage && errorMessage.includes(":")) {
        const hapiErrorMessage = errorMessage
          .split(":")
          .slice(1)
          .join(":")
          .trim();
        if (
          hapiErrorMessage &&
          hapiErrorMessage.includes("Incorrect resource type found")
        ) {
          throw new Error(
            "Test case execution was cancelled because the patient bundle could not be parsed. If this error persists, please contact the help desk."
          );
        }
        throw new Error(
          `Test case execution was cancelled because ${hapiErrorMessage}. If this error persists, please contact support.`
        );
      }

      throw new Error(
        "An error occurred while generating test case execution bundle. Please try again."
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
