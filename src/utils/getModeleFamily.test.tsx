import { Measure } from "@madie/madie-models";
import getModelFamily from "./getModelFamily";

const measures: Measure[] = [
  {
    id: "IDIDID1",
    measureHumanReadableId: "humanId",
    ecqmTitle: "ecqmTitleeee",
    measureSetId: "1",
    version: "0.0.000",
    createdAt: "",
    createdBy: "",
    model: "QDM v4.1.1",
    active: true,
    measureMetaData: {
      draft: true,
    },
  },
  {
    id: "IDIDID2",
    measureSetId: "2",
    version: "0.0.000",
    state: "DRAFT",
    measureName: "draft measure - B",
    model: "QI-Core v5.0.0 ",
    active: false,
    measureMetaData: {
      draft: true,
    },
  },
];

describe("Measure List component", () => {
  it("checking if the model family is same as what provided when the model is not QI-Core", () => {
    const modelFamily = getModelFamily(measures[0].model);
    console.log(modelFamily);
    expect(modelFamily).toBe("QDM4");
  });

  it("checking if the model family is maped to FHIR when the measure model is QI-Core", () => {
    const modelFamily = getModelFamily(measures[1].model);
    console.log(modelFamily);
    expect(modelFamily).toBe("FHIR5");
  });
});
