import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CommentsFlyoutPanel from "./CommentsFlyoutPanel";
import userEvent from "@testing-library/user-event";
jest.mock("@madie/madie-design-system/dist/react", () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
  RichTextEditor: ({ label, content, onChange, ...props }: any) => (
    <div>
      <div data-testid="comments-flyout-label">{label}</div>
      <textarea
        aria-label={typeof label === "string" ? label : undefined}
        value={content}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </div>
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
  it("shows the full label without truncation when it is within the max length", () => {
    render(
      <CommentsFlyoutPanel open onClose={jest.fn()} sectionName="Details" />
    );
    const label = screen.getByTestId("comments-flyout-label");
    expect(label).toHaveTextContent("Add a comment to Details");
    expect(label.textContent).not.toContain("...");
    // short label is rendered as plain text, not wrapped in a tooltip trigger
    expect(label.querySelector("span")).not.toBeInTheDocument();
  });
  it("truncates a long label with an ellipsis and shows the full text in a tooltip", async () => {
    const longSectionName =
      "A Very Long Population Criteria Section Name Example";
    const fullLabel = `Add a comment to ${longSectionName}`;
    render(
      <CommentsFlyoutPanel
        open
        onClose={jest.fn()}
        sectionName={longSectionName}
      />
    );
    const label = screen.getByTestId("comments-flyout-label");
    const truncatedText = `${fullLabel.slice(0, 50)}...`;
    expect(label).toHaveTextContent(truncatedText);
    expect(label.textContent).not.toEqual(fullLabel);
    userEvent.hover(screen.getByText(truncatedText));
    await waitFor(() => {
      expect(
        screen.getByRole("tooltip", { name: fullLabel })
      ).toBeInTheDocument();
    });
  });
});
