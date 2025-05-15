import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import GroupPopulations from "./GroupPopulations";
import {
  GroupPopulation,
  PopulationType,
  MeasureScoring,
  Group,
} from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

describe("Group Populations", () => {
  let testCaseGroups: GroupPopulation[];
  let groupStratificationsMap = {};
  let groups: Group[];
  beforeEach(() => {
    groupStratificationsMap = {
      "321": [PopulationType.INITIAL_POPULATION],
    };
    testCaseGroups = [
      {
        groupId: "Group1_ID",
        scoring: MeasureScoring.COHORT,
        populationBasis: "boolean",
        populationValues: [
          {
            id: "1",
            name: PopulationType.INITIAL_POPULATION,
            expected: true,
            actual: true,
          },
        ],
        stratificationValues: [
          {
            id: "321",
            name: "Strata 1",
            expected: true,
            actual: false,
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
      },
    ];
    groups = [
      {
        id: "Group1_ID",
        displayId: "Group_1",
        scoring: MeasureScoring.COHORT,
        populationBasis: "boolean",
        populations: [
          {
            id: "1",
            name: PopulationType.INITIAL_POPULATION,
            displayId: "InitialPopulation_1",
          },
          {
            id: "2",
            name: PopulationType.MEASURE_POPULATION,
            displayId: "MeasurePopulation_1",
          },
          {
            id: "3",
            name: PopulationType.MEASURE_POPULATION_EXCLUSION,
            displayId: "MeasurePopulationExclusion_1",
          },
        ],
        stratifications: [
          {
            id: "321",
            displayId: "Stratification_1",
            name: "Strata 1",
            associations: ["InitialPopulation_1"],
          },
        ],
      } as unknown as Group,
    ];
  });
  it("should render the populations", () => {
    const groupPopulations: GroupPopulation[] = [
      {
        groupId: "Group1_ID",
        scoring: MeasureScoring.CONTINUOUS_VARIABLE,
        populationBasis: "boolean",
        stratificationValues: [],
        populationValues: [
          {
            id: "1",
            name: PopulationType.INITIAL_POPULATION,
            expected: true,
            actual: false,
            criteriaReference: "",
          },
          {
            id: "2",
            name: PopulationType.MEASURE_POPULATION,
            expected: false,
            actual: false,
            criteriaReference: "",
          },
          {
            id: "3",
            name: PopulationType.MEASURE_POPULATION_EXCLUSION,
            expected: false,
            actual: false,
            criteriaReference: "",
          },
        ],
      },
    ];
    const handleChange = jest.fn();
    render(
      <GroupPopulations
        isTestCaseExecuted={true}
        groupPopulations={groupPopulations}
        onChange={handleChange}
        groups={groups}
      />
    );
    const g1MeasureName = screen.getByTestId("measure-group-1");
    expect(g1MeasureName).toBeInTheDocument();
    const g1ScoringName = screen.getByTestId("measure-group-1-scoring-unit-1");
    expect(g1ScoringName).toBeInTheDocument();

    const ippRow = screen.getByRole("row", { name: "Initial Population" });
    expect(ippRow).toBeInTheDocument();
    const ippCell = within(ippRow).getByRole("cell", {
      name: "Initial Population",
    });
    expect(ippCell).toBeInTheDocument();
    const ippCbs = within(ippRow).getAllByRole("checkbox");
    expect(ippCbs[0]).not.toBeDisabled();
    expect(ippCbs[0]).toBeChecked();
    expect(ippCbs[1]).toBeDisabled();
    expect(ippCbs[1]).not.toBeChecked();

    const msrpoplRow = screen.getByTestId(
      "test-row-population-id-measurePopulationExclusion"
    );

    // test-row-population-id-measurePopulationExclusion
    expect(msrpoplRow).toBeInTheDocument();
    const msrpoplCell = within(msrpoplRow).getByText(
      "Measure Population Exclusion"
    );
    expect(msrpoplCell).toBeInTheDocument();
    const msrpopl = within(msrpoplRow).getAllByRole("checkbox");
    expect(msrpopl[0]).not.toBeDisabled();
    expect(msrpopl[1]).toBeDisabled();
    expect(msrpopl[0]).not.toBeChecked();
    expect(msrpopl[1]).not.toBeChecked();

    const msrpoplexRow = screen.getByRole("row", {
      name: "Measure Population Exclusion",
    });
    expect(msrpoplexRow).toBeInTheDocument();
    const msrpoplexCell = within(msrpoplexRow).getByRole("cell", {
      name: "Measure Population Exclusion",
    });
    expect(msrpoplexCell).toBeInTheDocument();
    const msrpoplexCbs = within(msrpoplexRow).getAllByRole("checkbox");
    expect(msrpoplexCbs[0]).not.toBeDisabled();
    expect(msrpoplexCbs[1]).toBeDisabled();
    expect(msrpoplexCbs[0]).not.toBeChecked();
    expect(msrpoplexCbs[1]).not.toBeChecked();

    const allCheckboxes = screen.getAllByRole("checkbox");
    expect(allCheckboxes).toHaveLength(6);
  });

  it("should handle null groupPopulation input", () => {
    const mockExecute = jest.fn();
    render(
      <GroupPopulations
        groupPopulations={null}
        onChange={jest.fn()}
        isTestCaseExecuted
        setIsTestCaseExecuted={mockExecute}
        groups={groups}
      />
    );
    expect(
      screen.getByText(
        "No data for current scoring. Please make sure at least one measure group has been created."
      )
    ).toBeInTheDocument();
  });

  it("should handle undefined groupPopulation input", () => {
    render(
      <GroupPopulations
        groupPopulations={undefined}
        onChange={jest.fn()}
        executionRun
      />
    );
    expect(
      screen.getByText(
        "No data for current scoring. Please make sure at least one measure group has been created."
      )
    ).toBeInTheDocument();
  });

  it("should handle empty groupPopulation input", () => {
    render(
      <GroupPopulations
        groupPopulations={[]}
        onChange={jest.fn()}
        executionRun
        groups={groups}
      />
    );
    expect(
      screen.getByText(
        "No data for current scoring. Please make sure at least one measure group has been created."
      )
    ).toBeInTheDocument();
  });

  it("should render the populations with both checkboxes disabled", () => {
    const handleChange = jest.fn();
    render(
      <GroupPopulations
        disableExpected={true}
        isTestCaseExecuted={true}
        groupPopulations={testCaseGroups}
        onChange={handleChange}
        groupsStratificationAssociationMap={groupStratificationsMap}
        groups={groups}
      />
    );

    const ippRow = screen.getByRole("row", { name: "Initial Population" });
    const ippCbs = within(ippRow).getAllByRole("checkbox");
    expect(ippCbs[0]).toBeDisabled();
    expect(ippCbs[0]).toBeChecked();
    expect(ippCbs[1]).toBeDisabled();
    expect(ippCbs[1]).toBeChecked();
  });

  it("should handle checkbox changes", () => {
    testCaseGroups[0].scoring = MeasureScoring.CONTINUOUS_VARIABLE;
    const handleChange = jest.fn();
    const setIsTestCaseExecuted = jest.fn();
    const handleStratificationChange = jest.fn();
    render(
      <GroupPopulations
        isTestCaseExecuted={true}
        setIsTestCaseExecuted={setIsTestCaseExecuted}
        groupPopulations={testCaseGroups}
        onChange={handleChange}
        onStratificationChange={handleStratificationChange}
        groupsStratificationAssociationMap={groupStratificationsMap}
        groups={groups}
      />
    );

    const ippRow = screen.getByRole("row", { name: "Initial Population" });
    const ippCbs = within(ippRow).getAllByRole("checkbox");
    expect(ippCbs[0]).not.toBeDisabled();
    expect(ippCbs[0]).toBeChecked();
    expect(ippCbs[1]).toBeDisabled();
    expect(ippCbs[1]).toBeChecked();

    userEvent.click(ippCbs[0]);
    expect(handleChange).toHaveBeenNthCalledWith(
      1,
      testCaseGroups,
      "Group1_ID",
      { actual: true, expected: false, id: "1", name: "initialPopulation" }
    );

    userEvent.click(ippCbs[0]);
    expect(handleChange).toHaveBeenNthCalledWith(
      2,
      testCaseGroups,
      "Group1_ID",
      { actual: true, expected: false, id: "1", name: "initialPopulation" }
    );

    const stratRow = screen.getByRole("row", {
      name: "Strata 1 Initial Population",
    });
    const stratCbs = within(stratRow).getAllByRole("checkbox");
    expect(stratCbs[0]).not.toBeDisabled();
    expect(stratCbs[0]).toBeChecked();
    userEvent.click(stratCbs[0]);
    expect(handleStratificationChange).toHaveBeenCalledTimes(1);
  });

  it("should display empty on non run", () => {
    const handleChange = jest.fn();
    render(
      <GroupPopulations
        executionRun={false}
        groupPopulations={testCaseGroups}
        onChange={handleChange}
        groupsStratificationAssociationMap={groupStratificationsMap}
        groups={groups}
      />
    );
    const actualColumn = screen.getByTestId(
      "test-stratification-initialPopulation-actual"
    );
    expect(actualColumn).toBeInTheDocument();
  });
});
