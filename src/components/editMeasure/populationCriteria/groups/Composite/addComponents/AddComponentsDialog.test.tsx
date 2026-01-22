import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddComponentsDialog from "./AddComponentsDialog";

describe("AddComponentsDialog", () => {
  const onCloseMock = jest.fn();

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
});
