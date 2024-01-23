import getModelFamily from "./measureModelHelpers";

describe("Check Modal Family", () => {
  it("checking if the model family is same as what provided when the model is not QI-Core", () => {
    const modelFamily = getModelFamily("QDM v4.0.000");
    expect(modelFamily).toBe("QDM");
  });

  it("checking if the model family is maped to FHIR when the measure model is QI-Core", () => {
    const modelFamily = getModelFamily("QI-Core v5.0.000");
    expect(modelFamily).toBe("FHIR5");
  });
});
