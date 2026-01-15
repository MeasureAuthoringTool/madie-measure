import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompositeScoring from "./CompositeScoring";

const mockFormik = {
  values: {
    compositeScoring: "",
  },
  setFieldValue: jest.fn(),
  touched: {},
  errors: {},
};

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
});
