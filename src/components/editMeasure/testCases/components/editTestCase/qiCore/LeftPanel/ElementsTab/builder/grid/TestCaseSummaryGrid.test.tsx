import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import TestCaseSummaryGrid, {
  GridDataEntry,
  RESOURCE_TYPE_MISMATCH_ERROR,
  UNSUPPORTED_PROFILE_ERROR,
  UNSUPPORTED_RESOURCE_ERROR,
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
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-uknown-procedure",
          ],
        },
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
    {
      resource: {
        resourceType: "Procedure",
        id: "pd-2",
      }, // No profile present, but resourceType is valid
    },
    {
      resource: {
        resourceType: "UnknownResource",
        id: "unknown",
      }, // Unsupported resource type
    },
    {
      resource: {
        resourceType: "Patient",
        id: "patient-123",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
          ],
        },
      }, // Valid patient profile
    },
  ],
};

const gridData = [
  { title: "QICore Encounter", entry: mockBundle.entry[0] }, // Supported
  {
    title: "QICore Procedure",
    entry: mockBundle.entry[1], // Unsupported
  },
  {
    title: "QICore Procedure",
    entry: mockBundle.entry[3],
  },
  {
    title: "Unknown Resource",
    entry: mockBundle.entry[4], // Unsupported
  },
  {
    title: "QICore Patient",
    entry: mockBundle.entry[5], // Patient profile
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
  {
    id: "qicore-procedure",
    title: "QICore Procedure",
    type: "Procedure",
    category: "Clinical",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
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
  const mockOnRowClone = jest.fn();

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
        measureModel="QI-Core 6.0"
        readOnly={false}
      />
    );

    const columnHeaders = screen.getAllByRole("columnheader");
    expect(within(columnHeaders[0]).getByText("Profile")).toBeInTheDocument();
    expect(within(columnHeaders[1]).getByText("HL7")).toBeInTheDocument();
    expect(within(columnHeaders[2]).getByText("ID")).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(
      within(rows[1].querySelector("td:nth-child(1)")).getByText(
        "QICore Encounter"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[1].querySelector("td:nth-child(3)")).getByText("ec-1")
    ).toBeInTheDocument();

    expect(
      within(rows[2].querySelector("td:nth-child(1)")).getByText(
        "QICore Procedure"
      )
    ).toBeInTheDocument();

    expect(
      within(rows[2].querySelector("td:nth-child(3)")).getByText("pd-1")
    ).toBeInTheDocument();

    // Verify unsupported message/tooltip is present for unsupported profile
    expect(
      within(rows[2].querySelector("td:nth-child(1)")).getByText(
        UNSUPPORTED_PROFILE_ERROR
      )
    ).toBeInTheDocument();
    // Verify unsupported message/tooltip is present for unsupported profile
    expect(
      within(rows[4].querySelector("td:nth-child(1)")).getByText(
        UNSUPPORTED_RESOURCE_ERROR
      )
    ).toBeInTheDocument();
  });

  it("opens the HL7 profile link when the HL7 icon is clicked", async () => {
    window.open = jest.fn();

    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        measureModel="QI-Core 6.0"
        readOnly={false}
      />
    );

    const hl7Button = await screen.findByTestId("hl7-link-qicore-encounter");
    await userEvent.click(hl7Button);

    expect(window.open).toHaveBeenCalledWith(
      "https://hl7.org/fhir/us/qicore/STU6/StructureDefinition-qicore-encounter.html",
      "_blank"
    );
  });

  it("opens the US Core HL7 link using canonical meta.profile when context matching is unavailable", async () => {
    window.open = jest.fn();

    const compositeLikeGridData = [
      {
        title: "US Core Blood Pressure Profile",
        entry: {
          resource: {
            resourceType: "Observation",
            id: "obs-1",
            meta: {
              profile: [
                "http://hl7.org/fhir/us/core/StructureDefinition/us-core-blood-pressure",
              ],
            },
          },
        },
      },
    ] as GridDataEntry[];

    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={compositeLikeGridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        measureModel="QI-Core 6.0"
        readOnly={false}
      />
    );

    const hl7Button = await screen.findByTestId(
      "hl7-link-us-core-blood-pressure"
    );
    await userEvent.click(hl7Button);

    expect(window.open).toHaveBeenCalledWith(
      "https://hl7.org/fhir/us/core/StructureDefinition-us-core-blood-pressure.html",
      "_blank"
    );
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

    // Edit should be available and named "Edit"
    const editAction = screen.getByTestId("action-ec-1-Edit");
    expect(editAction).toBeInTheDocument();
    expect(editAction).not.toHaveAttribute("aria-disabled", "true");
    const deleteAction = screen.getByTestId("action-ec-1-Remove");
    expect(deleteAction).toBeInTheDocument();
  });

  it("should render Clone action that invokes onRowClone with the GridDataEntry", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        onRowClone={mockOnRowClone}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    const cloneAction = screen.getByTestId("action-ec-1-Clone");
    expect(cloneAction).toBeInTheDocument();
    expect(cloneAction).not.toHaveAttribute("aria-disabled", "true");

    userEvent.click(cloneAction);
    await waitFor(() => {
      expect(mockOnRowClone).toHaveBeenCalledTimes(1);
    });
    // Now expects GridDataEntry with entry and title
    expect(mockOnRowClone).toHaveBeenCalledWith({
      title: "QICore Encounter",
      entry: mockBundle.entry[0],
      validationResult: expect.any(Object),
    });
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

    // Edit should be disabled.
    const editAction = screen.getByTestId("action-pd-1-Edit");
    expect(editAction).toBeInTheDocument();
    expect(editAction).toBeDisabled();

    // Delete should still be enabled
    const deleteAction = screen.getByTestId("action-pd-1-Remove");
    expect(deleteAction).toBeInTheDocument();
    expect(deleteAction).not.toHaveAttribute("aria-disabled", "true");

    // Ensure clicking it does NOT call edit
    expect(editAction).toBeDisabled();
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

    // Edit should be disabled.
    const editAction = screen.getByTestId("action-patient-1-Edit");
    expect(editAction).toBeDisabled();
    // Delete should still be enabled
    const deleteAction = screen.getByTestId("action-ec-1-Remove");

    expect(deleteAction).not.toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(RESOURCE_TYPE_MISMATCH_ERROR)).toBeInTheDocument();

    // Ensure clicking it does NOT call edit
    expect(editAction).toBeDisabled();
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

    const editAction = screen.getByTestId("action-ec-1-Edit");
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
    const deleteButton = screen.getByTestId("action-ec-1-Remove");

    expect(deleteButton).toBeInTheDocument();
    userEvent.click(deleteButton);
    expect(mockOnRowDelete).not.toHaveBeenCalledWith(mockBundle.entry[0]);

    const deleteDialog = screen.getByTestId("delete-dialog");
    expect(deleteDialog).toBeInTheDocument();
    expect(screen.getByText("Remove Element")).toBeInTheDocument();

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

    const viewAction = screen.getByTestId("action-ec-1-View");
    expect(viewAction).toBeInTheDocument();

    const deleteAction = screen.queryByRole("menuitem", {
      name: "Delete",
    });
    expect(deleteAction).not.toBeInTheDocument();

    userEvent.click(viewAction);
    expect(mockOnRowEdit).toHaveBeenCalledWith(mockBundle.entry[0]);
  });

  it("should NOT render Clone action for Patient profiles", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        onRowClone={mockOnRowClone}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    // Clone action should NOT be present for Patient profiles
    const cloneAction = screen.queryByTestId("action-patient-123-Clone");
    expect(cloneAction).not.toBeInTheDocument();

    // Edit and Remove should still be present
    const editAction = screen.getByTestId("action-ec-1-Edit");
    expect(editAction).toBeInTheDocument();

    const removeAction = screen.getByTestId("action-ec-1-Remove");
    expect(removeAction).toBeInTheDocument();
  });

  it("should render Clone action for non-Patient profiles", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        onRowClone={mockOnRowClone}
        testCaseCanEdit={true}
        readOnly={false}
      />
    );

    // Clone action SHOULD be present for non-Patient profiles (Encounter)
    const cloneAction = screen.getByTestId("action-ec-1-Clone");
    expect(cloneAction).toBeInTheDocument();

    const editAction = screen.getByTestId("action-ec-1-Edit");
    expect(editAction).toBeInTheDocument();
    const removeAction = screen.getByTestId("action-ec-1-Remove");
    expect(removeAction).toBeInTheDocument();
  });

  it("should show hover icon and toggle sorting for Profile header", async () => {
    renderWithResourceContext(
      <TestCaseSummaryGrid
        gridData={gridData}
        onRowEdit={mockOnRowEdit}
        onRowDelete={mockOnRowDelete}
        testCaseCanEdit={true}
        measureModel="QI-Core 6.0"
        readOnly={false}
      />
    );

    const profileHeader = screen.getByRole("columnheader", {
      name: /profile/i,
    });

    const profileButton = within(profileHeader).getByRole("button");

    // Initial state
    expect(profileButton).toHaveAttribute("title", "Sort ascending");

    // Cover onMouseEnter
    fireEvent.mouseEnter(profileHeader);

    expect(
      document.querySelector('[data-testid="UnfoldMoreIcon"]')
    ).toBeInTheDocument();

    // Cover onMouseLeave
    fireEvent.mouseLeave(profileHeader);

    expect(
      document.querySelector('[data-testid="UnfoldMoreIcon"]')
    ).not.toBeInTheDocument();

    // Cover e.preventDefault() + toggleSorting()
    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(profileButton).toHaveAttribute("title", "Sort descending");
    });

    expect(
      document.querySelector('[data-testid="KeyboardArrowUpIcon"]')
    ).toBeInTheDocument();

    fireEvent.click(profileButton);

    await waitFor(() => {
      expect(profileButton).toHaveAttribute("title", "Clear sort");
    });

    expect(
      document.querySelector('[data-testid="KeyboardArrowDownIcon"]')
    ).toBeInTheDocument();
  });
});
