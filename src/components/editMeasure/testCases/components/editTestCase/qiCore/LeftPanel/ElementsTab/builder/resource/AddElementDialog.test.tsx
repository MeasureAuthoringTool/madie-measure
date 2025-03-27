import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddElementDialog from "./AddElementDialog";
import { ElementDefinition } from "fhir/r4";

describe("AddElementDialog", () => {
  const mockOnClose = jest.fn();
  const mockSaveElements = jest.fn();

  const mockOptions = [
    {
      id: "Patient.name",
      path: "Patient.name",
    },
    {
      id: "Patient.gender",
      path: "Patient.gender",
    },
  ] as ElementDefinition[];

  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    basePath: "Patient",
    options: mockOptions,
    value: [] as ElementDefinition[],
    saveElements: mockSaveElements,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog with all components when open", () => {
    render(<AddElementDialog {...defaultProps} />);

    expect(screen.getByText("Add Attribute(s)")).toBeInTheDocument();
    expect(
      screen.getByTestId("add-element-close-dialog-button")
    ).toBeInTheDocument();
    expect(screen.getByTestId("cancel-add-element-button")).toBeInTheDocument();
    expect(screen.getByTestId("add-element-button-2")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Attributes")).toBeInTheDocument();
  });

  it("should not render dialog when closed", () => {
    render(<AddElementDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Add Attribute(s)")).not.toBeInTheDocument();
  });

  it("should call onClose when close button is clicked", async () => {
    render(<AddElementDialog {...defaultProps} />);
    userEvent.click(screen.getByTestId("add-element-close-dialog-button"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when Discard Changes is clicked", async () => {
    render(<AddElementDialog {...defaultProps} />);
    userEvent.click(screen.getByTestId("cancel-add-element-button"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should save selected elements and close when Save is clicked", async () => {
    render(<AddElementDialog {...defaultProps} />);

    const autocomplete = screen.getByPlaceholderText("Attributes");
    userEvent.click(autocomplete);

    const option = screen.getByText("name");
    userEvent.click(option);

    userEvent.click(screen.getByTestId("add-element-button-2"));

    await waitFor(() => {
      expect(mockSaveElements).toHaveBeenCalledWith([
        {
          id: "Patient.name",
          path: "Patient.name",
        },
      ]);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("should maintain existing selections when adding new elements", async () => {
    const existingValue = [
      {
        id: "Patient.name",
        path: "Patient.name",
      },
    ] as ElementDefinition[];

    render(<AddElementDialog {...defaultProps} value={existingValue} />);

    const autocomplete = screen.getByPlaceholderText("Attributes");
    userEvent.click(autocomplete);

    const option = screen.getByText("gender");
    userEvent.click(option);

    userEvent.click(screen.getByTestId("add-element-button-2"));

    await waitFor(() => {
      expect(mockSaveElements).toHaveBeenCalledWith([
        ...existingValue,
        {
          id: "Patient.gender",
          path: "Patient.gender",
        },
      ]);
    });
  });
});
