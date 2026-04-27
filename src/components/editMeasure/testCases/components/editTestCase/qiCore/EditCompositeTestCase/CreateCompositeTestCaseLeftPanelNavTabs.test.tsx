import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import CreateCompositeTestCaseLeftPanelNavTabs from "./CreateCompositeTestCaseLeftPanelNavTabs";

describe("CreateCompositeTestCaseLefttPanelTabs", () => {
  it("allows switching back to actual tab", async () => {
    const setLeftPanelActiveTab = jest.fn();

    render(
      <CreateCompositeTestCaseLeftPanelNavTabs
        leftPanelActiveTab="create"
        setLeftPanelActiveTab={setLeftPanelActiveTab}
        testCaseCanEdit={false}
      />
    );

    const jsonTab = screen.getByTestId("json-tab");

    await userEvent.click(jsonTab);

    expect(setLeftPanelActiveTab).toHaveBeenCalledWith("json");
  });

  it("starts with json", () => {
    const setLeftPanelActiveTab = jest.fn();

    render(
      <CreateCompositeTestCaseLeftPanelNavTabs
        leftPanelActiveTab="json"
        setLeftPanelActiveTab={setLeftPanelActiveTab}
        testCaseCanEdit={true}
      />
    );

    const jsonTab = screen.getByTestId("editor-search-button");
    expect(jsonTab).toBeInTheDocument();
  });
});
