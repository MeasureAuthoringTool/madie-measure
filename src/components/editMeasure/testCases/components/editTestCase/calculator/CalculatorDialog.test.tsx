import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CalculatorDialog from "./CalculatorDialog";

describe("Test CalculatorDialog component", () => {
  it("renders the dialog when open is true", () => {
    render(<CalculatorDialog open={true} onClose={jest.fn()} />);
    expect(screen.getByTestId("calculation-dialog")).toBeInTheDocument();
  });

  it("does not render the dialog when open is false", () => {
    render(<CalculatorDialog open={false} onClose={jest.fn()} />);
    expect(screen.queryByTestId("calculation-dialog")).not.toBeInTheDocument();
  });

  it("renders the Duration/Difference tab as active by default", () => {
    render(<CalculatorDialog open={true} onClose={jest.fn()} />);
    expect(screen.getByTestId("duration-difference-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("switches to the Computed Date tab when clicked", () => {
    render(<CalculatorDialog open={true} onClose={jest.fn()} />);
    userEvent.click(screen.getByTestId("computed-date-tab"));
    expect(screen.getByTestId("computed-date-tab")).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  it("calls onClose when the dialog is closed", () => {
    const onCloseMock = jest.fn();
    render(<CalculatorDialog open={true} onClose={onCloseMock} />);
    userEvent.click(screen.getByTestId("calculation-close-button"));
    expect(onCloseMock).toHaveBeenCalled();
  });
});
