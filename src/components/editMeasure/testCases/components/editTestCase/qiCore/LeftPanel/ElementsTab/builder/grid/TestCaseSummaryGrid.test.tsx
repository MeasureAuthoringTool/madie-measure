import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import TestCaseSummaryGrid from "./TestCaseSummaryGrid";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

export const mockBundle = {
  entry: [
    {
      resource: {
        resourceType: "Encounter",
        id: "ec-1",
        meta: {
          profile: ["www.wwww.www.com"], // Partially covered case
          extensions: {
            nested: {
              deeper: {
                key: "value",
              },
            },
          },
        },
      },
    },
    {
      resource: {
        resourceType: "Procedure",
        id: "pd-1",
      },
    },
  ],
};
describe("TestCaseSummaryGrid", () => {
  const mockOnRowEdit = jest.fn();
  const mockOnRowDelete = jest.fn();

  it("should render the table with correct headers and data from the bundle", () => {
    render(
      <TestCaseSummaryGrid
        bundle={mockBundle}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
      />
    );

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(
      within(columnHeaders[0]).getByText("Resource & Value Set")
    ).toBeInTheDocument();
    expect(within(columnHeaders[1]).getByText("ID")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(
      within(rows[1].querySelector("td:nth-child(1)")).getByText("Encounter")
    ).toBeInTheDocument();

    expect(
      within(rows[1].querySelector("td:nth-child(2)")).getByText("ec-1")
    ).toBeInTheDocument();

    expect(
      within(rows[2].querySelector("td:nth-child(1)")).getByText("Procedure")
    ).toBeInTheDocument();

    expect(
      within(rows[2].querySelector("td:nth-child(2)")).getByText("pd-1")
    ).toBeInTheDocument();
  });

  it("should render ActionCenter with correct actions", async () => {
    render(
      <TestCaseSummaryGrid
        bundle={mockBundle}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
      />
    );

    const firstActionCenterButton = screen.getByTestId(
      "action-center-button-pd-1"
    );
    userEvent.click(firstActionCenterButton);
    const editAction = await screen.findByRole("menuitem", { name: "Edit" });
    expect(editAction).toBeInTheDocument();
    const deleteAction = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteAction).toBeInTheDocument();
  });

  it("should call onRowEdit when Edit action is clicked", async () => {
    render(
      <TestCaseSummaryGrid
        bundle={mockBundle}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
      />
    );

    const firstActionCenterButton = screen.getByTestId(
      "action-center-button-ec-1"
    );
    userEvent.click(firstActionCenterButton);
    const editAction = await screen.findByRole("menuitem", { name: "Edit" });
    expect(editAction).toBeInTheDocument();
    userEvent.click(editAction);
    expect(mockOnRowEdit).toHaveBeenCalledWith(mockBundle.entry[0]);
  });

  it("should call onRowDelete when Delete action is clicked", async () => {
    render(
      <TestCaseSummaryGrid
        bundle={mockBundle}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
      />
    );

    const firstActionCenterButton = screen.getByTestId(
      "action-center-button-ec-1"
    );
    userEvent.click(firstActionCenterButton);
    const deleteButton = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteButton).toBeInTheDocument();
    userEvent.click(deleteButton);
    expect(mockOnRowDelete).not.toHaveBeenCalledWith(mockBundle.entry[0]);

    const deleteDialog = screen.getByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Delete Element")).toBeInTheDocument();

    expect(screen.getByTestId("close-button")).toBeInTheDocument();

    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();
    const continueBtn = screen.getByTestId("delete-dialog-continue-button");
    expect(continueBtn).toBeInTheDocument();

    userEvent.click(continueBtn);
    await waitFor(() => {
      expect(deleteDialog).not.toBeInTheDocument();
      expect(mockOnRowDelete).toHaveBeenCalledWith(mockBundle.entry[0]);
    });
  });
});
