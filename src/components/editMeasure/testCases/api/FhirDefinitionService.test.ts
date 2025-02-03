import { ValueSet } from "fhir/r4";
import axios from "../../../../api/axios-instance";
import { FhirDefinitionsServiceApi } from "./useFhirDefinitionsService";

jest.mock("../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

  it("should return error if fetching value set definition failed", async () => {
    const url =
      "http://hl7.org/fhir/us/core/ValueSet/us-core-observation-value-codes";
    mockedAxios.get.mockRejectedValueOnce({ status: 404 });

    const definition = await fhirDefinitionsServiceApi.getValueSetDefinition(
      url
    );
    expect(definition).toBeNull();
  });
});
