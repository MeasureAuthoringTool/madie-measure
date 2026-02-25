import * as React from "react";
import "@testing-library/jest-dom";
import { describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import ElementSectionQiCore from "./ElementSectionQiCore";

const { findByText, findByTestId, queryByTestId } = screen;

describe("TabHeadings", () => {
  test("TabHeading does in fact exist with specified text", async () => {
    const title = "FakeTitle";
    render(<ElementSectionQiCore title={title} />);
    const foundTitle = await findByText(title);
    expect(foundTitle).toBeInTheDocument();
  });

  test("Tab Headings display descriptions when clicked on, hides after", async () => {
    const title = "Demographics";
    const expectedId = `elements-header-content-${title}`;
    render(<ElementSectionQiCore title={title} />);
    const foundTitle = await findByText(title);
    // open
    expect(foundTitle).toBeInTheDocument();
    expect(queryByTestId(expectedId)).toBeNull();
    const expansionButton = await findByTestId(
      "elements-heading-expansion-button-Demographics"
    );
    act(() => {
      fireEvent.click(expansionButton);
    });
    const foundBody = await findByTestId(expectedId);
    expect(foundBody).toBeInTheDocument();
  });

  test("AddElementButton is rendered when canBeMultipleCardinality is true", async () => {
    const handleAddElementMock = jest.fn();
    render(
      <ElementSectionQiCore
        title="Test Title"
        canBeMultipleCardinality={true}
        handleAddElement={handleAddElementMock}
      />
    );
    const addButton = await screen.findByText("Add Element");
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(handleAddElementMock).toHaveBeenCalled();
  });

  test("AddElementButton is not rendered when canBeMultipleCardinality is false", async () => {
    render(
      <ElementSectionQiCore
        title="Test Title"
        canBeMultipleCardinality={false}
        handleAddElement={jest.fn()}
      />
    );
    const addButton = screen.queryByText("Add Element");
    expect(addButton).not.toBeInTheDocument();
  });

  test("Required asterisk is displayed when required is true", async () => {
    render(<ElementSectionQiCore title="Required Title" required={true} />);
    const asterisk = await screen.findByText("*");
    expect(asterisk).toBeInTheDocument();
  });

  test("Required asterisk is not displayed when required is false", async () => {
    render(<ElementSectionQiCore title="Optional Title" required={false} />);
    const asterisk = screen.queryByText("*");
    expect(asterisk).not.toBeInTheDocument();
  });
});
