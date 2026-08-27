import {
  Calculator,
  StratifierResult,
  CalculationOutput,
  DetailedPopulationGroupResult,
  EpisodeResults,
  ExecutionResult,
  MRCalculationOutput,
  PopulationResult,
} from "fqm-execution";
import { prettyFHIRObject } from "fqm-execution/build/calculation/ClauseResultsBuilder";
import { FHIRWrapper } from "cql-exec-fhir";
import {
  Group,
  Measure,
  Population,
  PopulationExpectedValue,
  TestCase,
  StratificationExpectedValue,
} from "@madie/madie-models";
import { Bundle, ValueSet } from "fhir/r4";
import * as _ from "lodash";

import { PopulationType as FqmPopulationType } from "fqm-execution/build/types/Enums";
import { getPopulationTypesForScoring } from "../util/PopulationsMap";
import { isTestCasePopulationObservation } from "../util/Utils";
import { GroupPopulation } from "@madie/madie-models/dist/TestCase";
import { calculateMeasureReports } from "fqm-execution/build/calculation/Calculator";

export enum ExecutionStatusType {
  NA = "NA",
  INVALID = "Invalid",
  PASS = "pass",
  FAIL = "fail",
}

export interface StatementResultMap {
  [statementName: string]: number;
}

export interface GroupStatementResultMap {
  [groupId: string]: StatementResultMap;
}

export interface TestCaseGroupStatementResult {
  [testCaseId: string]: GroupStatementResultMap;
}

export interface PopulationEpisodeResult {
  id?: string;
  populationType: FqmPopulationType;
  define: string;
  value: number;
}

export interface ProcessedResultType {
  populations: any;
  observations: any;
}

export interface ObservationResources {
  groupId: any;
  relations: ObservationRelation[];
}

export interface ObservationRelation {
  index: number;
  resources: any[];
}

export const findMeasureGroupPopulationDisplayId = (
  measureGroup: Group,
  id: string
): string => {
  const population = measureGroup?.populations?.find(
    (population) => population.id === id
  );
  if (population) {
    return population.displayId;
  } else {
    const observations = measureGroup?.measureObservations?.find(
      (observation) => observation.id === id
    );
    if (observations) {
      return observations.displayId;
    } else {
      const stratifications = measureGroup?.stratifications?.find(
        (stratification) => stratification.id === id
      );
      if (stratifications) {
        return stratifications.displayId;
      }
    }
  }
  return id;
};

export const findMeasureObservationDisplayIdByReferenceId = (
  measureGroup: Group,
  id: string
): string => {
  const observations = measureGroup?.measureObservations?.find(
    (observation) => observation.criteriaReference === id
  );
  return observations?.displayId;
};

/**
 * Pretty prints a FHIR resource from a test case bundle using fqm-execution's prettyResult.
 * This formats the resource with type annotations and structured indentation.
 * For simple JSON formatting, use JSON.stringify(resource, null, 2) instead.
 */
export function prettyPrintFhirResource(resource: any): string {
  const fhirWrapper = FHIRWrapper.FHIRv401();
  const fhirObject = fhirWrapper.wrap(resource, resource?.resourceType);
  return prettyFHIRObject(fhirObject, true, 1, 1);
}

// TODO consider converting into a context.
// OR a re-usable hook.
export class CalculationService {
  async calculateTestCases(
    measure: Measure,
    testCases: TestCase[],
    measureBundle: Bundle,
    valueSets: ValueSet[]
  ): Promise<CalculationOutput<any>> {
    const TestCaseBundles = testCases.map((testCase) => {
      return this.buildPatientBundle(testCase);
    });

    const calculationOutput: CalculationOutput<any> = await this.calculate(
      measureBundle,
      TestCaseBundles,
      valueSets,
      measure.measurementPeriodStart,
      measure.measurementPeriodEnd,
      measure?.testCaseConfiguration?.sdeIncluded,
      measure?.testCaseConfiguration?.ravIncluded
    );

    // set onto window for any environment debug purposes
    if (localStorage.getItem("madieDebug") || (window as any).madieDebug) {
      // eslint-disable-next-line no-console
      console.log(_.cloneDeep(calculationOutput?.results));
    }
    return calculationOutput;
  }

  // fqm Execution requires each patient to be with unique ID.
  // So assigning the testCase ID as patient ID to retrieve calculate multiple testcases
  buildPatientBundle(testCase: TestCase): Bundle {
    const testCaseBundle: Bundle = JSON.parse(testCase.json);
    testCaseBundle.entry
      ?.filter((entry) => {
        return entry.resource?.resourceType === "Patient";
      })
      .forEach((entry) => {
        entry.resource.id = testCase.id;
      });
    return testCaseBundle;
  }

  async calculateCompositeTestCases(
    measure: Measure,
    testCases: TestCase[],
    measureBundle: Bundle,
    valueSets: ValueSet[]
  ): Promise<MRCalculationOutput> {
    const testCaseBundles = testCases.map((testCase) => {
      return this.buildPatientBundle(testCase);
    });
    const calculationOutput: MRCalculationOutput =
      await Calculator.calculateMeasureReports(
        measureBundle,
        testCaseBundles,
        {
          trustMetaProfile: true,
          measurementPeriodStart: measure?.measurementPeriodStart
            ? new Date(measure.measurementPeriodStart)
                .toISOString()
                .substring(0, 10)
            : undefined,
          measurementPeriodEnd: measure?.measurementPeriodEnd
            ? new Date(measure.measurementPeriodEnd)
                .toISOString()
                .substring(0, 10)
            : undefined,
          reportType: "summary",
        },
        valueSets
      );

    // set onto window for any environment debug purposes
    if (localStorage.getItem("madieDebug") || (window as any).madieDebug) {
      // eslint-disable-next-line no-console
      console.log(_.cloneDeep(calculationOutput?.results));
    }
    return calculationOutput;
  }

  async calculate(
    measureBundle: Bundle,
    patientBundles: Bundle[],
    valueSets: ValueSet[],
    measurementPeriodStart,
    measurementPeriodEnd,
    sdeIncluded: boolean,
    ravIncluded: boolean
  ): Promise<CalculationOutput<any>> {
    try {
      return await Calculator.calculate(
        measureBundle,
        patientBundles,
        {
          includeClauseResults: false,
          trustMetaProfile: false,
          buildStatementLevelHTML: true,
          measurementPeriodStart: measurementPeriodStart,
          measurementPeriodEnd: measurementPeriodEnd,
          calculateSDEs: sdeIncluded === true,
          calculateRAVs: ravIncluded === true,
        },
        valueSets
      );
    } catch (err) {
      console.error("An error occurred in FQM-Execution", err);
      throw err;
    }
  }

  processRawResults(
    executionResults: ExecutionResult<DetailedPopulationGroupResult>[]
  ): TestCaseGroupStatementResult {
    const testCaseResultMap: TestCaseGroupStatementResult = {};
    if (executionResults) {
      for (const tc of executionResults) {
        const testCaseId: string = tc?.patientId;
        const groupResults: DetailedPopulationGroupResult[] =
          tc?.detailedResults || [];
        testCaseResultMap[testCaseId] = this.buildGroupResultsMap(groupResults);
      }
    }

    return testCaseResultMap;
  }

  buildGroupResultsMap(groupResults: DetailedPopulationGroupResult[]) {
    const outputGroupResultsMap: GroupStatementResultMap = {};
    groupResults?.forEach((groupResult) => {
      const groupId = groupResult?.groupId;
      const statementResults = groupResult?.statementResults || [];
      const defineResultMap: StatementResultMap = {};
      for (const statementResult of statementResults) {
        if (statementResult && statementResult.statementName) {
          if (typeof statementResult.raw === "boolean") {
            defineResultMap[statementResult.statementName] =
              statementResult?.raw ? 1 : 0;
          } else if (Array.isArray(statementResult?.raw)) {
            defineResultMap[statementResult.statementName] =
              statementResult?.raw?.length || 0;
          } else {
            defineResultMap[statementResult.statementName] = 0;
          }
        }
      }
      outputGroupResultsMap[groupId] = defineResultMap;
    });
    return outputGroupResultsMap;
  }

  getPassingPercentageForTestCases(testCases: TestCase[]) {
    const totalTestCases = testCases?.length;
    const passedTests = testCases?.filter(
      (testCase) => testCase.executionStatus === "pass"
    ).length;

    return {
      passPercentage: Math.floor((passedTests / totalTestCases) * 100),
      passFailRatio: passedTests + "/" + totalTestCases,
    };
  }

  mapMeasureGroup(group: Group): GroupPopulation {
    const calculateEpisodes = "boolean" === _.lowerCase(group.populationBasis);
    return {
      groupId: group.displayId ? group.displayId : group.id,
      scoring: group.scoring,
      populationBasis: group.populationBasis,
      stratificationValues: group?.stratifications?.map(
        (stratification, index) => ({
          name: `Strata ${index + 1} ${_.startCase(
            stratification.association
          )}`,
          expected: calculateEpisodes ? false : null,
          actual: calculateEpisodes ? false : null,
          id: stratification.displayId
            ? stratification.displayId
            : stratification.id,
          criteriaReference: "",
        })
      ),
      populationValues: getPopulationTypesForScoring(group)?.map(
        (population: PopulationExpectedValue) => ({
          name: population.name,
          expected: calculateEpisodes ? false : null,
          actual: calculateEpisodes ? false : null,
          id: population.id,
          criteriaReference: population.criteriaReference,
        })
      ),
    };
  }

  isValuePass(actual: any, expected: any, patientBased: boolean) {
    if (patientBased) {
      return !!actual == !!expected;
    } else {
      const actualVal = _.isNil(actual) ? 0 : _.toNumber(actual);
      const expectedVal = _.isNil(expected) ? 0 : _.toNumber(expected);
      return actualVal == expectedVal;
    }
  }

  buildPatientResults(populationResults: PopulationResult[]) {
    const results: ProcessedResultType = {
      populations: {},
      observations: {},
    };
    if (!_.isNil(populationResults) && populationResults.length > 0) {
      for (const populationResult of populationResults) {
        if (
          populationResult.populationType === FqmPopulationType.OBSERV &&
          populationResult.observations
        ) {
          const id = populationResult.populationId;
          results.observations[id] = {
            ...populationResult,
            result: true,
            observations: [...populationResult.observations],
          };
        } else if (
          populationResult.populationType !== FqmPopulationType.OBSERV
        ) {
          results.populations[populationResult.populationId] = {
            ...populationResult,
          };
        }
      }
    }
    return results;
  }

  buildEpisodeResults(episodeResults: EpisodeResults[]): ProcessedResultType {
    const results: ProcessedResultType = {
      populations: {},
      observations: {},
    };
    if (!_.isNil(episodeResults)) {
      for (const episodeResult of episodeResults) {
        if (
          episodeResult.populationResults &&
          episodeResult.populationResults.length > 0
        ) {
          for (const populationResult of episodeResult.populationResults) {
            if (
              populationResult.populationType === FqmPopulationType.OBSERV &&
              populationResult.observations
            ) {
              const id = populationResult.populationId;
              if (results.observations[id]) {
                results.observations[id].observations = _.concat(
                  results.observations[id].observations,
                  populationResult.observations
                );
              } else {
                results.observations[id] = {
                  ...populationResult,
                  result: true,
                  observations: _.cloneDeep(populationResult.observations),
                };
              }
            } else if (
              populationResult.populationType !== FqmPopulationType.OBSERV
            ) {
              const id = populationResult.populationId;
              if (results.populations[id] && populationResult.result) {
                results.populations[id].result += 1;
              } else if (_.isNil(results.populations[id])) {
                results.populations[id] = {
                  ...populationResult,
                  result: populationResult.result ? 1 : 0,
                };
              }
            }
          }
        }
      }
    }
    return results;
  }

  isGroupPass(groupPopulation: GroupPopulation, measureGroup: Group) {
    let groupPass = true;
    if (groupPopulation) {
      const patientBased =
        "boolean" === _.lowerCase(groupPopulation.populationBasis);
      groupPopulation.populationValues?.every((popVal) => {
        const isObs = isTestCasePopulationObservation(popVal);
        groupPass =
          groupPass &&
          this.isValuePass(
            popVal.actual,
            popVal.expected,
            isObs ? false : patientBased
          );
        return groupPass;
      });
      // if group populations failing return it. no need to verify stratification
      if (!groupPass) {
        return groupPass;
      }
      // verify stratification & stratified populations passing if they exist
      if (groupPopulation.stratificationValues) {
        let validStratPopValues = [];
        groupPopulation.stratificationValues.forEach(
          (stratValues: StratificationExpectedValue) => {
            stratValues.id = findMeasureGroupPopulationDisplayId(
              measureGroup,
              stratValues.id
            );
            stratValues.populationValues?.forEach((popValue) => {
              const validPopValues = this.getValidStratPopulationValues(
                measureGroup,
                stratValues.id,
                popValue
              );
              if (validPopValues && validPopValues.length > 0) {
                validStratPopValues.push(validPopValues);
              }
            });
          }
        );
        return validStratPopValues.every((strata) => {
          // verify stratified populations passing
          return strata.every((population) =>
            this.isValuePass(
              population.actual,
              population.expected,
              patientBased
            )
          );
        });
      }
    }
    return groupPass;
  }

  getValidStratPopulationValues(
    measureGroup: Group,
    stratId: string,
    popValue: PopulationExpectedValue
  ): PopulationExpectedValue[] {
    let valiePopValue = [];
    measureGroup?.stratifications?.forEach((strat) => {
      if (strat.id === stratId) {
        strat.associations?.forEach((association) => {
          if (association === popValue.name) {
            valiePopValue.push(popValue);
          }
        });
      }
    });
    return valiePopValue;
  }

  processTestCaseResults(
    testCase: TestCase,
    measureGroups: Group[],
    populationGroupResults: DetailedPopulationGroupResult[]
  ): TestCase {
    if (_.isNil(testCase)) {
      return testCase;
    }

    let updatedpopulationGroupResults = populationGroupResults;
    if (!populationGroupResults[0].groupId?.includes("Group_")) {
      this.replaceWithDisplayId(updatedpopulationGroupResults, measureGroups);
    }

    const updatedTestCase = _.cloneDeep(testCase);
    let allGroupsPass = true;
    if (_.isNil(testCase?.groupPopulations)) {
      updatedTestCase.groupPopulations = [];
    }

    // Only perform calculations for provided groups (Can be used to limit results)
    for (const measureGroup of measureGroups) {
      const groupId = measureGroup.id;
      let tcGroupPopulation = updatedTestCase.groupPopulations.find(
        (gp) => gp?.groupId === groupId
      );
      if (_.isNil(tcGroupPopulation)) {
        tcGroupPopulation = this.mapMeasureGroup(measureGroup);
        updatedTestCase.groupPopulations.push(tcGroupPopulation);
      }

      const populationGroupResult: DetailedPopulationGroupResult =
        updatedpopulationGroupResults?.find(
          (popGroupResult) => popGroupResult.groupId === measureGroup.displayId
        );

      const tcPopTypeCount = {};
      const patientBased =
        "boolean" === _.lowerCase(measureGroup.populationBasis);
      const processedResults = patientBased
        ? this.buildPatientResults(populationGroupResult?.populationResults)
        : this.buildEpisodeResults(populationGroupResult?.episodeResults);

      tcGroupPopulation?.populationValues?.forEach((tcPopVal) => {
        // Set the actual population value for measure observations
        if (isTestCasePopulationObservation(tcPopVal)) {
          if (patientBased) {
            tcPopVal.actual =
              processedResults.observations[
                findMeasureObservationDisplayIdByReferenceId(
                  measureGroup,
                  tcPopVal.criteriaReference
                )
              ]?.observations?.[0];
          } else {
            let currentTCObserv = tcPopTypeCount[tcPopVal.name] ?? 0;
            const allObsResults =
              processedResults?.observations[
                findMeasureObservationDisplayIdByReferenceId(
                  measureGroup,
                  tcPopVal.criteriaReference
                )
              ];
            if (
              allObsResults &&
              currentTCObserv < allObsResults.observations?.length
            ) {
              tcPopVal.actual = allObsResults.observations?.[currentTCObserv];
            } else {
              tcPopVal.actual = null;
            }

            if (tcPopTypeCount[tcPopVal.name]) {
              tcPopTypeCount[tcPopVal.name] = tcPopTypeCount[tcPopVal.name] + 1;
            } else {
              tcPopTypeCount[tcPopVal.name] = 1;
            }
          }
        } else {
          // find result
          const measureGroupPopulation: Population =
            this.findMeasureGroupPopulation(measureGroup, tcPopVal);
          if (!measureGroupPopulation) {
            tcPopVal.actual = patientBased ? null : 0;
            return;
          }
          const result =
            processedResults?.populations[measureGroupPopulation.displayId]
              ?.result;
          tcPopVal.actual = _.isNil(result) && !patientBased ? 0 : result;
        }
      });

      const getPatientBasedActualResultForAssociatedPopulation = (
        stratifiedPopulation: PopulationExpectedValue,
        strataResult: boolean
      ) => {
        stratifiedPopulation.id = findMeasureGroupPopulationDisplayId(
          measureGroup,
          stratifiedPopulation.id
        );

        // get the actual result for population
        const associatedPopulation = tcGroupPopulation.populationValues.find(
          (p) => p.id === stratifiedPopulation.id
        );
        // adjust the stratified results for strata & associated population
        return associatedPopulation?.actual && strataResult;
      };

      const getEpisodeBasedActualResultForAssociatedPopulation = (
        stratifiedPopulation: PopulationExpectedValue,
        strataResult: StratifierResult
      ) => {
        stratifiedPopulation.id = findMeasureGroupPopulationDisplayId(
          measureGroup,
          stratifiedPopulation.id
        );

        if (!populationGroupResult?.episodeResults) {
          return 0;
        }
        // filter out the episodes that have passing stratified population & passing strata
        const episodes = populationGroupResult.episodeResults?.filter(
          (episode) => {
            const population = episode.populationResults.find(
              (p) => p.populationId === stratifiedPopulation.id
            );
            let stratification = episode.stratifierResults.find(
              (strata) =>
                // TODO: workaround because fqm execution doesn't provide IDs for all cases
                strata.strataCode &&
                strata.strataCode === strataResult?.strataId
            );
            return population?.result && stratification?.result;
          }
        );
        // adjust the episode count for strata & associated population
        return episodes?.length || 0;
      };

      const stratifierResults = populationGroupResult?.stratifierResults;
      tcGroupPopulation?.stratificationValues?.forEach((stratification) => {
        const displayId = findMeasureGroupPopulationDisplayId(
          measureGroup,
          stratification.id
        );
        const appliedStrataResult = stratifierResults?.find(
          (stratifierResult) =>
            // TODO: workaround because fqm execution doesn't provide IDs for all cases. so if present compare with id or compare with code
            stratifierResult.strataId === displayId
        );
        stratification.populationValues?.forEach((population) => {
          population.actual = patientBased
            ? getPatientBasedActualResultForAssociatedPopulation(
                population,
                appliedStrataResult?.result
              )
            : getEpisodeBasedActualResultForAssociatedPopulation(
                population,
                appliedStrataResult
              );
        });
      });
      // need to do work here.
      allGroupsPass =
        allGroupsPass && this.isGroupPass(tcGroupPopulation, measureGroup);
    }
    updatedTestCase.executionStatus = allGroupsPass
      ? ExecutionStatusType.PASS
      : ExecutionStatusType.FAIL;

    return updatedTestCase;
  }

  getObservationResources = (
    testCase: TestCase,
    populationGroupResults: DetailedPopulationGroupResult
  ) => {
    const testCaseBundle = JSON.parse(testCase.json);
    let observationRelations: ObservationRelation[] = [];

    populationGroupResults.episodeResults?.forEach((episodeResult) => {
      let resources: any[] = [];
      episodeResult.populationResults?.find((populationResult) => {
        if (populationResult.populationType === FqmPopulationType.OBSERV) {
          testCaseBundle.entry?.find((entry) => {
            if (entry.resource.id === episodeResult.episodeId) {
              resources.push(prettyPrintFhirResource(entry.resource));
            }
          });
        }
      });
      observationRelations.push({
        index: populationGroupResults.episodeResults.indexOf(episodeResult),
        resources: resources,
      });
    });

    const result: ObservationResources = {
      groupId: populationGroupResults.groupId,
      relations: observationRelations,
    };

    if (result.relations && result.relations.length > 0) {
      return result;
    }
    return null;
  };

  findMeasureGroupPopulation(
    measureGroup: Group,
    populationValue: PopulationExpectedValue
  ): Population {
    return measureGroup?.populations?.find(
      (population) =>
        (!_.isNil(populationValue.id) &&
          population.id === populationValue.id) ||
        (_.isNil(populationValue.id) &&
          populationValue.name === population.name)
    );
  }

  replaceWithDisplayId(
    populationGroupResults: DetailedPopulationGroupResult[],
    measureGroups: Group[]
  ) {
    populationGroupResults.forEach((populationGroupResult) => {
      const measureGroup: Group = measureGroups.find(
        (group) => group.id === populationGroupResult.groupId
      );
      if (measureGroup) {
        populationGroupResult.groupId = measureGroup.displayId;
        populationGroupResult.populationResults?.forEach((populationResult) => {
          populationResult.populationId = findMeasureGroupPopulationDisplayId(
            measureGroup,
            populationResult.populationId
          );
        });
        populationGroupResult.episodeResults?.forEach((episodeResult) => {
          episodeResult.populationResults?.forEach((populationResult) => {
            populationResult.populationId = findMeasureGroupPopulationDisplayId(
              measureGroup,
              populationResult.populationId
            );
          });
          episodeResult.stratifierResults?.forEach((stratifierResult) => {
            stratifierResult.strataCode = findMeasureGroupPopulationDisplayId(
              measureGroup,
              stratifierResult.strataCode
            );
          });
        });
        populationGroupResult.stratifierResults?.forEach((stratifierResult) => {
          stratifierResult.strataId = findMeasureGroupPopulationDisplayId(
            measureGroup,
            stratifierResult.strataCode
          );
        });
        populationGroupResult.populationRelevance?.forEach((popRelevance) => {
          popRelevance.populationId = findMeasureGroupPopulationDisplayId(
            measureGroup,
            popRelevance.populationId
          );
        });
      }
    });
  }
}

export default function calculationService(): CalculationService {
  return new CalculationService();
}
