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
  const NEWVALUE = "Test New Value";

  afterEach(cleanup);

  beforeEach(() => {
    measureMetaData = {
      description: DECRIPTION,
      copyright: COPYRIGHT,
      disclaimer: DISCLAIMER,
      rationale: RATIONALE,
      guidance: GUIDANCE,
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

  it("should return empty string instead of nul when description is null", () => {
    measureMetaData = {
      description: null,
      copyright: COPYRIGHT,
      disclaimer: DISCLAIMER,
      rationale: RATIONALE,
      guidance: GUIDANCE,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureMetaData: measureMetaData,
    } as Measure;

    const actual = getInitialValues(measure, "description");
    expect(actual).toBe("");
  });

  it("should retrieve copyright value", () => {
    const actual = getInitialValues(measure, "copyright");
    expect(actual).toBe(COPYRIGHT);
  });

  it("should return empty string instead of nul when copyright is null", () => {
    measureMetaData = {
      description: DECRIPTION,
      copyright: null,
      disclaimer: DISCLAIMER,
      rationale: RATIONALE,
      guidance: GUIDANCE,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureMetaData: measureMetaData,
    } as Measure;

    const actual = getInitialValues(measure, "copyright");
    expect(actual).toBe("");
  });

  it("should retrieve disclaimer value", () => {
    const actual = getInitialValues(measure, "disclaimer");
    expect(actual).toBe(DISCLAIMER);
  });

  it("should return empty string instead of nul when disclaimer is null", () => {
    measureMetaData = {
      description: DECRIPTION,
      copyright: COPYRIGHT,
      disclaimer: null,
      rationale: RATIONALE,
      guidance: GUIDANCE,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureMetaData: measureMetaData,
    } as Measure;

    const actual = getInitialValues(measure, "disclaimer");
    expect(actual).toBe("");
  });

  it("should retrieve rationale value", () => {
    const actual = getInitialValues(measure, "rationale");
    expect(actual).toBe(RATIONALE);
  });

  it("should return empty string instead of nul when rationale is null", () => {
    measureMetaData = {
      description: DECRIPTION,
      copyright: COPYRIGHT,
      disclaimer: DISCLAIMER,
      rationale: null,
      guidance: GUIDANCE,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureMetaData: measureMetaData,
    } as Measure;

    const actual = getInitialValues(measure, "rationale");
    expect(actual).toBe("");
  });

  it("should retrieve guidance value", () => {
    const actual = getInitialValues(measure, "guidance");
    expect(actual).toBe(GUIDANCE);
  });

  it("should return empty string instead of nul when guidance is null", () => {
    measureMetaData = {
      description: DECRIPTION,
      copyright: COPYRIGHT,
      disclaimer: DISCLAIMER,
      rationale: RATIONALE,
      guidance: null,
    } as MeasureMetadata;

    measure = {
      id: MEASUREID,
      measureMetaData: measureMetaData,
    } as Measure;

    const actual = getInitialValues(measure, "guidance");
    expect(actual).toBe("");
  });

  it("should empty string when invalid measure metadata type", () => {
    const actual = getInitialValues(measure, "test");
    expect(actual).toBe("");
  });

  it("should reset description value", () => {
    setMeasureMetadata(measure, "description", NEWVALUE);
    expect(measure.measureMetaData.description).toBe(NEWVALUE);
  });

  it("should reset copyright value", () => {
    setMeasureMetadata(measure, "copyright", NEWVALUE);
    expect(measure.measureMetaData.copyright).toBe(NEWVALUE);
  });

  it("should reset disclaimer value", () => {
    setMeasureMetadata(measure, "disclaimer", NEWVALUE);
    expect(measure.measureMetaData.disclaimer).toBe(NEWVALUE);
  });

  it("should reset rationale value", () => {
    setMeasureMetadata(measure, "rationale", NEWVALUE);
    expect(measure.measureMetaData.rationale).toBe(NEWVALUE);
  });

  it("should reset guidance value", () => {
    setMeasureMetadata(measure, "guidance", NEWVALUE);
    expect(measure.measureMetaData.guidance).toBe(NEWVALUE);
  });

  it("should not reset any measure metadata", () => {
    setMeasureMetadata(measure, "test", NEWVALUE);
    expect(measure.measureMetaData.description).toBe(DECRIPTION);
    expect(measure.measureMetaData.copyright).toBe(COPYRIGHT);
    expect(measure.measureMetaData.disclaimer).toBe(DISCLAIMER);
    expect(measure.measureMetaData.rationale).toBe(RATIONALE);
    expect(measure.measureMetaData.guidance).toBe(GUIDANCE);
  });
});
