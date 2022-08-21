import * as React from "react";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen } from "@testing-library/react";
import * as uuid from "uuid";
import MeasureGroupObservation from "./MeasureGroupObservation";
import { MeasureScoring, PopulationType } from "@madie/madie-models";

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

const mockFormikObj = {
  touched: {},
  errors: {},
  values: {},
  isSubmitting: false,
  setFieldValue: undefined,
};

jest.mock("formik", () => ({
  useFormikContext: () => {
    return mockFormikObj;
  },
  getIn: (context: Record<string, unknown>, fieldName: string) => {
    return context[fieldName];
  },
}));

describe("Measure Group Observation", () => {
  beforeEach(() => {
    mockFormikObj.touched = {};
    mockFormikObj.errors = {};
    mockFormikObj.values = {};
    mockFormikObj.isSubmitting = false;
    mockFormikObj.setFieldValue = undefined;

    const mockUuid = require("uuid") as { v4: jest.Mock<string, []> };
    mockUuid.v4.mockImplementationOnce(() => "uuid-1");
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should not render for proportion scoring type", () => {
    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.PROPORTION}
        elmJson={null}
        population={null}
      />
    );

    expect(
      screen.queryByRole("link", { name: "Add Observation" })
    ).not.toBeInTheDocument();
  });

  it("should not render for CV scoring type with no observations", () => {
    mockFormikObj.values = {
      scoring: "Continuous Variable",
      measureObservations: [],
    };

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.CONTINUOUS_VARIABLE}
        elmJson={null}
        population={null}
      />
    );

    expect(
      screen.queryByRole("link", { name: "+ Add Observation" })
    ).not.toBeInTheDocument();
  });

  it("should render existing measure observation for CV scoring type", () => {
    mockFormikObj.values = {
      scoring: "Continuous Variable",
      measureObservations: [
        {
          id: "abcd-01",
          definition: "MyFunc1",
          aggregateMethod: "Count",
          criteriaReference: null,
        },
      ],
    };

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

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.CONTINUOUS_VARIABLE}
        elmJson={elmJson}
        population={null}
      />
    );

    expect(
      screen.queryByRole("link", { name: "Add Observation" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Remove" })
    ).not.toBeInTheDocument();

    const observationInput = screen.getByTestId(
      "measure-observation-cv-obs-input"
    ) as HTMLInputElement;
    expect(observationInput.value).toBe("MyFunc1");

    const aggregateInput = screen.getByTestId(
      "measure-observation-aggregate-cv-obs-input"
    ) as HTMLInputElement;
    expect(aggregateInput.value).toBe("Count");
  });

  it("should render existing measure observation for Ratio scoring type", () => {
    mockFormikObj.values = {
      scoring: "Ratio",
      measureObservations: [
        {
          id: "abcd-01",
          definition: "MyFunc1",
          aggregateMethod: "Count",
          criteriaReference: "pop3",
        },
      ],
    };

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
    const population = {
      id: "pop3",
      name: PopulationType.DENOMINATOR,
      definition: "denom",
    };

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.RATIO}
        elmJson={elmJson}
        population={population}
      />
    );

    expect(
      screen.queryByRole("link", { name: "Add Observation" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Remove" })).toBeInTheDocument();

    const denominatorObservationInput = screen.getByTestId(
      "measure-observation-denominator-input"
    ) as HTMLInputElement;
    expect(denominatorObservationInput.value).toBe("MyFunc1");

    const denominatorAggregateInput = screen.getByTestId(
      "measure-observation-aggregate-denominator-input"
    ) as HTMLInputElement;
    expect(denominatorAggregateInput.value).toBe("Count");
  });

  it("should not render existing measure observation for Ratio scoring type with invalid population", () => {
    mockFormikObj.values = {
      scoring: "Ratio",
      measureObservations: [
        {
          id: "abcd-01",
          definition: "MyFunc1",
          aggregateMethod: "Count",
          criteriaReference: "pop3",
        },
      ],
    };

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
    const population = {
      id: "pop3",
      name: PopulationType.DENOMINATOR_EXCLUSION,
      definition: "denom",
    };

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.RATIO}
        elmJson={elmJson}
        population={population}
      />
    );

    expect(
      screen.queryByRole("link", { name: "Add Observation" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Remove" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", {
        name: /denominator observation */i,
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", {
        name: "Aggregate Function *",
      })
    ).not.toBeInTheDocument();
  });

  it("should not display Remove link for CV scoring", () => {
    const mockSetFieldValue = jest.fn();
    mockFormikObj.values = {
      scoring: "Continuous Variable",
      measureObservations: [
        {
          id: "abcd-01",
          definition: "MyFunc1",
          aggregateMethod: "Count",
          criteriaReference: null,
        },
      ],
    };
    mockFormikObj.setFieldValue = mockSetFieldValue;

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

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.CONTINUOUS_VARIABLE}
        elmJson={elmJson}
        population={null}
      />
    );

    expect(
      screen.queryByRole("link", { name: "Add Observation" })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("link", { name: "Remove" })
    ).not.toBeInTheDocument();
  });

  it("should trigger onChange for observation", () => {
    const mockSetFieldValue = jest.fn();
    mockFormikObj.values = {
      scoring: "Continuous Variable",
      measureObservations: [
        {
          id: "abcd-01",
          definition: "MyFunc1",
          aggregateMethod: "Count",
          criteriaReference: null,
        },
      ],
    };
    mockFormikObj.setFieldValue = mockSetFieldValue;

    const elmJson = JSON.stringify({
      library: {
        statements: {
          def: [
            {
              type: "FunctionDef",
              name: "MyFunc1",
            },
            {
              type: "OtherDef",
              name: "NotFunc",
            },
            {
              type: "FunctionDef",
              name: "MyFuncAB",
            },
          ],
        },
      },
    });

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.CONTINUOUS_VARIABLE}
        elmJson={elmJson}
        population={null}
      />
    );

    const observationInput = screen.getByTestId(
      "measure-observation-cv-obs-input"
    ) as HTMLInputElement;
    // check if this value is already selected
    expect(observationInput.value).toBe("MyFunc1");

    fireEvent.change(observationInput, {
      target: { value: "MyFuncAB" },
    });

    expect(mockSetFieldValue).toHaveBeenCalledTimes(1);
    expect(mockSetFieldValue).toHaveBeenCalledWith("measureObservations", [
      {
        id: "abcd-01",
        definition: "MyFuncAB",
        aggregateMethod: "Count",
        criteriaReference: null,
      },
    ]);
  });

  it("should not display Add Observation for CV scoring type", () => {
    const mockSetFieldValue = jest.fn();
    mockFormikObj.values = {
      scoring: "Continuous Variable",
      measureObservations: [],
    };
    mockFormikObj.setFieldValue = mockSetFieldValue;

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.CONTINUOUS_VARIABLE}
        elmJson={null}
        population={null}
      />
    );

    expect(
      screen.queryByRole("link", {
        name: "+ Add Observation",
      })
    ).not.toBeInTheDocument();
    // userEvent.click(addObservation);
    // expect(mockSetFieldValue).toHaveBeenCalledTimes(1);
    // expect(mockSetFieldValue).toHaveBeenCalledWith("measureObservations", [
    //   {
    //     id: "uuid-1",
    //     criteriaReference: null,
    //   },
    // ]);
  });

  it("should handle Add Observation for Ratio scoring type", () => {
    const mockSetFieldValue = jest.fn();
    mockFormikObj.values = {
      scoring: "Ratio",
      measureObservations: [],
    };
    mockFormikObj.setFieldValue = mockSetFieldValue;
    const population = {
      id: "pop3",
      name: PopulationType.DENOMINATOR,
      definition: "denom",
    };

    render(
      <MeasureGroupObservation
        scoring={MeasureScoring.RATIO}
        elmJson={null}
        population={population}
      />
    );

    const addObservation = screen.getByRole("link", {
      name: "+ Add Observation",
    });
    expect(addObservation).toBeInTheDocument();
    userEvent.click(addObservation);
    expect(mockSetFieldValue).toHaveBeenCalledTimes(1);
    expect(mockSetFieldValue).toHaveBeenCalledWith("measureObservations", [
      {
        id: "uuid-1",
        criteriaReference: "pop3",
      },
    ]);
  });
});
