import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import TestCaseSummaryGrid, {
  GridDataEntry,
  RESOURCE_TYPE_MISMATCH_ERROR,
  UNSUPPORTED_PROFILE_ERROR,
} from "./TestCaseSummaryGrid";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import ResourceContext from "../ResourceContext";

export const mockBundle = {
  entry: [
    {
      resource: {
        resourceType: "Encounter",
        id: "ec-1",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
          ],
        },
      },
    },
    {
      resource: {
        resourceType: "Procedure",
        id: "pd-1",
        // No profile = Unsupported
      },
    },
    {
      resource: {
        resourceType: "Practitioner",
        id: "patient-1",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
          ],
        }, // profile & resourceType mismatch
      },
    },
  ],
};

const gridData = [
  { title: "QICore Encounter", entry: mockBundle.entry[0] }, // Supported
  {
    title: "QICore Procedure",
    entry: mockBundle.entry[1], // Unsupported
  },
] as GridDataEntry[];

// Mock resourceIdentifiers for ResourceContext
const resourceIdentifiers = [
  {
    id: "qicore-encounter",
    title: "QICore Encounter",
    type: "Encounter",
    category: "Clinical",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
  },
  {
    id: "qicore-patient",
    title: "QICore Patient",
    type: "Patient",
    category: "Clinical",
    profile: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
  },
  // No Procedure profile, so Procedure is unsupported
];

// Helper to wrap with ResourceContext
const renderWithResourceContext = (ui: React.ReactElement) =>
  render(
    <ResourceContext.Provider value={resourceIdentifiers}>
      {ui}
    </ResourceContext.Provider>
  );

describe("TestCaseSummaryGrid", () => {
  const mockOnRowEdit = jest.fn();
  const mockOnRowDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the table with correct headers and data from the bundle", () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(within(columnHeaders[0]).getByText("Profile")).toBeInTheDocument();
    expect(within(columnHeaders[1]).getByText("ID")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(
      within(rows[1].querySelector("td:nth-child(1)")).getByText(
        "QICore Encounter"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[1].querySelector("td:nth-child(2)")).getByText("ec-1")
    ).toBeInTheDocument();

    expect(
      within(rows[2].querySelector("td:nth-child(1)")).getByText(
        "QICore Procedure"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[2].querySelector("td:nth-child(2)")).getByText("pd-1")
    ).toBeInTheDocument();

    // Verify unsupported message/tooltip is present for unsupported profile
    expect(
      within(rows[2].querySelector("td:nth-child(1)")).getByText(
        UNSUPPORTED_PROFILE_ERROR
      )
    ).toBeInTheDocument();
  });

  it("should render the table with no data", () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={[]}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(within(columnHeaders[0]).getByText("Profile")).toBeInTheDocument();
  });

  it("should render the table with undefined, no data", () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={undefined}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(within(columnHeaders[0]).getByText("Profile")).toBeInTheDocument();
  });

  it("should render ActionCenter with correct actions for Supported Profile", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    // ec-1 is Supported
    const firstActionCenterButton = screen.getByTestId(
      "action-center-button-ec-1"
    );
    userEvent.click(firstActionCenterButton);

    // Edit should be available and named "Edit"
    const editAction = await screen.findByRole("menuitem", { name: "Edit" });
    expect(editAction).toBeInTheDocument();
    expect(editAction).not.toHaveAttribute("aria-disabled", "true");

    const deleteAction = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteAction).toBeInTheDocument();
  });

  it("should render ActionCenter with disabled Edit action for Unsupported Profile", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    // pd-1 is Unsupported
    const actionCenterButton = screen.getByTestId("action-center-button-pd-1");
    userEvent.click(actionCenterButton);

    // Edit should be disabled.
    const editAction = await screen.findByTestId("action-center-pd-1_Edit");
    expect(editAction).toBeInTheDocument();
    expect(editAction).toHaveAttribute("aria-disabled", "true");

    // Delete should still be enabled
    const deleteAction = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteAction).toBeInTheDocument();
    expect(deleteAction).not.toHaveAttribute("aria-disabled", "true");

    // Ensure clicking it does NOT call edit
    userEvent.click(editAction);
    expect(mockOnRowEdit).not.toHaveBeenCalled();
  });

  it("should display error message if Profile doesn't match with correct resource type", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={
          [
            ...gridData,
            {
              title: "QICore Practitioner",
              entry: mockBundle.entry[2], // mismatched profile & resourceType
            },
          ] as GridDataEntry[]
        }
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    const actionCenterButton = screen.getByTestId(
      "action-center-button-patient-1"
    );
    userEvent.click(actionCenterButton);

    // Edit should be disabled.
    const editAction = await screen.findByTestId(
      "action-center-patient-1_Edit"
    );
    expect(editAction).toHaveAttribute("aria-disabled", "true");

    // Delete should still be enabled
    const deleteAction = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteAction).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(RESOURCE_TYPE_MISMATCH_ERROR)).toBeInTheDocument();

    // Ensure clicking it does NOT call edit
    userEvent.click(editAction);
    expect(mockOnRowEdit).not.toHaveBeenCalled();
  });

  it("should display error message for mismatched profile without edit permissions", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={
          [
            ...gridData,
            {
              title: "QICore Practitioner",
              entry: mockBundle.entry[2], // mismatched profile & resourceType
            },
          ] as GridDataEntry[]
        }
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={undefined}
        readOnly={true}
      />
    );

    expect(screen.getByText(RESOURCE_TYPE_MISMATCH_ERROR)).toBeInTheDocument();
    const viewAction = await screen.findByTestId("view-profile-patient-1");
    expect(viewAction).toHaveAttribute("disabled");
    // Ensure clicking it does NOT call edit
    userEvent.click(viewAction);
    expect(mockOnRowEdit).not.toHaveBeenCalled();
  });

  it("should call onRowEdit when Edit action is clicked (Supported)", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
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

  it("should call onRowEdit when view is clicked ", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={true}
      />
    );

    const firstActionCenterButton = screen.getByTestId("view-profile-ec-1");
    userEvent.click(firstActionCenterButton);
    expect(mockOnRowEdit).toHaveBeenCalledWith(mockBundle.entry[0]);
  });

  it("should call onRowDelete when Delete action is clicked", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        readOnly={false}
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

  it("should render ActionCenter with View action only if test case cannot be edited", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={false}
        readOnly={false}
      />
    );

    const firstActionCenterButton = screen.getByTestId(
      "action-center-button-ec-1"
    );
    userEvent.click(firstActionCenterButton);
    const viewAction = await screen.findByRole("menuitem", { name: "View" });
    expect(viewAction).toBeInTheDocument();
    const deleteAction = screen.queryByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteAction).not.toBeInTheDocument();

    userEvent.click(viewAction);
    expect(mockOnRowEdit).toHaveBeenCalledWith(mockBundle.entry[0]);
  });
});
