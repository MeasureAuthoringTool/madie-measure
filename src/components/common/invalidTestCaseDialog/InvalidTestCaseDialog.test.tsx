import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import InvalidTestCaseDialog from "./InvalidTestCaseDialog";

describe("Create Version Invalid Test Case Dialog component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should call onClose when the cancel button is clicked", async () => {
    const onCloseFn = jest.fn();
    render(
      <InvalidTestCaseDialog
        open={true}
        onClose={onCloseFn}
        onContinue={jest.fn()}
        versionType="major"
      />
    );
    expect(screen.getByTestId("invalid-test-case-dialog")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("invalid-test-dialog-cancel-button"));
    });
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should call onContinue when the continue button is clicked", async () => {
    const onContinueFn = jest.fn();
    render(
      <InvalidTestCaseDialog
        open={true}
        onClose={jest.fn()}
        onContinue={onContinueFn}
        versionType="major"
      />
    );
    expect(screen.getByTestId("invalid-test-case-dialog")).toBeInTheDocument();
    const continueButton = screen.getByTestId(
      "invalid-test-dialog-continue-button"
    );
    act(() => {
      fireEvent.click(continueButton);
    });
    await waitFor(() => {
      expect(onContinueFn).toHaveBeenCalledWith("major");
    });
  });
});
