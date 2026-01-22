import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddComponentsDialog from "./AddComponentsDialog";

describe("AddComponentsDialog", () => {
  const onCloseMock = jest.fn();

  const data = [
    {
      id: "1",
      measureName: "Test Measure",
      version: "1.0.0",
      measureSet: { cmsId: "CMS123" },
      lastModifiedAt: "2024-01-01",
    },
    {
      id: "2",
      measureName: "Another Measure",
      version: "2.0.0",
      measureSet: { cmsId: "CMS456" },
      lastModifiedAt: "2024-02-01",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dialog with correct title and buttons when open", () => {
    render(<AddComponentsDialog open={true} onClose={onCloseMock} />);
    expect(
      screen.getByText("Select Composite Measure Components")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-composite-measure-components-cancel-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("select-composite-measure-components-continue-button")
    ).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    render(<AddComponentsDialog open={true} onClose={onCloseMock} />);
    await userEvent.click(
      screen.getByTestId("select-composite-measure-components-cancel-button")
    );
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("calls onClose when dialog is closed", async () => {
    render(<AddComponentsDialog open={true} onClose={onCloseMock} />);
    await userEvent.click(
      screen.getByTestId("select-composite-measure-components-cancel-button")
    );
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it("renders table headers correctly", () => {
    render(<AddComponentsDialog open={true} onClose={onCloseMock} />);
    expect(
      screen.getByRole("columnheader", { name: /measure name/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /version/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /cms id/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: /updated/i })
    ).toBeInTheDocument();
  });

  it("does not render table rows when data is empty", () => {
    render(<AddComponentsDialog open={true} onClose={onCloseMock} />);
    const rows = screen.queryAllByRole("row");
    expect(rows.length).toBe(1);
  });

  it("renders correctly when closed", () => {
    render(<AddComponentsDialog open={false} onClose={onCloseMock} />);
    expect(
      screen.queryByText("Select Composite Measure Components")
    ).not.toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    const { container } = render(
      <AddComponentsDialog open={false} onClose={onCloseMock} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders TruncateText for all columns when data is provided", () => {
    render(
      <AddComponentsDialog open={true} onClose={onCloseMock} data={data} />
    );

    expect(screen.getByTestId("measure-name-1-content")).toHaveTextContent(
      "Test Measure"
    );
    expect(screen.getByTestId("measure-version-1-content")).toHaveTextContent(
      "1.0.0"
    );
    expect(screen.getByTestId("measure-cmsId-1-content")).toHaveTextContent(
      "CMS123"
    );
    expect(
      screen.getByTestId("measure-lastModifiedAt-1-content")
    ).toBeInTheDocument();
  });

  it("renders select column checkboxes for each row", () => {
    render(
      <AddComponentsDialog open={true} onClose={onCloseMock} data={data} />
    );

    const rowCheckboxes = screen.getAllByRole("checkbox", {
      name: "",
    });
    expect(rowCheckboxes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders header select checkbox and toggles all rows", async () => {
    render(
      <AddComponentsDialog open={true} onClose={onCloseMock} data={data} />
    );

    const headerCheckbox = screen.getByRole("checkbox", {
      name: "Test Case Selection",
    });
    expect(headerCheckbox).toBeInTheDocument();

    await userEvent.click(headerCheckbox);

    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "" });
    rowCheckboxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  it("renders row checkbox as indeterminate when some rows are selected", async () => {
    render(
      <AddComponentsDialog open={true} onClose={onCloseMock} data={data} />
    );

    const rowCheckboxes = screen.getAllByRole("checkbox", { name: "" });
    await userEvent.click(rowCheckboxes[1]);

    const headerCheckbox = screen.getByRole("checkbox", {
      name: "Test Case Selection",
    });
    expect((headerCheckbox as HTMLInputElement).indeterminate).toBe(true);
  });
});
