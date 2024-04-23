import * as React from "react";
import { render, getByRole, screen } from "@testing-library/react";
import { Simulate } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import {
  MeasureObservation,
  AGGREGATE_FUNCTION_KEYS,
  AggregateFunctionType,
} from "@madie/madie-models";
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
        canEdit
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
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
        canEdit
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
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
        canEdit
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
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
        canEdit
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
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
        canEdit
        measureObservation={null}
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
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
        canEdit
        measureObservation={null}
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
    ).toBeInTheDocument();
  });

  it("should render with no function elmJson library statements definitions or elmJson input", async () => {
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
        canEdit
        elmJson={elmJson}
        measureObservation={null}
      />
    );

    const observationSelect = screen.getByTestId(
      "select-measure-observation-obs1"
    );
    userEvent.click(getByRole(observationSelect, "button"));
    const observationOptions = await screen.findAllByRole("option");
    expect(observationOptions).toHaveLength(1);
    expect(observationOptions[0].textContent).toEqual("-");

    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
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
        canEdit
      />
    );

    const observationSelect = screen.getByTestId(
      "select-measure-observation-obs1"
    );
    expect(observationSelect).toBeInTheDocument();
    userEvent.click(getByRole(observationSelect, "button"));
    const observationOptions = await screen.findAllByRole("option");
    expect(observationOptions).toHaveLength(3);
    expect(observationOptions[0].textContent).toEqual("-");
    expect(observationOptions[1].textContent).toEqual("MyFunc1");
    expect(observationOptions[2].textContent).toEqual("My Func 2");
  });

  it("should have aggregate function options", async () => {
    render(
      <MeasureObservationDetails
        name={"obs1"}
        elmJson={null}
        measureObservation={null}
        canEdit
        required={false}
      />
    );

    const aggregateFunctionSelect = screen.getByTestId(
      "select-measure-observation-aggregate-obs1"
    );

    expect(aggregateFunctionSelect).toBeInTheDocument();
    userEvent.click(getByRole(aggregateFunctionSelect, "button"));
    const aggregateFunctionOptions = await screen.findAllByRole("option");
    expect(aggregateFunctionOptions).toHaveLength(7);

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
        canEdit
      />
    );

    expect(
      screen.getByTestId("select-measure-observation-obs1")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-measure-observation-aggregate-obs1")
    ).toBeInTheDocument();
  });

  it("should fire change event for measure observation change", async () => {
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
        canEdit
      />
    );

    const observationSelect = screen.getByTestId(
      "select-measure-observation-obs1"
    );
    expect(observationSelect).toBeInTheDocument();
    userEvent.click(getByRole(observationSelect, "button"));
    const observationOptions = await screen.findAllByRole("option");
    expect(observationOptions).toHaveLength(3);
    expect(observationOptions[0].textContent).toEqual("-");
    expect(observationOptions[1].textContent).toEqual("MyFunc1");
    expect(observationOptions[2].textContent).toEqual("My Func 2");

    userEvent.click(screen.getByText("MyFunc1"));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...measureObservation,
      definition: "MyFunc1",
    });
  });

  it("should fire change event for measure observation description change", async () => {
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
        canEdit
      />
    );

    const observationDescription = screen.getByTestId("obs1-description");
    expect(observationDescription).toBeInTheDocument();

    userEvent.paste(observationDescription, "newVal");
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...measureObservation,
      description: "newVal",
    });
  });

  it("should handle no onChange for measure observation change", async () => {
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
        canEdit
      />
    );

    const observationSelect = screen.getByTestId(
      "select-measure-observation-obs1"
    );
    expect(observationSelect).toBeInTheDocument();
    userEvent.click(getByRole(observationSelect, "button"));
    const observationOptions = await screen.findAllByRole("option");
    expect(observationOptions).toHaveLength(3);
    expect(observationOptions[0].textContent).toEqual("-");
    expect(observationOptions[1].textContent).toEqual("MyFunc1");
    expect(observationOptions[2].textContent).toEqual("My Func 2");
    expect((observationOptions[0] as HTMLOptionElement).selected).toBeTruthy();
  });

  it("should fire change event for aggregate function change", async () => {
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
        canEdit
      />
    );

    const aggregateSelect = screen.getByTestId(
      "select-measure-observation-aggregate-obs1"
    );
    userEvent.click(getByRole(aggregateSelect, "button"));
    const aggregateOptions = await screen.findAllByRole("option");
    expect(aggregateOptions).toHaveLength(7);
    userEvent.click(screen.getByText("Count"));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith({
      ...measureObservation,
      aggregateMethod: "Count",
    });
  });

  // Since onChange is not provided, the aggregate value is not updated.
  it("should handle no onChange for aggregate function change", async () => {
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
        canEdit
      />
    );
    const aggregateInput = screen.getByTestId(
      "measure-observation-aggregate-obs1-input"
    ) as HTMLInputElement;
    expect(aggregateInput.value).toBe("");

    const aggregateSelect = screen.getByTestId(
      "select-measure-observation-aggregate-obs1"
    );
    userEvent.click(getByRole(aggregateSelect, "button"));
    userEvent.click(screen.getByText("Count"));
    expect(aggregateInput.value).toBe("");
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
        required={false}
        ratio={true}
        name={"obs1"}
        elmJson={elmJson}
        measureObservation={measureObservation}
        onChange={null}
        onRemove={handleRemove}
        canEdit
      />
    );

    const removeButton = screen.getByRole("link", { name: "Remove" });
    userEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleRemove).toHaveBeenCalledWith(measureObservation);
  });
});
