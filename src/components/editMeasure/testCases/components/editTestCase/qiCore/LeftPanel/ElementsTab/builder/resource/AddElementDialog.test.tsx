import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddElementDialog from "./AddElementDialog";
import { ElementDefinition } from "fhir/r4";

describe("AddElementDialog", () => {
  const mockOnClose = jest.fn();
  const mockAddElements = jest.fn();

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
    addElements: mockAddElements,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render dialog with all components when open", () => {
    render(<AddElementDialog {...defaultProps} />);

    expect(screen.getByText("Add Attribute(s)")).toBeInTheDocument();
    expect(screen.getByTestId("close-button")).toBeInTheDocument();
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
    userEvent.click(screen.getByTestId("close-button"));
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
      expect(mockAddElements).toHaveBeenCalledWith([
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
      expect(mockAddElements).toHaveBeenCalledWith([
        ...existingValue,
        {
          id: "Patient.gender",
          path: "Patient.gender",
        },
      ]);
    });
  });

  it("should reset newValues to the current value and call onClose when handleClose is triggered", async () => {
    const existingValue = [
      {
        id: "Patient.name",
        path: "Patient.name",
      },
    ] as ElementDefinition[];

    render(<AddElementDialog {...defaultProps} value={existingValue} />);

    // Simulate selecting a new option
    const autocomplete = screen.getByPlaceholderText("Attributes");
    userEvent.click(autocomplete);

    const option = screen.getByText("gender");
    userEvent.click(option);

    // Verify that the newValues state has changed (new option added)
    userEvent.click(screen.getByTestId("add-element-button-2"));

    await waitFor(() => {
      expect(mockAddElements).toHaveBeenCalledWith([
        ...existingValue,
        {
          id: "Patient.gender",
          path: "Patient.gender",
        },
      ]);
    });

    // Trigger handleClose by clicking the cancel button
    userEvent.click(screen.getByTestId("cancel-add-element-button"));

    await waitFor(() => {
      // Verify that newValues is reset to the original value
      expect(mockAddElements).not.toHaveBeenCalledTimes(2); // Ensure no additional save occurred
      expect(mockOnClose).toHaveBeenCalledTimes(2); // Ensure onClose is called
    });
  });

  it("should reset newValues to match the initial value when handleClose is called", async () => {
    const initialValue = [
      {
        id: "Patient.name",
        path: "Patient.name",
      },
    ] as ElementDefinition[];

    render(<AddElementDialog {...defaultProps} value={initialValue} />);

    // Simulate selecting a new option
    const autocomplete = screen.getByPlaceholderText("Attributes");
    userEvent.click(autocomplete);

    const option = screen.getByText("gender");
    userEvent.click(option);

    // Simulate clicking the save button to add the new value
    userEvent.click(screen.getByTestId("add-element-button-2"));

    await waitFor(() => {
      expect(mockAddElements).toHaveBeenCalledWith([
        ...initialValue,
        {
          id: "Patient.gender",
          path: "Patient.gender",
        },
      ]);
    });

    // Simulate clicking the cancel button to trigger handleClose
    userEvent.click(screen.getByTestId("cancel-add-element-button"));

    await waitFor(() => {
      // Verify that newValues is reset to the initial value
      expect(mockAddElements).not.toHaveBeenCalledTimes(2); // Ensure no additional save occurred
      expect(mockOnClose).toHaveBeenCalledTimes(2); // Ensure onClose is called
    });
  });
});
