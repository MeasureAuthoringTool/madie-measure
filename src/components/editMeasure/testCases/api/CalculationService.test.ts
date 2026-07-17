import {
  CalculationService,
  ExecutionStatusType,
  findMeasureGroupPopulationDisplayId,
} from "./CalculationService";
import { officeVisitMeasure } from "./__mocks__/OfficeVisitMeasure";
import { officeVisitValueSet } from "./__mocks__/OfficeVisitValueSet";
import { officeVisitMeasureBundle } from "./__mocks__/OfficeVisitMeasureBundle";
import { testCaseOfficeVisit } from "./__mocks__/TestCaseOfficeVisit";
import {
  ContinuousVariable_Encounter_Fail,
  ContinuousVariable_Encounter_Pass,
  ContinuousVariableBoolean,
  Ratio_Boolean_SingleIP_DenObs_NumObs_Pass,
  Ratio_Encounter_SingleIP_DenObs_NumObs_Pass,
} from "./__mocks__/TestCaseProcessingScenarios";

import {
  DetailedPopulationGroupResult,
  ExecutionResult,
} from "fqm-execution/build/types/Calculator";
import {
  FinalResult,
  PopulationType as FqmPopulationType,
  Relevance,
} from "fqm-execution/build/types/Enums";
import {
  AggregateFunctionType,
  Group,
  GroupPopulation,
  MeasureGroupTypes,
  MeasureScoring,
  PopulationType,
  TestCase,
} from "@madie/madie-models";
import { TextEncoder, TextDecoder } from "util";
import { calculateMeasureReports } from "fqm-execution/build/calculation/Calculator";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

jest.mock("fqm-execution/build/calculation/Calculator", () => ({
  ...jest.requireActual("fqm-execution/build/calculation/Calculator"),
  calculateMeasureReports: jest.fn(),
}));

describe("CalculationService Tests", () => {
  let calculationService: CalculationService;
  const localStorageMock = (function () {
    let store = { madieDebug: "true" };

    return {
      getItem(key) {
        return store[key];
      },

      setItem(key, value) {
        store[key] = value;
      },

      clear() {
        store = {};
      },

      removeItem(key) {
        delete store[key];
      },

      getAll() {
        return store;
      },
    };
  })();

  beforeEach(() => {
    calculationService = new CalculationService();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
  });

  const testCases: TestCase[] = [
    {
      id: "1",
      title: "testing",
      name: "testing",
      description: "description for test",
      json: "",
      executionStatus: "pass",
      groupPopulations: [],
      validResource: true,
      hapiOperationOutcome: undefined,
    },
    {
      id: "2",
      title: "testing",
      name: "testing",
      description: "description for test",
      json: "",
      executionStatus: "fail",
      groupPopulations: [],
      validResource: true,
      hapiOperationOutcome: undefined,
    },
  ] as unknown as TestCase[];

  it("IPP, denominator and numerator Pass test", async () => {
    const calculationResults = await calculationService.calculateTestCases(
      officeVisitMeasure,
      [testCaseOfficeVisit],
      officeVisitMeasureBundle,
      [officeVisitValueSet]
    );
    const expectedPopulationResults =
      calculationResults.results[0].detailedResults[0].populationResults;
    expect(expectedPopulationResults).toEqual([
      {
        criteriaExpression: "ipp",
        populationType: "initial-population",
        result: true,
      },
      {
        criteriaExpression: "denom",
        populationType: "denominator",
        result: true,
      },
      { criteriaExpression: "num", populationType: "numerator", result: true },
    ]);
  });

  it("test calculate to handle error", async () => {
    const measure = {};
    const measureBundle = JSON.parse(JSON.stringify(measure));
    try {
      const calculationResults = await calculationService.calculate(
        measureBundle,
        [],
        [],
        null,
        null,
        true
      );
    } catch (e) {
      expect(e).toBeTruthy();
      expect(e.name).toEqual("UnexpectedResource");
    }
  });

  it("should handle null raw results", () => {
    const output = calculationService.processRawResults(null);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(0);
  });

  it("should provide pass fail stats for test cases", () => {
    const output =
      calculationService.getPassingPercentageForTestCases(testCases);
    expect(output.passPercentage).toBe(50);
    expect(output.passFailRatio).toBe("1/2");
    expect(Object.keys(output).length).toBe(2);
  });

  it("should handle undefined raw results", () => {
    const output = calculationService.processRawResults(undefined);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(0);
  });

  it("should handle empty raw results", () => {
    const output = calculationService.processRawResults([]);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(0);
  });

  it("should handle empty detailed results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(0);
  });

  it("should handle undefined detailed results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: undefined,
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(0);
  });

  it("should handle undefined group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: undefined,
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(0);
  });

  it("should handle empty group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(0);
  });

  it("should handle undefined raw group statement result", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [
              {
                statementName: "ippDef",
                libraryName: "MeasureLib",
                raw: undefined,
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
            ],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(1);
    expect(output["P111"]["group1"]["ippDef"]).toBe(0);
  });

  it("should handles array raw group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [
              {
                statementName: "ippDef",
                libraryName: "MeasureLib",
                raw: [{}, {}],
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
              {
                statementName: "denomDef",
                libraryName: "MeasureLib",
                raw: [{}],
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
            ],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(2);
    expect(output["P111"]["group1"]["ippDef"]).toBeTruthy();
    expect(output["P111"]["group1"]["ippDef"]).toBe(2);
    expect(output["P111"]["group1"]["denomDef"]).toBeTruthy();
    expect(output["P111"]["group1"]["denomDef"]).toBe(1);
  });

  it("should handles boolean raw group statement results", () => {
    const executionResults: ExecutionResult<DetailedPopulationGroupResult>[] = [
      {
        patientId: "P111",
        detailedResults: [
          {
            groupId: "group1",
            statementResults: [
              {
                statementName: "ippDef",
                libraryName: "MeasureLib",
                raw: true,
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
              {
                statementName: "denomDef",
                libraryName: "MeasureLib",
                raw: false,
                final: FinalResult.NA,
                relevance: Relevance.NA,
              },
            ],
          },
        ],
      },
    ];
    const output = calculationService.processRawResults(executionResults);
    expect(output).toBeTruthy();
    expect(Object.keys(output).length).toBe(1);
    expect(output["P111"]).toBeTruthy();
    expect(Object.keys(output["P111"]).length).toBe(1);
    expect(output["P111"]["group1"]).toBeTruthy();
    expect(Object.keys(output["P111"]["group1"]).length).toBe(2);
    expect(output["P111"]["group1"]["ippDef"]).toBeTruthy();
    expect(output["P111"]["group1"]["denomDef"]).toBeFalsy();
  });

  describe("CalculationService.isValuePass", () => {
    it("should pass two blanks", () => {
      const output = calculationService.isValuePass("", "", false);
      expect(output).toBeTruthy();
    });

    it("should pass blank and undefined", () => {
      const output = calculationService.isValuePass("", undefined, false);
      expect(output).toBeTruthy();
    });

    it("should pass blank and zero", () => {
      const output = calculationService.isValuePass(0, "", false);
      expect(output).toBeTruthy();
    });

    it("should pass 1 string and 1 number", () => {
      const output = calculationService.isValuePass(1, "1", false);
      expect(output).toBeTruthy();
    });

    it("should pass 2 string and 2 number", () => {
      const output = calculationService.isValuePass(2, "2", false);
      expect(output).toBeTruthy();
    });

    it("should fail 2 string and 1 number", () => {
      const output = calculationService.isValuePass(1, "2", false);
      expect(output).toBeFalsy();
    });

    it("should pass blank and zero", () => {
      const output = calculationService.isValuePass(false, undefined, true);
      expect(output).toBeTruthy();
    });
  });

  describe("CalculationService.isGroupPass", () => {
    it("should pass null group", () => {
      const output = calculationService.isGroupPass(null, null);
      expect(output).toEqual(true);
    });

    it("should pass undefined group", () => {
      const output = calculationService.isGroupPass(undefined, null);
      expect(output).toEqual(true);
    });

    it("should pass group with undefined populationValues", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.RATIO,
        populationBasis: "boolean",
        populationValues: undefined,
        stratificationValues: undefined,
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("should pass group with empty populationValues and undefined stratifications", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.RATIO,
        populationBasis: "boolean",
        populationValues: [],
        stratificationValues: undefined,
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("should pass group with empty populationValues and empty stratifications", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.RATIO,
        populationBasis: "boolean",
        populationValues: [],
        stratificationValues: [],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("should pass group with matching populations and empty stratifications for Cohort", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.COHORT,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "ipp",
            name: PopulationType.INITIAL_POPULATION,
          },
        ],
        stratificationValues: [],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("should pass group with matching populations and empty stratifications for Ratio", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.RATIO,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "ipp",
            name: PopulationType.INITIAL_POPULATION,
          },
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "den",
            name: PopulationType.DENOMINATOR,
          },
          {
            id: "1",
            expected: false,
            actual: false,
            criteriaReference: "num",
            name: PopulationType.NUMERATOR,
          },
        ],
        stratificationValues: [],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("should fail group with failing populations and empty stratifications for Ratio", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.RATIO,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "ipp",
            name: PopulationType.INITIAL_POPULATION,
          },
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "den",
            name: PopulationType.DENOMINATOR,
          },
          {
            id: "1",
            expected: true,
            actual: false,
            criteriaReference: "num",
            name: PopulationType.NUMERATOR,
          },
        ],
        stratificationValues: [],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(false);
    });

    it("should pass group with matching populations and matching stratifications for Cohort", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.COHORT,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "ipp",
            name: PopulationType.INITIAL_POPULATION,
          },
        ],
        stratificationValues: [
          {
            id: "321",
            name: "strata-1 Initial Population",
            expected: true,
            actual: true,
            populationValues: [
              {
                id: "1",
                name: PopulationType.INITIAL_POPULATION,
                expected: true,
                actual: true,
              },
            ],
          },
        ],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("should pass group with matching populations and failing stratifications for Cohort", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.COHORT,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "ipp",
            name: PopulationType.INITIAL_POPULATION,
          },
        ],
        stratificationValues: [
          {
            id: "321",
            name: "strata-1 Initial Population",
            expected: true,
            actual: false,
            populationValues: [
              {
                id: "1",
                name: PopulationType.INITIAL_POPULATION,
                expected: true,
                actual: false,
              },
            ],
          },
        ],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(true);
    });

    it("Should pass group with stratifications and filter out invalid population values", () => {
      const group: Group = {
        id: "6734f7e4af7d11385b114b91",
        scoring: "Continuous Variable",
        populations: [
          {
            id: "69333bb0-0e65-41ac-9648-8badc3e70c6e",
            name: PopulationType.INITIAL_POPULATION,
            definition: "Initial Population",
            description: "",
          },
          {
            id: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
            name: PopulationType.MEASURE_POPULATION,
            definition: "Qualifying Encounters",
            description: "",
          },
          {
            id: "9a4b1c39-5a94-49b2-ae33-75ec80a5d7d6",
            name: PopulationType.MEASURE_POPULATION_OBSERVATION,
            definition: "",
            description: "",
          },
        ],
        measureObservations: [
          {
            id: "3a429f92-8eb6-456a-bfd4-658458d54885",
            definition: "MeasureObservation",

            criteriaReference: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
            aggregateMethod: AggregateFunctionType.MAXIMUM,
          },
        ],
        groupDescription: "",
        improvementNotation: "",
        rateAggregation: "",
        measureGroupTypes: [MeasureGroupTypes.PROCESS],
        scoringUnit: "",
        stratifications: [
          {
            id: "a9197a7f-78ca-484c-a84d-05531c1dd9e4",
            description: "StratificationOne",
            cqlDefinition: "Stratification 1",
            associations: [PopulationType.INITIAL_POPULATION],
          },
          {
            id: "c88151f1-83dd-477e-afe7-631e17cec6ff",
            description: "StratificationTwo",
            cqlDefinition: "Stratification 2",
            associations: [PopulationType.MEASURE_POPULATION],
          },
        ],
        populationBasis: "Encounter",
      };
      const groupPop: GroupPopulation = {
        groupId: "6734f7e4af7d11385b114b91",
        scoring: "Continuous Variable",
        populationBasis: "Encounter",
        populationValues: [
          {
            id: "69333bb0-0e65-41ac-9648-8badc3e70c6e",
            criteriaReference: null,
            name: PopulationType.INITIAL_POPULATION,
            expected: 1,
            actual: 1,
          },
          {
            id: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
            criteriaReference: null,
            name: PopulationType.MEASURE_POPULATION,
            expected: 1,
            actual: 1,
          },
          {
            id: "measurePopulationObservation0",
            criteriaReference: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
            name: PopulationType.MEASURE_POPULATION_OBSERVATION,
            expected: 2,
            actual: 2,
          },
        ],
        stratificationValues: [
          {
            id: "a9197a7f-78ca-484c-a84d-05531c1dd9e4",
            name: "Strata-1",
            expected: null,
            actual: null,
            populationValues: [
              {
                id: "69333bb0-0e65-41ac-9648-8badc3e70c6e",
                criteriaReference: null,
                name: PopulationType.INITIAL_POPULATION,
                expected: 1,
                actual: 1,
              },
              {
                id: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
                criteriaReference: null,
                name: PopulationType.MEASURE_POPULATION,
                expected: 1,
                actual: 1,
              },
              {
                id: "measurePopulationObservation0",
                criteriaReference: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
                name: PopulationType.MEASURE_POPULATION_OBSERVATION,
                expected: 2,
                actual: 0,
              },
            ],
          },
          {
            id: "c88151f1-83dd-477e-afe7-631e17cec6ff",
            name: "Strata-2",
            expected: null,
            actual: null,
            populationValues: [
              {
                id: "69333bb0-0e65-41ac-9648-8badc3e70c6e",
                criteriaReference: null,
                name: PopulationType.INITIAL_POPULATION,
                expected: 0,
                actual: 0,
              },
              {
                id: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
                criteriaReference: null,
                name: PopulationType.MEASURE_POPULATION,
                expected: 0,
                actual: 0,
              },
              {
                id: "measurePopulationObservation0",
                criteriaReference: "60ab5bfd-bd1a-4e53-8cd8-1cb4aae465dd",
                name: PopulationType.MEASURE_POPULATION_OBSERVATION,
                expected: 2,
                actual: 0,
              },
            ],
          },
        ],
      };

      const output = calculationService.isGroupPass(groupPop, group);
      expect(output).toEqual(true);
    });

    it("should fail group with incorrect measure observations for Ratio", () => {
      const groupPop: GroupPopulation = {
        groupId: "group1ID",
        scoring: MeasureScoring.RATIO,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            expected: true,
            actual: true,
            criteriaReference: "ipp",
            name: PopulationType.INITIAL_POPULATION,
          },
          {
            id: "2",
            expected: true,
            actual: true,
            criteriaReference: "den",
            name: PopulationType.DENOMINATOR,
          },
          {
            id: "3",
            expected: "33" as any,
            actual: 44,
            criteriaReference: "denObs",
            name: PopulationType.DENOMINATOR_OBSERVATION,
          },
          {
            id: "4",
            expected: true,
            actual: true,
            criteriaReference: "num",
            name: PopulationType.NUMERATOR,
          },
          {
            id: "5",
            expected: true,
            actual: "true" as any,
            criteriaReference: "num",
            name: PopulationType.NUMERATOR_OBSERVATION,
          },
        ],
        stratificationValues: [],
      };
      const output = calculationService.isGroupPass(groupPop, {} as Group);
      expect(output).toEqual(false);
    });
  });

  describe("CalculationService.buildPatientResults", () => {
    it("should return truthy output for null input", () => {
      const output = calculationService.buildPatientResults(null);
      expect(output).toBeTruthy();
      expect(output?.populations).toBeTruthy();
      expect(Object.keys(output.populations)).toEqual([]);
      expect(output?.observations).toBeTruthy();
      expect(Object.keys(output.observations)).toEqual([]);
    });

    it("should return truthy output for undefined input", () => {
      const output = calculationService.buildPatientResults(undefined);
      expect(output).toBeTruthy();
      expect(output?.populations).toBeTruthy();
      expect(Object.keys(output.populations)).toEqual([]);
      expect(output?.observations).toBeTruthy();
      expect(Object.keys(output.observations)).toEqual([]);
    });

    it("should return truthy output for empty input", () => {
      const output = calculationService.buildPatientResults([]);
      expect(output).toBeTruthy();
      expect(output?.populations).toBeTruthy();
      expect(Object.keys(output.populations)).toEqual([]);
      expect(output?.observations).toBeTruthy();
      expect(Object.keys(output.observations)).toEqual([]);
    });

    it("should return correct patient results for CV", () => {
      const populationResults =
        ContinuousVariableBoolean.populationGroupResults[0].populationResults;
      const output = calculationService.buildPatientResults(populationResults);
      expect(output).toBeTruthy();
      const expected = {
        populations: {
          "79a67327-8a94-4ae0-a75b-b67c7d28a241": {
            populationType: FqmPopulationType.IPP,
            criteriaExpression: "boolIpp",
            result: true,
            populationId: "79a67327-8a94-4ae0-a75b-b67c7d28a241",
          },
          "79349c30-791c-41c7-9463-81872a0dbed1": {
            populationType: FqmPopulationType.MSRPOPL,
            criteriaExpression: "boolDenom",
            result: true,
            populationId: "79349c30-791c-41c7-9463-81872a0dbed1",
          },
        },
        observations: {
          "79349c30-791c-41c7-9463-81872a0dbed1": {
            populationType: FqmPopulationType.OBSERV,
            criteriaExpression: "boolFunc",
            result: true,
            populationId: "79349c30-791c-41c7-9463-81872a0dbed1",
            criteriaReferenceId: "79349c30-791c-41c7-9463-81872a0dbed1",
            observations: [1],
          },
        },
      };
      expect(output).toEqual(expected);
    });

    it("should return correct patient results for Ratio with Observations", () => {
      const populationResults =
        Ratio_Boolean_SingleIP_DenObs_NumObs_Pass.populationGroupResults[0]
          .populationResults;
      const output = calculationService.buildPatientResults(populationResults);
      expect(output).toBeTruthy();
      const expected = {
        populations: {
          "3c710d76-d5d2-4dc0-a3fb-28fdac1055d0": {
            populationType: FqmPopulationType.IPP,
            criteriaExpression: "boolIpp",
            result: true,
            populationId: "3c710d76-d5d2-4dc0-a3fb-28fdac1055d0",
          },
          "760758ae-009f-49b2-b7a3-c9997ac3931d": {
            populationType: FqmPopulationType.DENOM,
            criteriaExpression: "boolDenom",
            result: true,
            populationId: "760758ae-009f-49b2-b7a3-c9997ac3931d",
          },
          "77e217d6-03dd-41ca-a1c3-f679933f9dd7": {
            populationType: FqmPopulationType.NUMER,
            criteriaExpression: "boolNum",
            result: true,
            populationId: "77e217d6-03dd-41ca-a1c3-f679933f9dd7",
          },
        },
        observations: {
          "77e217d6-03dd-41ca-a1c3-f679933f9dd7": {
            populationType: FqmPopulationType.OBSERV,
            criteriaExpression: "boolFunc2",
            result: true,
            populationId: "77e217d6-03dd-41ca-a1c3-f679933f9dd7",
            criteriaReferenceId: "77e217d6-03dd-41ca-a1c3-f679933f9dd7",
            observations: [14],
          },
          "760758ae-009f-49b2-b7a3-c9997ac3931d": {
            populationType: FqmPopulationType.OBSERV,
            criteriaExpression: "boolFunc",
            result: true,
            populationId: "760758ae-009f-49b2-b7a3-c9997ac3931d",
            criteriaReferenceId: "760758ae-009f-49b2-b7a3-c9997ac3931d",
            observations: [1],
          },
        },
      };
      expect(output).toEqual(expected);
    });
  });

  describe("CalculationService.buildEpisodeResults", () => {
    it("should return correct episode results for Ratio Encounter Single IP with both DEN and NUM obs", () => {
      const episodeResults =
        Ratio_Encounter_SingleIP_DenObs_NumObs_Pass.populationGroupResults[0]
          .episodeResults;
      const output = calculationService.buildEpisodeResults(episodeResults);
      expect(output).toBeTruthy();
      const expected = {
        populations: {
          "8d8b74ce-a843-4039-ad94-acad42cac257": {
            populationType: FqmPopulationType.IPP,
            criteriaExpression: "ipp",
            result: 2,
            populationId: "8d8b74ce-a843-4039-ad94-acad42cac257",
          },
          "abce9253-30f1-438c-b370-30a264791b21": {
            populationType: FqmPopulationType.DENOM,
            criteriaExpression: "denom",
            result: 2,
            populationId: "abce9253-30f1-438c-b370-30a264791b21",
          },
          "e1542f9f-7c5b-40ea-9feb-2d920d343f39": {
            populationType: FqmPopulationType.DENEX,
            result: 0,
            populationId: "e1542f9f-7c5b-40ea-9feb-2d920d343f39",
          },
          "51122f75-851f-428c-938c-1d512da1fe7f": {
            populationType: FqmPopulationType.NUMER,
            criteriaExpression: "num",
            result: 1,
            populationId: "51122f75-851f-428c-938c-1d512da1fe7f",
          },
          "2cf3f052-9ba0-450d-a80e-1a823de962f8": {
            populationType: FqmPopulationType.NUMEX,
            result: 0,
            populationId: "2cf3f052-9ba0-450d-a80e-1a823de962f8",
          },
        },
        observations: {
          "abce9253-30f1-438c-b370-30a264791b21": {
            populationType: FqmPopulationType.OBSERV,
            criteriaExpression: "daysObs",
            result: true,
            populationId: "abce9253-30f1-438c-b370-30a264791b21",
            criteriaReferenceId: "abce9253-30f1-438c-b370-30a264791b21",
            observations: [1, 1],
          },
        },
      };
      expect(output).toEqual(expected);
    });

    it("should return correct episode results for CV Encounter", () => {
      const episodeResults =
        ContinuousVariable_Encounter_Pass.populationGroupResults[0]
          .episodeResults;
      const output = calculationService.buildEpisodeResults(episodeResults);
      expect(output).toBeTruthy();
      const expected = {
        populations: {
          "77b6063f-f7c8-45db-8d84-1f0d8e7993b5": {
            populationType: FqmPopulationType.IPP,
            criteriaExpression: "ipp",
            result: 2,
            populationId: "77b6063f-f7c8-45db-8d84-1f0d8e7993b5",
          },
          "797c4d66-cfd3-4ced-a482-1d55d5cad85c": {
            populationType: FqmPopulationType.MSRPOPL,
            criteriaExpression: "mPop",
            result: 2,
            populationId: "797c4d66-cfd3-4ced-a482-1d55d5cad85c",
          },
          "5edeebba-b888-4d92-a8b2-8568d78ceb86": {
            populationType: FqmPopulationType.MSRPOPLEX,
            result: 0,
            populationId: "5edeebba-b888-4d92-a8b2-8568d78ceb86",
          },
        },
        observations: {
          "ff17cb94-c66e-4f70-a66d-52ace013d054": {
            populationType: FqmPopulationType.OBSERV,
            criteriaExpression: "daysObs",
            result: true,
            populationId: "ff17cb94-c66e-4f70-a66d-52ace013d054",
            criteriaReferenceId: "797c4d66-cfd3-4ced-a482-1d55d5cad85c",
            observations: [5, 1],
          },
        },
      };
      expect(output).toEqual(expected);
    });

    it("should return test case results for episode based cohort stratification", () => {
      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [],
          episodeResults: [
            {
              episodeId: "episode-1",
              populationResults: [
                {
                  populationType: FqmPopulationType.IPP,
                  criteriaExpression: "Initial Population",
                  result: true,
                  populationId: "1",
                },
              ],
              stratifierResults: [
                {
                  strataCode: "strata-1",
                  result: true,
                  appliesResult: false,
                  strataId: "strata-1",
                },
              ],
            },
            {
              episodeId: "episode-2",
              populationResults: [
                {
                  populationType: FqmPopulationType.IPP,
                  criteriaExpression: "Initial Population",
                  result: true,
                  populationId: "1",
                },
              ],
              stratifierResults: [
                {
                  strataCode: "strata-1",
                  result: false,
                  appliesResult: false,
                },
              ],
            },
          ],
          populationResults: [
            {
              populationId: "1",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "Initial Population",
              result: true,
            },
          ],
          stratifierResults: [
            {
              strataCode: "strata-1",
              result: true,
              appliesResult: true,
              strataId: "strata-1",
            },
          ],
        },
      ];
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "boolean",
            populationValues: [
              {
                id: "1",
                name: PopulationType.INITIAL_POPULATION,
                expected: 2,
                actual: 2,
              },
            ],
            stratificationValues: [
              {
                id: "strata-1",
                name: "strata-1 Initial Population",
                expected: true,
                populationValues: [
                  {
                    id: "1",
                    name: PopulationType.INITIAL_POPULATION,
                    expected: 1,
                    actual: 1,
                  },
                ],
              },
            ],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;

      const groups: Group[] = [
        {
          id: "groupID",
          displayId: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "Encounter",
          populations: [
            {
              id: "1",
              displayId: "1",
              name: PopulationType.INITIAL_POPULATION,
              definition: "Initial Population",
            },
          ],
          stratifications: [
            {
              id: "strata-1",
              displayId: "strata-1",
              cqlDefinition: "Stratification 1",
              association: PopulationType.INITIAL_POPULATION,
            },
          ],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];
      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
      const outputGroupPopulations = output.groupPopulations;
      expect(outputGroupPopulations).toBeTruthy();
      expect(outputGroupPopulations.length).toEqual(1);
      const group1PopVals = outputGroupPopulations[0].populationValues;
      expect(group1PopVals).toBeTruthy();
      expect(group1PopVals.length).toEqual(1);
      expect(group1PopVals[0]).toBeTruthy();
      expect(group1PopVals[0].expected).toBeTruthy();
      expect(group1PopVals[0].actual).toBeTruthy();
      const group1StratVals = outputGroupPopulations[0].stratificationValues;
      expect(group1StratVals).toBeTruthy();
      expect(group1StratVals.length).toEqual(1);
      expect(group1StratVals[0].populationValues[0].actual).toEqual(1);
      expect(group1StratVals[0].populationValues[0].actual).toEqual(1);
    });
  });

  describe("CalculationService.processTestCaseResults", () => {
    it("should return null for null testCase", () => {
      const groups: Group[] = [
        {
          id: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];

      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
      ];

      const output = calculationService.processTestCaseResults(
        null,
        groups,
        popGroupResults
      );
      expect(output).toEqual(null);
    });

    it("should return undefined for undefined testCase", () => {
      const groups: Group[] = [
        {
          id: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];

      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
      ];

      const output = calculationService.processTestCaseResults(
        undefined,
        groups,
        popGroupResults
      );
      expect(output).toEqual(undefined);
    });

    it("should return Pass executionStatus if groupPopulations are null but actual result is false", () => {
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: null,
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as TestCase;

      const groups: Group[] = [
        {
          id: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];

      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: false,
            },
          ],
        },
      ];

      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
    });

    it("should return Fail executionStatus if groupPopulations are empty and actual result is true", () => {
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;

      const groups: Group[] = [
        {
          id: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];

      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationId: "pop1ID",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
      ];

      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.FAIL);
    });

    it("should return Fail executionStatus for provided measure groups when no matching groups are found and actual result is true", () => {
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "boolean",
            populationValues: [
              {
                id: "pop1ID",
                name: PopulationType.INITIAL_POPULATION,
                criteriaReference: "boolIpp",
                expected: true,
              },
            ],
            stratificationValues: [],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;

      const groups: Group[] = [
        {
          id: "groupID999",
          displayId: "groupID888",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              displayId: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];

      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationId: "popXID",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
        {
          groupId: "groupID999",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationId: "pop1ID",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
      ];

      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.FAIL);
    });

    it("should return test case results for Cohort, boolean popBasis and pass executionStatus", () => {
      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationId: "pop1ID",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
      ];
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "boolean",
            populationValues: [
              {
                id: "pop1ID",
                name: PopulationType.INITIAL_POPULATION,
                criteriaReference: "boolIpp",
                expected: true,
              },
            ],
            stratificationValues: [],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;
      const groups: Group[] = [
        {
          id: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];
      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
      const outputGroupPopulations = output.groupPopulations;
      expect(outputGroupPopulations).toBeTruthy();
      expect(outputGroupPopulations.length).toEqual(1);
      const group1PopVals = outputGroupPopulations[0].populationValues;
      expect(group1PopVals).toBeTruthy();
      expect(group1PopVals.length).toEqual(1);
      expect(group1PopVals[0]).toBeTruthy();
      expect(group1PopVals[0].expected).toBeTruthy();
      expect(group1PopVals[0].actual).toBeTruthy();
    });

    it("should return test case results for Cohort, boolean popBasis and fail execution status", () => {
      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [], //only needed for strats currently
          populationResults: [
            {
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: false,
            },
          ],
        },
      ];
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "boolean",
            populationValues: [
              {
                id: "pop1ID",
                name: PopulationType.INITIAL_POPULATION,
                criteriaReference: "boolIpp",
                expected: true,
              },
            ],
            stratificationValues: [],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;
      const groups: Group[] = [
        {
          id: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];
      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.FAIL);
      const outputGroupPopulations = output.groupPopulations;
      expect(outputGroupPopulations).toBeTruthy();
      expect(outputGroupPopulations.length).toEqual(1);
      const group1PopVals = outputGroupPopulations[0].populationValues;
      expect(group1PopVals).toBeTruthy();
      expect(group1PopVals.length).toEqual(1);
      expect(group1PopVals[0]).toBeTruthy();
      expect(group1PopVals[0].expected).toBeTruthy();
      expect(group1PopVals[0].actual).toBeFalsy();
    });

    it("should return test case results for cohort, boolean popBasis with stratification", () => {
      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [
            {
              libraryName: "TestLib",
              raw: true,
              statementName: "strat1Def",
              final: FinalResult.TRUE,
              relevance: Relevance.TRUE,
            },
            {
              libraryName: "TestLib",
              raw: false,
              statementName: "strat2Def",
              final: FinalResult.TRUE,
              relevance: Relevance.TRUE,
            },
          ],
          populationResults: [
            {
              populationId: "pop1",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
          stratifierResults: [
            {
              strataCode: "strata1",
              result: true,
              appliesResult: true,
              strataId: "strata1",
            },
            {
              strataCode: "strata2",
              result: true,
              appliesResult: false,
              strataId: "strata2",
            },
          ],
        },
      ];
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "boolean",
            populationValues: [
              {
                id: "pop1",
                name: PopulationType.INITIAL_POPULATION,
                expected: true,
              },
            ],
            stratificationValues: [
              {
                id: "strata1",
                name: "strata-1 Initial Population",
                expected: true,
                populationValues: [
                  {
                    id: "pop1",
                    name: PopulationType.INITIAL_POPULATION,
                    expected: true,
                    actual: true,
                  },
                ],
              },
              {
                id: "strata2",
                name: "strata-2 Initial Population",
                expected: true,
                populationValues: [
                  {
                    id: "pop1",
                    name: PopulationType.INITIAL_POPULATION,
                    expected: true,
                    actual: true,
                  },
                ],
              },
            ],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;

      const groups: Group[] = [
        {
          id: "groupID",
          displayId: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1",
              displayId: "pop1",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [
            {
              id: "strata1",
              displayId: "strata1",
              cqlDefinition: "strat1Def",
              association: PopulationType.INITIAL_POPULATION,
            },
            {
              id: "strata2",
              displayId: "strata2",
              cqlDefinition: "strat2Def",
              association: PopulationType.INITIAL_POPULATION,
            },
          ],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];
      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
      const outputGroupPopulations = output.groupPopulations;
      expect(outputGroupPopulations).toBeTruthy();
      expect(outputGroupPopulations.length).toEqual(1);
      const group1PopVals = outputGroupPopulations[0].populationValues;
      expect(group1PopVals).toBeTruthy();
      expect(group1PopVals.length).toEqual(1);
      expect(group1PopVals[0]).toBeTruthy();
      expect(group1PopVals[0].expected).toBeTruthy();
      expect(group1PopVals[0].actual).toBeTruthy();
      const group1StratVals = outputGroupPopulations[0].stratificationValues;
      expect(group1StratVals).toBeTruthy();
      expect(group1StratVals.length).toEqual(2);
      expect(group1StratVals[0].populationValues[0].actual).toEqual(true);
      expect(group1StratVals[1].populationValues[0].actual).toEqual(true);
    });

    it("should return test case results for continuous variable, boolean popBasis", () => {
      const output = calculationService.processTestCaseResults(
        ContinuousVariableBoolean.testCase,
        ContinuousVariableBoolean.measureGroups,
        ContinuousVariableBoolean.populationGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
      expect(output.groupPopulations.length).toEqual(1);
      const popVals = output.groupPopulations[0].populationValues;
      expect(popVals).toBeTruthy();
      expect(popVals.length).toEqual(3);
      expect(popVals[0].name).toEqual(PopulationType.INITIAL_POPULATION);
      expect(popVals[0].actual).toEqual(true);
      expect(popVals[1].name).toEqual(PopulationType.MEASURE_POPULATION);
      expect(popVals[1].actual).toEqual(true);
      expect(popVals[2].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[2].actual).toEqual(1);
    });

    it("should return test case results for continuous variable, boolean popBasis", () => {
      const output = calculationService.processTestCaseResults(
        ContinuousVariableBoolean.testCase,
        ContinuousVariableBoolean.measureGroups,
        ContinuousVariableBoolean.populationGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
      expect(output.groupPopulations.length).toEqual(1);
      const popVals = output.groupPopulations[0].populationValues;
      expect(popVals).toBeTruthy();
      expect(popVals.length).toEqual(3);
      expect(popVals[0].name).toEqual(PopulationType.INITIAL_POPULATION);
      expect(popVals[0].actual).toEqual(true);
      expect(popVals[1].name).toEqual(PopulationType.MEASURE_POPULATION);
      expect(popVals[1].actual).toEqual(true);
      expect(popVals[2].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[2].actual).toEqual(1);
    });

    it("should return test case results for continuous variable, Encounter popBasis", () => {
      const output = calculationService.processTestCaseResults(
        ContinuousVariable_Encounter_Pass.testCase,
        ContinuousVariable_Encounter_Pass.measureGroups,
        ContinuousVariable_Encounter_Pass.populationGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.PASS);
      expect(output.groupPopulations.length).toEqual(1);
      const popVals = output.groupPopulations[0].populationValues;
      expect(popVals.length).toEqual(4);
      expect(popVals[0].name).toEqual(PopulationType.INITIAL_POPULATION);
      expect(popVals[0].actual).toEqual(2);
      expect(popVals[1].name).toEqual(PopulationType.MEASURE_POPULATION);
      expect(popVals[1].actual).toEqual(2);
      expect(popVals[2].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[2].actual).toEqual(5);
      expect(popVals[3].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[3].actual).toEqual(1);
    });

    it("should return test case fail results for continuous variable, Encounter popBasis", () => {
      // Todo: fill this in with ContinuousVariable_Encounter_Fail
      const output = calculationService.processTestCaseResults(
        ContinuousVariable_Encounter_Fail.testCase,
        ContinuousVariable_Encounter_Fail.measureGroups,
        ContinuousVariable_Encounter_Fail.populationGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.executionStatus).toEqual(ExecutionStatusType.FAIL);
      expect(output.groupPopulations.length).toEqual(1);
      const popVals = output.groupPopulations[0].populationValues;
      expect(popVals.length).toEqual(5);
      expect(popVals[0].name).toEqual(PopulationType.INITIAL_POPULATION);
      expect(popVals[0].actual).toEqual(2);
      expect(popVals[1].name).toEqual(PopulationType.MEASURE_POPULATION);
      expect(popVals[1].actual).toEqual(2);
      expect(popVals[2].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[2].actual).toEqual(5);
      expect(popVals[3].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[3].actual).toEqual(1);
      expect(popVals[4].name).toEqual(
        PopulationType.MEASURE_POPULATION_OBSERVATION
      );
      expect(popVals[4].actual).toEqual(null);
    });

    it("should set actual to null for patient-based population not found in measure group", () => {
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "boolean",
            populationValues: [
              {
                id: "nonexistentPopId",
                name: PopulationType.INITIAL_POPULATION,
                expected: false,
              },
            ],
            stratificationValues: [],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;
      const groups: Group[] = [
        {
          id: "groupID",
          displayId: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "boolean",
          populations: [
            {
              id: "pop1ID",
              displayId: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];
      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [],
          populationResults: [
            {
              populationId: "pop1ID",
              populationType: FqmPopulationType.IPP,
              criteriaExpression: "boolIpp",
              result: true,
            },
          ],
        },
      ];
      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.groupPopulations[0].populationValues[0].actual).toBeNull();
    });

    it("should set actual to 0 for episode-based population not found in measure group", () => {
      const testCase = {
        id: "TC1",
        name: "TestCase1",
        title: "TestCase1",
        description: "first",
        validResource: true,
        groupPopulations: [
          {
            groupId: "groupID",
            scoring: MeasureScoring.COHORT,
            populationBasis: "Encounter",
            populationValues: [
              {
                id: "nonexistentPopId",
                name: PopulationType.INITIAL_POPULATION,
                expected: 0,
              },
            ],
            stratificationValues: [],
          },
        ],
        createdAt: "",
        createdBy: "",
        lastModifiedAt: "",
        lastModifiedBy: "",
        executionStatus: "NA",
        series: undefined,
        hapiOperationOutcome: undefined,
      } as unknown as TestCase;
      const groups: Group[] = [
        {
          id: "groupID",
          displayId: "groupID",
          scoring: MeasureScoring.COHORT,
          populationBasis: "Encounter",
          populations: [
            {
              id: "pop1ID",
              displayId: "pop1ID",
              name: PopulationType.INITIAL_POPULATION,
              definition: "boolIpp",
            },
          ],
          stratifications: [],
          measureObservations: [],
          measureGroupTypes: [MeasureGroupTypes.OUTCOME],
        },
      ];
      const popGroupResults: DetailedPopulationGroupResult[] = [
        {
          groupId: "groupID",
          statementResults: [],
          episodeResults: [],
        },
      ];
      const output = calculationService.processTestCaseResults(
        testCase,
        groups,
        popGroupResults
      );
      expect(output).toBeTruthy();
      expect(output.groupPopulations[0].populationValues[0].actual).toEqual(0);
    });
  });

  describe("CalculationService.findMeasureGroupPopulationDisplayId", () => {
    const group = {
      id: "626be4370ca8110d3b22404b",
      displayId: "Group_1",
      scoring: "Proportion",
      populations: [
        {
          id: "id-1",
          displayId: "InitialPopulation_1",
          name: PopulationType.INITIAL_POPULATION,
          definition: "ipp",
        },
        {
          id: "id-2",
          displayId: "Denominator_1",
          name: PopulationType.DENOMINATOR,
          definition: "denom",
        },
        {
          id: "id-3",
          displayId: "Numerator_1",
          name: PopulationType.NUMERATOR,
          definition: "num",
        },
      ],
      measureObservations: [
        {
          id: "id-4",
          definition: "MyFunc1",
          aggregateMethod: "Count",
          criteriaReference: "id-2",
          displayId: "MeasureObservation_1",
        },
      ],
      stratifications: [
        {
          id: "id-5",
          cqlDefinition: "",
          description: "description",
          association: undefined,
          displayId: "Stratification_1",
        },
      ],

      measureGroupTypes: [MeasureGroupTypes.OUTCOME],
      groupDescription: null,
    } as unknown as Group;

    it("should return observation displayId", () => {
      const result = findMeasureGroupPopulationDisplayId(group, "id-4");
      expect(result).toEqual("MeasureObservation_1");
    });

    it("should return stratification displayId", () => {
      const result = findMeasureGroupPopulationDisplayId(group, "id-5");
      expect(result).toEqual("Stratification_1");
    });

    it("should return population displayId", () => {
      const result = findMeasureGroupPopulationDisplayId(group, "id-1");
      expect(result).toEqual("InitialPopulation_1");
    });

    it("should return original id if not found", () => {
      const result = findMeasureGroupPopulationDisplayId(group, "original-id");
      expect(result).toEqual("original-id");
    });
  });

  describe("CalculationService.getObservationResources", () => {
    it("getObservationResources Pass", () => {
      const output = calculationService.getObservationResources(
        ContinuousVariable_Encounter_Pass.testCase,
        ContinuousVariable_Encounter_Pass.populationGroupResults[0]
      );
      expect(output).toBeTruthy();
      expect(output.groupId).toBe(
        ContinuousVariable_Encounter_Pass.populationGroupResults[0].groupId
      );
      expect(output.relations).toHaveLength(2);
      expect(output.relations[0].resources[0]).toContain("Encounter");
    });

    it("should return null when bad results", () => {
      const output = calculationService.getObservationResources(
        ContinuousVariable_Encounter_Pass.testCase,
        ContinuousVariable_Encounter_Fail.populationGroupResults
      );
      expect(output).toBeNull();
    });
  });

  describe("CalculationService.calculateCompositeTestCases", () => {
    const mockedCalculateMeasureReports =
      calculateMeasureReports as jest.MockedFunction<
        typeof calculateMeasureReports
      >;

    beforeEach(() => {
      mockedCalculateMeasureReports.mockReset();
    });

    it("delegates to calculateMeasureReports with formatted measurement period and summary reportType", async () => {
      const expectedOutput = { results: [] } as any;
      mockedCalculateMeasureReports.mockResolvedValue(expectedOutput);

      const output = await calculationService.calculateCompositeTestCases(
        officeVisitMeasure,
        [testCaseOfficeVisit],
        officeVisitMeasureBundle,
        [officeVisitValueSet]
      );

      expect(output).toBe(expectedOutput);
      expect(mockedCalculateMeasureReports).toHaveBeenCalledTimes(1);

      const [bundleArg, patientBundlesArg, optionsArg, valueSetsArg] =
        mockedCalculateMeasureReports.mock.calls[0];
      expect(bundleArg).toBe(officeVisitMeasureBundle);
      expect(patientBundlesArg).toHaveLength(1);
      // buildPatientBundle rewrites Patient.id to the testCase id
      const patientEntry = patientBundlesArg[0].entry?.find(
        (e) => e.resource?.resourceType === "Patient"
      );
      expect(patientEntry?.resource?.id).toBe(testCaseOfficeVisit.id);
      expect(optionsArg).toMatchObject({
        trustMetaProfile: true,
        measurementPeriodStart: "2022-01-01",
        measurementPeriodEnd: "2023-12-21",
        reportType: "summary",
      });
      expect(valueSetsArg).toEqual([officeVisitValueSet]);
    });

    it("passes undefined measurement period fields when measure has no measurement period", async () => {
      mockedCalculateMeasureReports.mockResolvedValue({ results: [] } as any);
      const measureWithoutPeriod = {
        ...officeVisitMeasure,
        measurementPeriodStart: undefined,
        measurementPeriodEnd: undefined,
      };

      await calculationService.calculateCompositeTestCases(
        measureWithoutPeriod as any,
        [testCaseOfficeVisit],
        officeVisitMeasureBundle,
        [officeVisitValueSet]
      );

      const options = mockedCalculateMeasureReports.mock.calls[0][2];
      expect(options.measurementPeriodStart).toBeUndefined();
      expect(options.measurementPeriodEnd).toBeUndefined();
    });

    it("propagates errors thrown by calculateMeasureReports", async () => {
      mockedCalculateMeasureReports.mockRejectedValue(new Error("boom"));

      await expect(
        calculationService.calculateCompositeTestCases(
          officeVisitMeasure,
          [testCaseOfficeVisit],
          officeVisitMeasureBundle,
          [officeVisitValueSet]
        )
      ).rejects.toThrow("boom");
    });

    it("builds a patient bundle for each test case", async () => {
      mockedCalculateMeasureReports.mockResolvedValue({ results: [] } as any);
      const secondTestCase = {
        ...testCaseOfficeVisit,
        id: "second-tc-id",
      };

      await calculationService.calculateCompositeTestCases(
        officeVisitMeasure,
        [testCaseOfficeVisit, secondTestCase],
        officeVisitMeasureBundle,
        [officeVisitValueSet]
      );

      const patientBundlesArg = mockedCalculateMeasureReports.mock.calls[0][1];
      expect(patientBundlesArg).toHaveLength(2);
      const patientIds = patientBundlesArg.map(
        (bundle: any) =>
          bundle.entry?.find((e: any) => e.resource?.resourceType === "Patient")
            ?.resource?.id
      );
      expect(patientIds).toEqual([testCaseOfficeVisit.id, "second-tc-id"]);
    });

    it("logs the results when madieDebug is enabled in localStorage", async () => {
      const results = [{ id: "mr-1" }];
      mockedCalculateMeasureReports.mockResolvedValue({ results } as any);
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      // localStorageMock is seeded with madieDebug: "true"
      window.localStorage.setItem("madieDebug", "true");
      (window as any).madieDebug = undefined;

      await calculationService.calculateCompositeTestCases(
        officeVisitMeasure,
        [testCaseOfficeVisit],
        officeVisitMeasureBundle,
        [officeVisitValueSet]
      );

      expect(consoleSpy).toHaveBeenCalledWith(results);
      consoleSpy.mockRestore();
    });

    it("logs the results when window.madieDebug is set but localStorage is not", async () => {
      const results = [{ id: "mr-2" }];
      mockedCalculateMeasureReports.mockResolvedValue({ results } as any);
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      window.localStorage.removeItem("madieDebug");
      (window as any).madieDebug = true;

      await calculationService.calculateCompositeTestCases(
        officeVisitMeasure,
        [testCaseOfficeVisit],
        officeVisitMeasureBundle,
        [officeVisitValueSet]
      );

      expect(consoleSpy).toHaveBeenCalledWith(results);
      consoleSpy.mockRestore();
      window.localStorage.setItem("madieDebug", "true");
    });

    it("does not log when madieDebug is disabled", async () => {
      mockedCalculateMeasureReports.mockResolvedValue({
        results: [{ id: "mr-3" }],
      } as any);
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      window.localStorage.removeItem("madieDebug");
      (window as any).madieDebug = undefined;

      await calculationService.calculateCompositeTestCases(
        officeVisitMeasure,
        [testCaseOfficeVisit],
        officeVisitMeasureBundle,
        [officeVisitValueSet]
      );

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
      window.localStorage.setItem("madieDebug", "true");
    });
  });
});
