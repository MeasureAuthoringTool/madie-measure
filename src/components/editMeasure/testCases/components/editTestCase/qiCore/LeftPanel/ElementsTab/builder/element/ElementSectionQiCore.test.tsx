import * as React from "react";
import "@testing-library/jest-dom";
import { describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import ElementSectionQiCore from "./ElementSectionQiCore";

const { findByText, findByTestId } = screen;

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
    const foundBody = await findByTestId(expectedId);
    expect(foundBody).toBeInTheDocument();
    const expansionButton = await findByTestId(
      "elements-heading-expansion-button-Demographics"
    );
    act(() => {
      fireEvent.click(expansionButton);
    });
    await waitFor(() => {
      expect(foundBody).not.toBeInTheDocument();
    });
  });
});
