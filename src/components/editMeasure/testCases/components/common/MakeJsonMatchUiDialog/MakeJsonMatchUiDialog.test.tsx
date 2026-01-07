import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MakeJsonMatchUiDialog from "./MakeJsonMatchUiDialog";

describe("MakeJsonMatchUiDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the dialog with correct title", () => {
    render(
      <MakeJsonMatchUiDialog
        open={true}
        onClose={mockOnClose}
        onContinue={mockOnContinue}
        selectedTestCaseCount={3}
      />
    );

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("should display correct content with selected test case count", () => {
    render(
      <MakeJsonMatchUiDialog
        open={true}
        onClose={mockOnClose}
        onContinue={mockOnContinue}
        selectedTestCaseCount={5}
      />
    );

    expect(
      screen.getByText(
        "For each of the selected 5 test cases, you are about to:"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Set all "family" fields in the JSON to the group value that was entered in the UI'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Set all "given" fields in the JSON to the title value that was entered in the UI'
      )
    ).toBeInTheDocument();
  });

  it("should call onClose when Cancel button is clicked", async () => {
    render(
      <MakeJsonMatchUiDialog
        open={true}
        onClose={mockOnClose}
        onContinue={mockOnContinue}
        selectedTestCaseCount={1}
      />
    );

    const cancelBtn = screen.getByTestId("make-json-match-ui-cancel-button");
    await userEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should call onClose when X button is clicked", async () => {
    render(
      <MakeJsonMatchUiDialog
        open={true}
        onClose={mockOnClose}
        onContinue={mockOnContinue}
        selectedTestCaseCount={1}
      />
    );

    const closeBtn = screen.getByTestId("close-button");
    await userEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("should display Yes, Make JSON Match UI button text", () => {
    render(
      <MakeJsonMatchUiDialog
        open={true}
        onClose={mockOnClose}
        onContinue={mockOnContinue}
        selectedTestCaseCount={1}
      />
    );

    expect(screen.getByText("Yes, Make JSON Match UI")).toBeInTheDocument();
  });

  it("should not render when open is false", () => {
    render(
      <MakeJsonMatchUiDialog
        open={false}
        onClose={mockOnClose}
        onContinue={mockOnContinue}
        selectedTestCaseCount={1}
      />
    );

    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
  });
});
