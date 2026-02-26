import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CompositeScoring from "./CompositeScoring";
import userEvent from "@testing-library/user-event";
import { oneItemResponse } from "../../../../../__mocks__/mockMeasureResponses";

const mockFormik = {
  values: {
    compositeScoring: "",
  },
  setFieldValue: jest.fn(),
  touched: {},
  errors: {},
};

const mockMeasureServiceApi = {
  searchMeasuresByCriteria: jest.fn().mockResolvedValue(oneItemResponse),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

describe("CompositeScoring Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the composite scoring dropdown", () => {
    render(<CompositeScoring canEdit={true} formik={mockFormik} />);

    expect(screen.getByTestId("composite-scoring")).toBeInTheDocument();
    expect(screen.getByText("Composite Scoring")).toBeInTheDocument();
  });

  it("displays empty value when no value is selected", () => {
    render(<CompositeScoring canEdit={true} formik={mockFormik} />);

    const select = screen.getByTestId("composite-scoring");
    expect(select.querySelector("input")).toHaveValue("");
  });

  it("displays the selected value", () => {
    const formikWithValue = {
      ...mockFormik,
      values: {
        compositeScoring: "Opportunity",
      },
    };

    render(<CompositeScoring canEdit={true} formik={formikWithValue} />);

    const select = screen.getByTestId("composite-scoring");
    expect(select.querySelector("input")).toHaveValue("Opportunity");
  });

  it("is not read-only when canEdit is true", () => {
    render(<CompositeScoring canEdit={true} formik={mockFormik} />);

    const select = screen.getByTestId("composite-scoring");
    const input = select.querySelector("input");
    expect(input).not.toHaveAttribute("readonly");
  });

  it("handles null value correctly", () => {
    const formikWithNull = {
      ...mockFormik,
      values: {
        compositeScoring: null,
      },
    };

    render(<CompositeScoring canEdit={true} formik={formikWithNull} />);

    const select = screen.getByTestId("composite-scoring");
    expect(select.querySelector("input")).toHaveValue("");
  });

  it("maintains the selected value after re-render", () => {
    const { rerender } = render(
      <CompositeScoring
        canEdit={true}
        formik={{
          ...mockFormik,
          values: { compositeScoring: "Linear" },
        }}
      />
    );

    let select = screen.getByTestId("composite-scoring");
    expect(select.querySelector("input")).toHaveValue("Linear");

    rerender(
      <CompositeScoring
        canEdit={true}
        formik={{
          ...mockFormik,
          values: { compositeScoring: "Linear" },
        }}
      />
    );

    select = screen.getByTestId("composite-scoring");
    expect(select.querySelector("input")).toHaveValue("Linear");
  });

  it("has required label", () => {
    render(<CompositeScoring canEdit={true} formik={mockFormik} />);

    const label = screen.getByText("Composite Scoring");
    expect(label).toBeInTheDocument();
  });

  it("calls setFieldValue when an option is selected", async () => {
    render(<CompositeScoring canEdit={true} formik={mockFormik} />);

    const selectTrigger = screen.getByRole("combobox");
    await userEvent.click(selectTrigger);

    await waitFor(() => {
      expect(screen.getByTestId("opportunity-option")).toBeInTheDocument();
    });

    const opportunityOption = screen.getByTestId("opportunity-option");
    await userEvent.click(opportunityOption);

    await waitFor(() => {
      expect(mockFormik.setFieldValue).toHaveBeenCalledWith(
        "compositeScoring",
        "Opportunity"
      );
    });
  });

  it("disables Add Components button when composite scoring is not selected", () => {
    render(<CompositeScoring canEdit={true} formik={mockFormik} />);
    const addButton = screen.getByTestId("add-components-btn");
    expect(addButton).toBeDisabled();
  });

  it("enables Add Components button when composite scoring is selected", () => {
    const formikWithValue = {
      ...mockFormik,
      values: {
        compositeScoring: "Opportunity",
      },
    };
    render(<CompositeScoring canEdit={true} formik={formikWithValue} />);
    const addButton = screen.getByTestId("add-components-btn");
    expect(addButton).toBeEnabled();
  });

  it("disables Add Components button when canEdit is false", () => {
    const formikWithValue = {
      ...mockFormik,
      values: {
        compositeScoring: "Opportunity",
      },
    };
    render(<CompositeScoring canEdit={false} formik={formikWithValue} />);
    const addButton = screen.getByTestId("add-components-btn");
    expect(addButton).toBeDisabled();
  });

  it("opens AddComponentsDialog when Add Components button is clicked", async () => {
    const formikWithValue = {
      ...mockFormik,
      values: {
        compositeScoring: "Opportunity",
      },
    };
    render(<CompositeScoring canEdit={true} formik={formikWithValue} />);
    const addButton = screen.getByTestId("add-components-btn");
    await userEvent.click(addButton);
    expect(
      await screen.findByText("Select Composite Measure Components")
    ).toBeInTheDocument();
  });
});
