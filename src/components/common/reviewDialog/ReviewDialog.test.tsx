import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewDialog from "./ReviewDialog";

describe("ReviewDialog", () => {
  it("renders required content when open", () => {
    render(
      <ReviewDialog open={true} measure={undefined} onClose={jest.fn()} />
    );

    expect(
      screen.getByText("Mark Measure Ready for Review")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mark as Ready")).toBeInTheDocument();
    expect(screen.getByText("Comments")).toBeInTheDocument();
    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
  });

  it("enables save after mark-as-ready is changed", async () => {
    render(
      <ReviewDialog open={true} measure={undefined} onClose={jest.fn()} />
    );

    const saveButton = screen.getByTestId("review-dialog-save-button");
    const switchInput = screen.getByTestId("review-dialog-mark-ready-switch");

    expect(saveButton).toBeDisabled();
    userEvent.click(switchInput);
    expect(saveButton).toBeEnabled();
  });

  it("invokes onClose when cancel is clicked", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} measure={undefined} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-cancel-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
