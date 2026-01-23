import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompositeComponent from "./CompositeComponent";

const mockFormik = {
  values: {
    compositeScoring: "",
  },
  setFieldValue: jest.fn(),
  touched: {},
  errors: {},
};

describe("CompositeComponent", () => {
  it("renders the composite component container", () => {
    render(<CompositeComponent canEdit={true} formik={mockFormik} />);
    expect(screen.getByTestId("composite-component")).toBeInTheDocument();
  });

  it("renders the CompositeScoring select dropdown", () => {
    render(<CompositeComponent canEdit={true} formik={mockFormik} />);
    expect(screen.getByTestId("composite-scoring")).toBeInTheDocument();
  });

  it("disables Add Components button when composite scoring is not selected", () => {
    render(<CompositeComponent canEdit={true} formik={mockFormik} />);
    const addButton = screen.getByTestId("add-components-btn");
    expect(addButton).toBeDisabled();
  });
});
