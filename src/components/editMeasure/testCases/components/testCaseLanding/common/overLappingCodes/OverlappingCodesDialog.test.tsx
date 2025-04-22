import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OverlappingCodesDialog from "./OverlappingCodesDialog";
import { OverlappingCode } from "../../../../util/OverlappingCodesUtils";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

describe("OverlappingCodesDialog", () => {
  const mockHandleClose = jest.fn();
  const mockOverlappingCodes = [
    {
      code: "12345",
      codeSystem: "ICD-10",
      description: "Test Description",
      codeSystemVersion: "2023",
      valueSets: [
        { name: "ValueSet1", oid: "1.2.3.4", url: "http://example.com/1" },
        { name: "ValueSet2", oid: "5.6.7.8", url: "http://example.com/2" },
      ],
    },
    {
      code: "67890",
      codeSystem: "ICD-10",
      description: "Another Test Description",
      codeSystemVersion: "2023",
      valueSets: [
        { name: "ValueSet3", oid: "9.8.7.6", url: "http://example.com/3" },
        { name: "ValueSet2", oid: "5.6.7.8", url: "http://example.com/2" },
      ],
    },
    {
      code: "54321",
      codeSystem: "ICD-10",
      description: "New Test Description",
      codeSystemVersion: "2023",
      valueSets: [
        { name: "ValueSet4", oid: "2.3.4.5", url: "http://example.com/4" },
        { name: "ValueSet9", oid: "6.7.8.9", url: "http://example.com/9" },
      ],
    },
    {
      code: "11111",
      codeSystem: "ICD-10",
      description: "Additional Test Description",
      codeSystemVersion: "2023",
      valueSets: [
        { name: "ValueSet5", oid: "3.4.5.6", url: "http://example.com/5" },
        { name: "ValueSet2", oid: "5.6.7.8", url: "http://example.com/2" },
      ],
    },
    {
      code: "22222",
      codeSystem: "ICD-10",
      description: "Extra Test Description",
      codeSystemVersion: "2023",
      valueSets: [
        { name: "ValueSet6", oid: "7.8.9.0", url: "http://example.com/6" },
        { name: "ValueSet2", oid: "5.6.7.8", url: "http://example.com/2" },
      ],
    },
    {
      code: "33333",
      codeSystem: "ICD-10",
      description: "Newly Added Test Description",
      codeSystemVersion: "2023",
      valueSets: [
        { name: "ValueSet7", oid: "0.1.2.3", url: "http://example.com/7" },
        { name: "ValueSet2", oid: "5.6.7.8", url: "http://example.com/2" },
      ],
    },
  ] as OverlappingCode[];

  it("should render the dialog with the correct title", () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );

    expect(screen.getByTestId("overlapping-codes-dialog")).toBeInTheDocument();
    expect(screen.getByText("Overlapping Codes")).toBeInTheDocument();
  });

  it("should display the overlapping codes table for QDM", () => {
    const qdmCodes = [
      {
        ...mockOverlappingCodes[0],
        valueSets: [
          { name: "ValueSet7", oid: "0.1.2.3", url: undefined },
          { name: "ValueSet2", oid: "5.6.7.8", url: undefined },
        ],
      },
    ];
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={qdmCodes}
      />
    );

    expect(screen.getByTestId("overlapping-codes-tbl")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("ICD-10")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    // expand the row to see the value sets
    userEvent.click(screen.getByTestId("expand-button-12345_2023"));
    expect(screen.getByText("ValueSet7")).toBeInTheDocument();
    expect(screen.getByText("0.1.2.3")).toBeInTheDocument();
    expect(screen.getByText("ValueSet2")).toBeInTheDocument();
    expect(screen.getByText("5.6.7.8")).toBeInTheDocument();
  });

  it("should display the overlapping codes table for QICore", () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={[mockOverlappingCodes[0]]}
      />
    );

    expect(screen.getByTestId("overlapping-codes-tbl")).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByText("ICD-10")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
    expect(screen.getByText("2023")).toBeInTheDocument();
    // expand the row to see the value sets
    userEvent.click(screen.getByTestId("expand-button-12345_2023"));
    expect(screen.getByText("ValueSet1")).toBeInTheDocument();
    expect(screen.getByText("http://example.com/1")).toBeInTheDocument();
    expect(screen.getByText("ValueSet2")).toBeInTheDocument();
    expect(screen.getByText("http://example.com/2")).toBeInTheDocument();
  });

  it("should display a message when there are no overlapping codes", () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={[]}
      />
    );

    expect(
      screen.getByText("There are no overlapping codes")
    ).toBeInTheDocument();
  });

  it("should call handleClose when the close button is clicked", () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );

    const closeButton = screen.getByTestId(
      "overlapping-codes-report-cancel-btn"
    );
    fireEvent.click(closeButton);

    expect(mockHandleClose).toHaveBeenCalledTimes(1);
  });

  it("should disable the export button", () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );

    const exportButton = screen.getByTestId(
      "overlapping-codes-report-export-btn"
    );
    expect(exportButton).toBeDisabled();
  });

  it("should render pagination when there are overlapping codes", () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );
    const reportsContainer = screen.getByTestId(
      "overlapping-codes-report-contents"
    );
    const pagination = within(reportsContainer).queryByText("Items per page");
    expect(pagination).toBeInTheDocument();
  });

  it("handles limit change as expected", async () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );
    const limitChangeButton = await screen.findByRole("combobox", {
      expanded: false,
    });
    expect(limitChangeButton).toBeInTheDocument();
    userEvent.click(limitChangeButton);
    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(4);
    userEvent.click(options[1]);
    const tableBody = screen.getByTestId("overlapping-codes-tbl");
    await waitFor(() => {
      expect(tableBody?.querySelectorAll("tbody tr")).toHaveLength(6);
    });
  });

  it("handles page change by next and prev", async () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );
    const nextButton = await screen.findByLabelText("Go to next page");
    userEvent.click(nextButton);
    const previousButton = await screen.findByLabelText("Go to previous page");
    expect(previousButton).toBeInTheDocument();
  });

  it("handles page change by pagination number click", async () => {
    render(
      <OverlappingCodesDialog
        openDialog={true}
        handleClose={mockHandleClose}
        overlappingCodes={mockOverlappingCodes}
      />
    );
    // select second nav item
    const page2 = await screen.findByLabelText("Go to page 2");
    userEvent.click(page2);
    // confirm there are 1 item on page
    const tableBody = screen.getByTestId("overlapping-codes-tbl");
    await waitFor(() => {
      expect(tableBody?.querySelectorAll("tbody tr")).toHaveLength(1);
    });
  });
});
