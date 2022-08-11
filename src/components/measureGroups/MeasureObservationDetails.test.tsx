import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeasureObservation } from "@madie/madie-models";
import {
  AGGREGATE_FUNCTION_KEYS,
  AggregateFunctionType,
} from "../../../../madie-models/dist/AggregateFunctionType";
import MeasureObservationDetails from "./MeasureObservationDetails";

const AGGREGATE_FUNCTIONS = Array.from(AGGREGATE_FUNCTION_KEYS.keys()).sort();

describe("Measure Observation Details", () => {
  it("should render with no observation or elmJson input", () => {
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={null}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Observation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render with no elmJson library or elmJson input", () => {
    const elmJson = JSON.stringify({
      library: undefined,
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Observation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render with no elmJson library statements or elmJson input", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: undefined,
      },
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Observation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render with no elmJson library statements defined or elmJson input", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: undefined,
        },
      },
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Observation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render with empty elmJson library statements definitions or elmJson input", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [],
        },
      },
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Observation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render provided label", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [],
        },
      },
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        label="MyLabel"
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "MyLabel" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render with no function elmJson library statements definitions or elmJson input", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "Invalid1",
            },
            {
              type: "Invalid2",
            },
          ],
        },
      },
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    const observationComboBox = screen.getByRole("combobox", {
      name: "Observation",
    });
    expect(observationComboBox).toBeInTheDocument();
    const observationOptions =
      within(observationComboBox).getAllByRole("option");
    expect(observationOptions).toHaveLength(1);
    expect(observationOptions[0].textContent).toEqual("-");
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should render functions from elmJson", async () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "FunctionDef",
              name: "MyFunc1",
            },
            {
              type: "Invalid1",
            },
            {
              type: "FunctionDef",
              name: "My Func 2",
            },
          ],
        },
      },
    });
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    const observationComboBox = screen.getByRole("combobox", {
      name: "Observation",
    });
    expect(observationComboBox).toBeInTheDocument();
    const observationOptions =
      within(observationComboBox).getAllByRole("option");
    await waitFor(() => expect(observationOptions).toHaveLength(3));
    expect(observationOptions[0].textContent).toEqual("-");
    expect(observationOptions[1].textContent).toEqual("MyFunc1");
    expect(observationOptions[2].textContent).toEqual("My Func 2");
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should have aggregate function options", () => {
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={null}
        measureObservation={null}
      />
    );

    const aggregateFunctionComboBox = screen.getByRole("combobox", {
      name: "Aggregate Function *",
    });
    expect(aggregateFunctionComboBox).toBeInTheDocument();
    const aggregateFunctionOptions = within(
      aggregateFunctionComboBox
    ).getAllByRole("option");

    expect(aggregateFunctionOptions).toHaveLength(12);
    const optionContents = aggregateFunctionOptions.map((o) => o.textContent);
    for (const option of AGGREGATE_FUNCTIONS) {
      expect(optionContents.includes(option)).toBeTruthy();
    }
    expect(optionContents.includes("-")).toBeTruthy();
  });

  it("should render with no observation or elmJson input", () => {
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={null}
        measureObservation={null}
      />
    );

    expect(
      screen.getByRole("combobox", { name: "Observation" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Aggregate Function *" })
    ).toBeInTheDocument();
  });

  it("should fire change event for measure observation change", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "FunctionDef",
              name: "MyFunc1",
            },
            {
              type: "FunctionDef",
              name: "My Func 2",
            },
          ],
        },
      },
    });
    const measureObservation: MeasureObservation = {
      id: "1234",
      definition: null,
    };
    const handleChange = jest.fn();
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={measureObservation}
        onChange={handleChange}
      />
    );

    const observationComboBox = screen.getByRole("combobox", {
      name: "Observation",
    });
    expect(observationComboBox).toBeInTheDocument();
    const observationOptions =
      within(observationComboBox).getAllByRole("option");
    expect(observationOptions).toHaveLength(3);
    userEvent.click(observationComboBox);
    userEvent.selectOptions(observationComboBox, observationOptions[1]);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...measureObservation,
      definition: "MyFunc1",
    });
  });

  it("should handle no onChange for measure observation change", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "FunctionDef",
              name: "MyFunc1",
            },
            {
              type: "FunctionDef",
              name: "My Func 2",
            },
          ],
        },
      },
    });
    const measureObservation: MeasureObservation = {
      id: "1234",
      definition: null,
    };
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={measureObservation}
      />
    );

    const observationComboBox = screen.getByRole("combobox", {
      name: "Observation",
    });
    const observationOptions =
      within(observationComboBox).getAllByRole("option");
    expect(observationOptions).toHaveLength(3);
    userEvent.click(observationComboBox);
    userEvent.selectOptions(observationComboBox, observationOptions[1]);
    expect((observationOptions[0] as HTMLOptionElement).selected).toBeTruthy();
  });

  it("should fire change event for aggregate function change", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "FunctionDef",
              name: "MyFunc1",
            },
          ],
        },
      },
    });
    const measureObservation: MeasureObservation = {
      id: "1234",
      definition: "MyFunc1",
    };
    const handleChange = jest.fn();
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={measureObservation}
        onChange={handleChange}
      />
    );

    const aggregateComboBox = screen.getByRole("combobox", {
      name: "Aggregate Function *",
    });
    expect(aggregateComboBox).toBeInTheDocument();
    const aggregateOptions = within(aggregateComboBox).getAllByRole("option");
    expect(aggregateOptions).toHaveLength(12);
    userEvent.selectOptions(aggregateComboBox, aggregateOptions[2]);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...measureObservation,
      aggregateMethod: "Count",
    });
  });

  it("should handle no onChange for aggregate function change", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "FunctionDef",
              name: "MyFunc1",
            },
          ],
        },
      },
    });
    const measureObservation: MeasureObservation = {
      id: "1234",
      definition: null,
    };
    render(
      <MeasureObservationDetails
        name={"obs1"}
        required={false}
        elmJson={elmJson}
        measureObservation={measureObservation}
      />
    );

    const aggregateComboBox = screen.getByRole("combobox", {
      name: "Aggregate Function *",
    });
    const aggregateOptions = within(aggregateComboBox).getAllByRole("option");
    expect(aggregateComboBox).toHaveLength(12);
    expect((aggregateOptions[0] as HTMLOptionElement).selected).toBeTruthy();
    userEvent.selectOptions(aggregateComboBox, aggregateOptions[2]);
    const aggregateOptions2 = within(aggregateComboBox).getAllByRole("option");
    expect(aggregateOptions2).toHaveLength(12);
    expect((aggregateOptions[0] as HTMLOptionElement).selected).toBeTruthy();
  });

  it("should fire callback for clicking remove measure observation", () => {
    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [],
        },
      },
    });
    const measureObservation: MeasureObservation = {
      id: "1234",
      definition: "MyFunc1",
      aggregateMethod: AggregateFunctionType.SUM,
    };
    const handleRemove = jest.fn();
    render(
      <MeasureObservationDetails
        name={"obs1"}
        elmJson={elmJson}
        measureObservation={measureObservation}
        onChange={null}
        onRemove={handleRemove}
      />
    );

    const removeButton = screen.getByRole("link", { name: "Remove" });
    userEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleRemove).toHaveBeenCalledWith(measureObservation);
  });
});
