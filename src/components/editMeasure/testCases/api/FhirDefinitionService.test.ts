import { ValueSet } from "fhir/r4";
import axios from "../../../../api/axios-instance";
import { FhirDefinitionsServiceApi } from "./useFhirDefinitionsService";
import { TestCase } from "@madie/madie-models";

jest.mock("../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockTestCases: TestCase[] = [
  {
    id: "test-case-1",
    title: "Test Case 1",
    description: "Test description",
    json: "{}",
    groups: [],
  } as unknown as TestCase,
];

const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

describe("MeasureServiceApi", () => {
  let fhirDefinitionsServiceApi: FhirDefinitionsServiceApi;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    fhirDefinitionsServiceApi = new FhirDefinitionsServiceApi(
      "test.url",
      getAccessToken
    );
  });

  it("should return value set definition for value set url", () => {
    const valueSet = {
      name: "USCoreObservationValueCodes",
      url: "http://hl7.org/fhir/us/core/ValueSet/us-core-observation-value-codes",
      status: "active",
      version: "6.1.0",
      id: "us-core-observation-value-codes",
    } as ValueSet;

    mockedAxios.get.mockResolvedValue({ data: valueSet });

    fhirDefinitionsServiceApi
      .getValueSetDefinition(valueSet.url)
      .then((valueSetDefinition: ValueSet) => {
        expect(valueSetDefinition.name).toEqual(valueSet.name);
        expect(valueSetDefinition.url).toEqual(valueSet.url);
      });
  });

  it("should return null if value set definition not found", async () => {
    const url =
      "http://hl7.org/fhir/us/core/ValueSet/us-core-observation-value-codes";
    mockedAxios.get.mockRejectedValueOnce({ status: 404 });

    const definition = await fhirDefinitionsServiceApi.getValueSetDefinition(
      url
    );
    expect(definition).toBeNull();
  });

  it("should throw the related error when resource type is not bundle", async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          message: "Incorrect resource type found in the bundle",
          cause: "Incorrect resource type found",
        },
      },
    };

    mockedAxios.post.mockRejectedValueOnce(errorResponse);

    await expect(
      fhirDefinitionsServiceApi.getTestCaseExecutionBundle(
        "QI-Core v4.1.1",
        mockTestCases,
        false
      )
    ).rejects.toThrow(
      "An error occurred while generating test case execution bundle. Please try again."
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "An error occurred while filtering resource and generating test case execution bundle"
      ),
      errorResponse
    );
  });

  it("should throw error with 'Unable to parse Patient Bundle' message when error message contains 'Incorrect resource type found'", async () => {
    const errorResponse = {
      response: {
        status: 400,
        data: {
          message: "HAPI-1825: Unknown element 'entryd' found during parse",
        },
      },
    };

    mockedAxios.post.mockRejectedValueOnce(errorResponse);

    await expect(
      fhirDefinitionsServiceApi.getTestCaseExecutionBundle(
        "QI-Core v4.1.1",
        mockTestCases,
        false
      )
    ).rejects.toThrow(
      "Test case execution was cancelled because Unknown element 'entryd' found during parse. If this error persists, please contact support."
    );
  });

  it("should throw generic error when 'Incorrect resource type found' is not in error message", async () => {
    const errorResponse = {
      response: {
        status: 500,
        data: {
          message: "Internal server error",
        },
      },
    };

    mockedAxios.post.mockRejectedValueOnce(errorResponse);

    await expect(
      fhirDefinitionsServiceApi.getTestCaseExecutionBundle(
        "QI-Core v4.1.1",
        mockTestCases,
        false
      )
    ).rejects.toThrow(
      "An error occurred while generating test case execution bundle. Please try again."
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "An error occurred while filtering resource and generating test case execution bundle"
      ),
      errorResponse
    );
  });
});
