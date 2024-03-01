import getInitialValues, { setMeasureMetadata } from "./MeasureMetadataHelper";
import { Measure, MeasureMetadata } from "@madie/madie-models";
import { cleanup } from "@testing-library/react";

describe("MeasureMetadataHelper", () => {
  let measure: Measure;
  let measureMetaData: MeasureMetadata;

  const MEASUREID = "TestMeasureId";
  const DECRIPTION = "Test Description";
  const COPYRIGHT = "Test Copyright";
  const DISCLAIMER = "Test Disclaimer";
  const RATIONALE = "Test Rationale";
  const GUIDANCE = "Test Guidance";
  const CLINICAL = "Test Clinical";
  const RISKADJUSTMENT = "Test Risk Adjustment";
  const NEWVALUE = "Test New Value";
  const definition = "this is measure definition";
  const MEASURESETTITLE = "Test Measure Set";

  afterEach(cleanup);

  beforeEach(() => {
    measureMetaData = {
      description: DECRIPTION,
      copyright: COPYRIGHT,
      disclaimer: DISCLAIMER,
      rationale: RATIONALE,
      guidance: GUIDANCE,
      clinicalRecommendation: CLINICAL,
      definition: definition,
      riskAdjustment: RISKADJUSTMENT,
      measureSetTitle: MEASURESETTITLE,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureMetaData: measureMetaData,
    } as Measure;
  });

  it("should retrieve description value", () => {
    const actual = getInitialValues(measure, "description");
    expect(actual).toBe(DECRIPTION);
  });

  it("should return empty string instead of null when description is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { description: null } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(measure, "description");
    expect(actual).toBe("");
  });

  it("should retrieve copyright value", () => {
    const actual = getInitialValues(measure, "copyright");
    expect(actual).toBe(COPYRIGHT);
  });

  it("should return empty string instead of null when copyright is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { copyright: null } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(measure, "copyright");
    expect(actual).toBe("");
  });

  it("should retrieve disclaimer value", () => {
    const actual = getInitialValues(measure, "disclaimer");
    expect(actual).toBe(DISCLAIMER);
  });

  it("should return empty string instead of null when disclaimer is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { disclaimer: null } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(measure, "disclaimer");
    expect(actual).toBe("");
  });

  it("should retrieve rationale value", () => {
    const actual = getInitialValues(measure, "rationale");
    expect(actual).toBe(RATIONALE);
  });

  it("should return empty string instead of null when rationale is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { rationale: null } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(measure, "rationale");
    expect(actual).toBe("");
  });

  it("should retrieve clinical recommendation statement value", () => {
    const actual = getInitialValues(
      measure,
      "clinical-recommendation-statement"
    );
    expect(actual).toBe(CLINICAL);
  });
  it("should return empty string instead of null when clinical recommendation statement is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: {
        clinicalRecommendation: null,
      } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(
      measure,
      "clinical-recommendation-statement"
    );
    expect(actual).toBe("");
  });

  it("should retrieve guidance value", () => {
    const actual = getInitialValues(measure, "guidance-usage");
    expect(actual).toBe(GUIDANCE);
  });
  it("should return empty string instead of null when guidance is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { guidance: null } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(measure, "guidance");
    expect(actual).toBe("");
  });

  it("should retrieve definition value", () => {
    expect(getInitialValues(measure, "definition")).toBe(definition);
  });

  it("should return empty string instead of null when definition is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { definition: null } as unknown as MeasureMetadata,
    } as Measure;
    expect(getInitialValues(measure, "definition")).toBe("");
  });

  it("should empty string when invalid measure metadata type", () => {
    const actual = getInitialValues(measure, "test");
    expect(actual).toBe("");
  });

  it("should retrieve measure set value", () => {
    const actual = getInitialValues(measure, "measure-set");
    expect(actual).toBe(MEASURESETTITLE);
  });

  it("should return empty string instead of null when measure set is null", () => {
    measure = {
      id: MEASUREID,
      measureMetaData: { measureSetTile: null } as unknown as MeasureMetadata,
    } as Measure;

    const actual = getInitialValues(measure, "measure-set");
    expect(actual).toBe("");
  });

  it("should reset description value", () => {
    setMeasureMetadata(measure, "description", NEWVALUE);
    expect(measure.measureMetaData?.description).toBe(NEWVALUE);
  });

  it("should reset copyright value", () => {
    setMeasureMetadata(measure, "copyright", NEWVALUE);
    expect(measure.measureMetaData?.copyright).toBe(NEWVALUE);
  });

  it("should reset disclaimer value", () => {
    setMeasureMetadata(measure, "disclaimer", NEWVALUE);
    expect(measure.measureMetaData?.disclaimer).toBe(NEWVALUE);
  });

  it("should reset rationale value", () => {
    setMeasureMetadata(measure, "rationale", NEWVALUE);
    expect(measure.measureMetaData?.rationale).toBe(NEWVALUE);
  });

  it("should reset guidance value", () => {
    setMeasureMetadata(measure, "guidance-usage", NEWVALUE);
    expect(measure.measureMetaData?.guidance).toBe(NEWVALUE);
  });

  it("should reset clinicalRecommendation value", () => {
    setMeasureMetadata(measure, "clinical-recommendation-statement", NEWVALUE);
    expect(measure.measureMetaData?.clinicalRecommendation).toBe(NEWVALUE);
  });

  it("should reset definition value", () => {
    setMeasureMetadata(measure, "definition", NEWVALUE);
    expect(measure.measureMetaData?.definition).toBe(NEWVALUE);
  });

  it("should reset measure set value", () => {
    setMeasureMetadata(measure, "measure-set", NEWVALUE);
    expect(measure.measureMetaData?.measureSetTitle).toBe(NEWVALUE);
  });

  it("should not reset any measure metadata", () => {
    setMeasureMetadata(measure, "test", NEWVALUE);
    expect(measure.measureMetaData?.description).toBe(DECRIPTION);
    expect(measure.measureMetaData?.copyright).toBe(COPYRIGHT);
    expect(measure.measureMetaData?.disclaimer).toBe(DISCLAIMER);
    expect(measure.measureMetaData?.rationale).toBe(RATIONALE);
    expect(measure.measureMetaData?.guidance).toBe(GUIDANCE);
    expect(measure.measureMetaData?.measureSetTitle).toBe(MEASURESETTITLE);
  });
});
