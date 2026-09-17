import * as React from "react";
import { render, screen } from "@testing-library/react";
import CommentsFlyoutPanel from "./CommentsFlyoutPanel";
import userEvent from "@testing-library/user-event";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  RichTextEditor: ({ label, content, onChange, ...props }: any) => (
    <textarea
      aria-label={label}
      value={content}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  ),
}));

describe("CommentsFlyoutPanel", () => {
  it("renders the sections and keeps actions disabled until text is entered", () => {
    render(
      <CommentsFlyoutPanel open onClose={jest.fn()} sectionName="CQL Editor" />
    );

    expect(
      screen.getByRole("dialog", { name: "Comments" })
    ).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Population Criteria")).toBeInTheDocument();
    expect(screen.getByTestId("comments-flyout-cancel")).toBeDisabled();
    expect(screen.getByTestId("comments-flyout-add")).toBeDisabled();
    expect(
      screen.getByLabelText("Add a comment to CQL Editor")
    ).toBeInTheDocument();

    userEvent.type(
      screen.getByTestId("comments-flyout-input"),
      "<p>A comment</p>"
    );

    expect(screen.getByTestId("comments-flyout-cancel")).toBeEnabled();
    expect(screen.getByTestId("comments-flyout-add")).toBeEnabled();
  });

  it("clears the draft on cancel and closes from the close button", () => {
    const onClose = jest.fn();
    render(
      <CommentsFlyoutPanel open onClose={onClose} sectionName="Description" />
    );

    const input = screen.getByTestId("comments-flyout-input");
    userEvent.type(input, "<p>Looks good!</p>");
    userEvent.click(screen.getByTestId("comments-flyout-cancel"));
    expect(input).toHaveValue("");

    userEvent.click(screen.getByTestId("comments-flyout-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
