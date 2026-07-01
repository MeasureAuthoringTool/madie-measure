import * as React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TestCasePopulation from "./TestCasePopulation";
import userEvent from "@testing-library/user-event";
import { PopulationType } from "@madie/madie-models";

describe("TestCasePopulation component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render test case population", async () => {
    const testCasePopulation = {
      name: PopulationType.INITIAL_POPULATION,
      expected: true,
      actual: true,
    };
    const handleChange = jest.fn();
    const setChangedPopulation = jest.fn();
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TestCasePopulation
              isTestCaseExecuted={true}
              population={testCasePopulation}
              onChange={handleChange}
              setChangedPopulation={setChangedPopulation}
              populationBasis="boolean"
            />
          </tbody>
        </table>
      </MemoryRouter>
    );
    const row = screen.getByTestId(
      `test-row-population-id-${testCasePopulation.name}`
    );
    const columns = row.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("Initial Population");
    const buttons = await screen.findAllByRole("checkbox");
    expect(buttons).toHaveLength(2);
  });

  it("should handle changes to checkboxes", async () => {
    const testCasePopulation = {
      name: PopulationType.INITIAL_POPULATION,
      expected: false,
      actual: false,
    };
    const handleChange = jest.fn();
    const setChangedPopulation = jest.fn();
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TestCasePopulation
              executionRun
              population={testCasePopulation}
              onChange={handleChange}
              setChangedPopulation={setChangedPopulation}
              populationBasis="boolean"
            />
          </tbody>
        </table>
      </MemoryRouter>
    );
    const ippExpected = screen.getByTestId(
      "test-population-initialPopulation-expected"
    );
    const ippActual = screen.getByTestId(
      "test-population-initialPopulation-actual"
    );
    expect(ippExpected).toBeInTheDocument();
    expect(ippActual).toBeInTheDocument();
    expect(ippExpected).not.toBeChecked();
    expect(ippActual).not.toBeChecked();
    // actuall will always be disabled.
    // userEvent.click(ippActual);
    // expect(handleChange).toBeCalledWith({
    //   name: PopulationType.INITIAL_POPULATION,
    //   expected: false,
    //   actual: true,
    // });
  });

  it("Should display CV populationNameTemplate as Measure Observation 1 when measureObservationsCount is bigger than 0", async () => {
    const testCasePopulation = {
      id: "1",
      name: PopulationType.MEASURE_POPULATION_OBSERVATION,
      expected: true,
      actual: false,
    };
    const handleChange = jest.fn();
    const setChangedPopulation = jest.fn();
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TestCasePopulation
              executionRun
              population={testCasePopulation}
              onChange={handleChange}
              setChangedPopulation={setChangedPopulation}
              populationBasis="boolean"
              measureObservationsCount={1}
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    const row = screen.getByTestId(
      `test-row-population-id-${testCasePopulation.name}`
    );
    const columns = row.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("Measure Observation 1");
  });

  it("Should display CV populationNameTemplate as Measure Observation 1 when measureObservationsCount is not bigger than 0", async () => {
    const testCasePopulation = {
      id: "1",
      name: PopulationType.MEASURE_POPULATION_OBSERVATION,
      expected: true,
      actual: false,
    };
    const handleChange = jest.fn();
    const setChangedPopulation = jest.fn();
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TestCasePopulation
              executionRun
              population={testCasePopulation}
              onChange={handleChange}
              setChangedPopulation={setChangedPopulation}
              populationBasis="boolean"
              measureObservationsCount={0}
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    const row = screen.getByTestId(
      `test-row-population-id-${testCasePopulation.name}`
    );
    const columns = row.querySelectorAll("td");
    expect(columns[1]).toHaveTextContent("Measure Observation");
  });

  it("displays tooltip for observation population when calculation results contain observations", async () => {
    const testCasePopulation = {
      id: "obs-1",
      name: PopulationType.MEASURE_POPULATION_OBSERVATION,
      expected: 1,
      actual: 1,
    };
    const handleChange = jest.fn();
    const setChangedPopulation = jest.fn();

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TestCasePopulation
              isTestCaseExecuted={true}
              population={testCasePopulation}
              onChange={handleChange}
              setChangedPopulation={setChangedPopulation}
              populationBasis="number"
              tooltip={"observation1"}
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    const row = screen.getByTestId(
      `test-row-population-id-${testCasePopulation.name}`
    );
    const labelCell = row.querySelectorAll("td")[1];
    expect(labelCell).toHaveTextContent("Measure Observation");

    await userEvent.hover(labelCell as Element);
    const tooltip = screen.getByTestId(
      `population-tooltip-${testCasePopulation.name}`
    );
    expect(tooltip).toBeTruthy();
    expect(await screen.findByLabelText("observation1")).toBeInTheDocument();
  });

  it("does not display tooltip for non-observation population types even if calculation results exist", async () => {
    const testCasePopulation = {
      id: "pop-1",
      name: PopulationType.INITIAL_POPULATION,
      expected: true,
      actual: true,
    };
    const handleChange = jest.fn();
    const setChangedPopulation = jest.fn();

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <TestCasePopulation
              isTestCaseExecuted={true}
              population={testCasePopulation}
              onChange={handleChange}
              setChangedPopulation={setChangedPopulation}
              populationBasis="boolean"
            />
          </tbody>
        </table>
      </MemoryRouter>
    );

    const row = screen.getByTestId(
      `test-row-population-id-${testCasePopulation.name}`
    );
    const labelCell = row.querySelectorAll("td")[1];
    await userEvent.hover(labelCell as Element);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
