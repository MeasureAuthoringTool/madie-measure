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
jest.mock("@madie/madie-util", () => ({
  ReviewSubSection: ({
    entityType,
    readyForReviewBy,
    readyForReviewAt,
  }: any) => (
    <div data-testid="comments-review-subsection">
      <span data-testid="review-entity-type">{entityType}</span>
      <span data-testid="review-ready-by">{readyForReviewBy}</span>
      <span data-testid="review-ready-at">{readyForReviewAt}</span>
    </div>
  ),
}));
const sections = [
  {
    name: "Details",
    subSections: ["Name, Version & ID", "Model & Measurement Period"],
  },
  { name: "CQL Editor", subSections: ["CQL Editor"] },
  {
    name: "Population Criteria",
    subSections: ["Criteria 1", "Criteria 2", "Supplemental Data"],
  },
  { name: "Test Cases", subSections: ["Population Criteria 1", "SDE"] },
];

const titlesIn = (container: Element) =>
  Array.from(
    container.querySelectorAll(".comments-flyout-subsection-title")
  ).map((title) => title.textContent);

const rowFor = (title: string) =>
  screen
    .getByText(title, { selector: ".comments-flyout-subsection-title" })
    .closest(".comments-flyout-subsection");

const isHighlighted = (row: Element) =>
  row.classList.contains("comments-flyout-subsection--current");

describe("CommentsFlyoutPanel", () => {
  it("renders the sections and keeps actions disabled until text is entered", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="CQL Editor"
      />
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
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={onClose}
        sectionName="Description"
      />
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
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Details"
      />
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
        sections={sections}
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

  it("renders the Review sub-section under General", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Details"
      />
    );
    expect(
      screen.getByTestId("comments-review-subsection")
    ).toBeInTheDocument();
    expect(screen.getByTestId("review-entity-type")).toHaveTextContent(
      "measure"
    );
  });

  it("shows only the sub-section for the screen the user is on", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Criteria 1"
        mainSection="Population Criteria"
      />
    );

    // the screen they are on is listed
    const populationCriteria = screen
      .getByText("Population Criteria")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(populationCriteria)).toEqual(["Criteria 1"]);

    // its siblings have no comments yet, so they stay hidden
    expect(screen.queryByText("Criteria 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Supplemental Data")).not.toBeInTheDocument();

    // and so does every other header
    const details = screen
      .getByText("Details")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(details)).toEqual([]);
  });

  it("keeps sub-sections that already hold comments, wherever the user is", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="CQL Editor"
        mainSection="CQL Editor"
        commentedSubSections={[
          "Details::Model & Measurement Period",
          "Population Criteria::Criteria 2",
        ]}
      />
    );

    const details = screen
      .getByText("Details")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(details)).toEqual(["Model & Measurement Period"]);

    const populationCriteria = screen
      .getByText("Population Criteria")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(populationCriteria)).toEqual(["Criteria 2"]);

    // the screen they are on is listed alongside the commented ones
    expect(screen.getByTestId("comments-current-subsection")).toHaveTextContent(
      "CQL Editor"
    );
    // a commented sub-section keeps its catalogue position
    expect(screen.queryByText("Name, Version & ID")).not.toBeInTheDocument();
  });

  it("lists the screen the user is on even when the header does not cover it", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="IPP-Pass - Test Case 65"
        mainSection="Test Cases"
      />
    );

    const testCases = screen
      .getByText("Test Cases")
      .closest(".comments-flyout-panel-accordion");
    expect(titlesIn(testCases)).toEqual(["IPP-Pass - Test Case 65"]);
  });

  it("shows a details screen sub-section under the Details header", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Model & Measurement Period"
        mainSection="Details"
      />
    );

    const subSection = screen.getByTestId("comments-current-subsection");
    expect(subSection).toHaveTextContent("Model & Measurement Period");
    expect(
      screen.getByText("Details").closest(".comments-flyout-panel-accordion")
    ).toContainElement(subSection);
    // the review activity keeps its own header
    expect(
      screen.getByText("General").closest(".comments-flyout-panel-accordion")
    ).toContainElement(screen.getByTestId("comments-review-subsection"));
  });

  it("shows the current sub-section under its main header, expanded", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Criteria 2"
        mainSection="Population Criteria"
      />
    );

    const subSection = screen.getByTestId("comments-current-subsection");
    expect(subSection).toHaveTextContent("Criteria 2");
    // it sits under the main header for the screen the user is on
    expect(
      screen
        .getByText("Population Criteria")
        .closest(".comments-flyout-panel-accordion")
    ).toContainElement(subSection);
    // and that header is the one expanded by default
    expect(
      screen.getByText("Population Criteria").closest(".MuiAccordion-root")
    ).toHaveClass("Mui-expanded");
    expect(
      screen.getByText("Test Cases").closest(".MuiAccordion-root")
    ).not.toHaveClass("Mui-expanded");
  });

  it("moves the blue highlight to whichever sub-section is clicked", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Criteria 1"
        mainSection="Population Criteria"
        commentedSubSections={["Population Criteria::Supplemental Data"]}
      />
    );

    // the screen the user is on starts selected
    expect(isHighlighted(rowFor("Criteria 1"))).toBe(true);
    expect(isHighlighted(rowFor("Supplemental Data"))).toBe(false);

    userEvent.click(screen.getByText("Supplemental Data"));

    // selection follows the click, and only one row is ever selected
    expect(isHighlighted(rowFor("Supplemental Data"))).toBe(true);
    expect(isHighlighted(rowFor("Criteria 1"))).toBe(false);
  });

  it("keeps a sub-section selected after it is collapsed again", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Criteria 1"
        mainSection="Population Criteria"
      />
    );

    // collapsing the selected row must not clear the highlight
    userEvent.click(screen.getByText("Criteria 1"));
    expect(isHighlighted(rowFor("Criteria 1"))).toBe(true);
  });

  it("selects a sub-section in a header the user is not on", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="CQL Editor"
        mainSection="CQL Editor"
        commentedSubSections={["Details::Name, Version & ID"]}
      />
    );

    userEvent.click(screen.getByText("Name, Version & ID"));

    expect(isHighlighted(rowFor("Name, Version & ID"))).toBe(true);
    expect(isHighlighted(rowFor("CQL Editor"))).toBe(false);
  });

  it("collapses and expands the main header on click", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="CQL Editor"
        mainSection="CQL Editor"
      />
    );

    const header = screen.getByText("CQL Editor", {
      selector: ".comments-flyout-panel-section-title",
    });
    const accordion = header.closest(".MuiAccordion-root");
    expect(accordion).toHaveClass("Mui-expanded");

    userEvent.click(header);
    expect(accordion).not.toHaveClass("Mui-expanded");

    userEvent.click(header);
    expect(accordion).toHaveClass("Mui-expanded");
  });

  it("renders no current sub-section for a route that cannot be commented on", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Current section"
      />
    );

    expect(
      screen.queryByTestId("comments-current-subsection")
    ).not.toBeInTheDocument();
  });

  it("passes the ready for review details through to the sub-section", () => {
    render(
      <CommentsFlyoutPanel
        sections={sections}
        open
        onClose={jest.fn()}
        sectionName="Details"
        readyForReviewBy="jjones"
        readyForReviewAt="2026-08-12T09:00:00"
      />
    );
    expect(screen.getByTestId("review-ready-by")).toHaveTextContent("jjones");
    expect(screen.getByTestId("review-ready-at")).toHaveTextContent(
      "2026-08-12T09:00:00"
    );
  });
});
