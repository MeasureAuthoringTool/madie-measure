import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import CreateTestCaseLeftPanelNavTabs from "./CreateTestCaseLeftPanelNavTabs";

import userEvent from "@testing-library/user-event";
const { getByText, getByRole } = screen;
describe("Create Test Case nav tabs", () => {
  it("Follows discard behavior when dirty attempting to navigate to JSON", async () => {
    const mocksetLeftPanelActiveTab = jest.fn();
    render(
      <CreateTestCaseLeftPanelNavTabs
        leftPanelActiveTab="elements"
        setLeftPanelActiveTab={mocksetLeftPanelActiveTab}
        isQICore6={true}
        dirty={true}
      />
    );
    //open
    userEvent.click(screen.getByTestId("json-tab"));
    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();
    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
    userEvent.click(getByText("JSON"));
    await waitFor(() => {
      expect(getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
  });
});
