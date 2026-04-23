import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import CreateCompositeTestCaseRightPanelTabs from "./CreateCompositeTestCaseRightPanelTabs";

describe("CreateCompositeTestCaseRightPanelTabs", () => {
  it("calls setRightPanelActiveTab when a tab is clicked", () => {
    const setRightPanelActiveTab = jest.fn();

    render(
      <CreateCompositeTestCaseRightPanelTabs
        rightPanelActiveTab="actual"
        setRightPanelActiveTab={setRightPanelActiveTab}
      />
    );

    const detailsTab = screen.getByTestId("details-tab");

    fireEvent.click(detailsTab);

    expect(setRightPanelActiveTab).toHaveBeenCalledTimes(1);
    expect(setRightPanelActiveTab).toHaveBeenCalledWith("details");
  });

  it("allows switching back to actual tab", async () => {
    const setRightPanelActiveTab = jest.fn();

    render(
      <CreateCompositeTestCaseRightPanelTabs
        rightPanelActiveTab="details"
        setRightPanelActiveTab={setRightPanelActiveTab}
      />
    );

    const actualTab = screen.getByTestId("actual-tab");

    await userEvent.click(actualTab);

    expect(setRightPanelActiveTab).toHaveBeenCalledWith("actual");
  });
});
