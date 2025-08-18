import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as ucum from "@lhncbc/ucum-lhc";
import QuantityInput from "./QuantityInput";

jest.mock("@lhncbc/ucum-lhc", () => ({
  UcumLhcUtils: {
    getInstance: () => ({
      validateUnitString: jest.fn(),
    }),
  },
}));

describe("QuantityInput Component", () => {
  const mockOnChange = jest.fn();
  const defaultProps = {
    canEdit: true,
    label: "Test Label",
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all fields with initial values", () => {
    render(<QuantityInput {...defaultProps} />);

    // Find inputs by their test IDs
    const comparatorField = screen.getByTestId(
      "comparator-select-input-comparator"
    );
    const quantityField = screen.getByTestId("quantity-input-field-quantity");
    const unitField = screen.getByTestId("quantity-input-field-unit");

    expect(comparatorField).toBeInTheDocument();
    expect(quantityField).toBeInTheDocument();
    expect(unitField).toBeInTheDocument();

    expect(screen.getByText("<")).toBeInTheDocument();
  });

  it("handles quantity value change", () => {
    render(<QuantityInput {...defaultProps} />);

    const valueInput = screen.getByTestId("quantity-input-quantity");
    fireEvent.change(valueInput, { target: { value: "123" } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "123",
      })
    );
  });

  it("handles read-only state correctly", () => {
    render(<QuantityInput {...defaultProps} canEdit={false} />);

    const valueInput = screen.getByTestId("quantity-input-field-quantity");
    const unitInput = screen.getByTestId("quantity-input-field-unit");

    expect(valueInput).toHaveAttribute("readonly");
    expect(unitInput).toHaveAttribute("readonly");
  });

  it("prevents invalid characters in quantity input", () => {
    render(<QuantityInput {...defaultProps} />);

    const valueInput = screen.getByTestId("quantity-input-quantity");

    userEvent.type(valueInput, "123");
    expect(valueInput).toHaveValue(123);

    // Invalid inputs should be prevented
    const invalidChars = ["e", "a", " "];
    invalidChars.forEach((char) => {
      userEvent.type(valueInput, char);
      expect(valueInput).not.toHaveValue(expect.stringContaining(char));
    });
  });
});
