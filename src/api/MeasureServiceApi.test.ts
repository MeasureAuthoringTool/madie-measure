import { MeasureServiceApi } from "./useMeasureServiceApi";
import { libraryElm } from "./__mocks__/cqlLibraryElm";

describe("MeasureServiceApi Tests", () => {
  const baseUrl = "madie.com";
  const accessToken = jest.fn();
  const measureServiceApi = new MeasureServiceApi(baseUrl, accessToken);
  it("get return types for all cql definitions when no definition is found", () => {
    let returnTypes = measureServiceApi.getReturnTypesForAllCqlDefinitions("");
    expect(returnTypes).toEqual({});

    returnTypes =
      measureServiceApi.getReturnTypesForAllCqlDefinitions('{"library":{}}');
    expect(returnTypes).toEqual({});

    returnTypes = measureServiceApi.getReturnTypesForAllCqlDefinitions(
      '{"library":{"statements": {}}}'
    );
    expect(returnTypes).toEqual({});
  });

  it("get return types for all cql definitions", () => {
    let returnTypes =
      measureServiceApi.getReturnTypesForAllCqlDefinitions(libraryElm);
    expect(returnTypes["initialPopulation"]).toEqual("Encounter");

    expect(returnTypes["measurePopulation"]).toEqual("Encounter");

    expect(returnTypes["measurePopulationExclusions"]).toEqual("Encounter");

    expect(returnTypes["measureObservation"]).toEqual("Integer");
  });
});
