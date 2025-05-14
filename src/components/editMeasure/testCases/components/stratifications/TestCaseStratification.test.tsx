import * as React from "react";
import { render, screen } from "@testing-library/react";
import TestCaseStratification from "./TestCaseStratification";
import {
  PopulationType,
  MeasureScoring,
  Group,
  DisplayStratificationValue,
} from "@madie/madie-models";

describe("TestCaseStratification component", () => {
  let groupStratificationsMap = {};
  let group: Group;
  let stratification1: DisplayStratificationValue;
  let stratification2: DisplayStratificationValue;
  beforeEach(() => {
    groupStratificationsMap = {
      "1": [PopulationType.INITIAL_POPULATION],
    };

    group = {
      id: "Group1_ID",
      displayId: "Group_1",
      scoring: MeasureScoring.COHORT,
      populationBasis: "boolean",
      populations: [
        {
          id: "pop1",
          name: PopulationType.INITIAL_POPULATION,
          displayId: "InitialPopulation_1",
        },
      ],
      stratifications: [
        {
          id: "1",
          displayId: "Stratification_1",
          name: "Strata 1",
          associations: ["InitialPopulation_1"],
        },
      ],
    } as unknown as Group;

    stratification1 = {
      id: "1",
      name: "strata-1",
      expected: true,
      populationValues: [
        {
          id: "pop1",
          name: PopulationType.INITIAL_POPULATION,
          expected: true,
          actual: true,
        },
      ],
    };

    stratification2 = {
      id: "Stratification_1",
      name: "strata-1",
      expected: true,
      populationValues: [
        {
          id: "pop1",
          name: PopulationType.INITIAL_POPULATION,
          expected: true,
          actual: true,
        },
      ],
    };
  });

  it("should render the test case stratificaitons", () => {
    render(
      <TestCaseStratification
        strataCode="test"
        isTestCaseExecuted={true}
        setIsTestCaseExecuted={jest.fn()}
        stratification={stratification1}
        populationBasis={"boolean"}
        showExpected={true}
        disableExpected={true}
        onStratificationChange={jest.fn()}
        groupsStratificationAssociationMap={groupStratificationsMap}
        group={group}
      />
    );
    expect(
      screen.getByTestId("test-initialPopulation-expected")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("test-initialPopulation-actual")
    ).toBeInTheDocument();
  });

  it("should not render the test case stratificaitons with no groupStratificationsMap", () => {
    render(
      <TestCaseStratification
        strataCode="test"
        isTestCaseExecuted={true}
        setIsTestCaseExecuted={jest.fn()}
        stratification={stratification1}
        populationBasis={"boolean"}
        showExpected={true}
        disableExpected={true}
        onStratificationChange={jest.fn()}
        groupsStratificationAssociationMap={null}
        group={group}
      />
    );
    expect(
      screen.queryByTestId("test-initialPopulation-expected")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("test-initialPopulation-actual")
    ).not.toBeInTheDocument();
  });

  it("should render the test case stratificaitons with display id", () => {
    render(
      <TestCaseStratification
        strataCode="test"
        isTestCaseExecuted={true}
        setIsTestCaseExecuted={jest.fn()}
        stratification={stratification2}
        populationBasis={"boolean"}
        showExpected={true}
        disableExpected={false}
        onStratificationChange={jest.fn()}
        groupsStratificationAssociationMap={groupStratificationsMap}
        group={group}
      />
    );
    expect(
      screen.getByTestId("test-initialPopulation-expected")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("test-initialPopulation-actual")
    ).toBeInTheDocument();
  });

  it("should not render the test case stratificaitons with display id with no groupStratificationsMap", () => {
    render(
      <TestCaseStratification
        strataCode="test"
        isTestCaseExecuted={true}
        setIsTestCaseExecuted={jest.fn()}
        stratification={stratification2}
        populationBasis={"boolean"}
        showExpected={true}
        disableExpected={false}
        onStratificationChange={jest.fn()}
        groupsStratificationAssociationMap={null}
        group={group}
      />
    );
    expect(
      screen.queryByTestId("test-initialPopulation-expected")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("test-initialPopulation-actual")
    ).not.toBeInTheDocument();
  });
});
