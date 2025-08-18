import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/dom";
import { Measure, MeasureMetadata } from "@madie/madie-models";
import TransferDialog from "./TransferDialog";
// import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";

const testUser = "test user";
const mockMeasure1 = {
  id: "TestMeasureId1",
  measureName: "The Measure for Testing 1",
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure2 = {
  id: "TestMeasureId2",
  measureName: "The Measure for Testing 2",
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure3 = {
  id: "TestMeasureId3",
  measureName: "The Measure for Testing 3",
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure4 = {
  id: "TestMeasureId1",
  measureName: "The Measure for Testing 4",
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure5 = {
  id: "TestMeasureId5",
  measureName: "The Measure for Testing 5",
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure6 = {
  id: "TestMeasureId1",
  measureName: "The Measure for Testing 6",
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

describe("Transfer Measures Dialog component", () => {
  const { getByTestId, findAllByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();
  });

  const checkDataRows = async (number: number) => {
    const tableBody = getByTestId("transfer-measure-tbl-body");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(number);
    });
  };

  it("should render transfer dialog", async () => {
    render(
      <TransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();
    await checkDataRows(1);
  });

  it("should handle page change", async () => {
    render(
      <TransferDialog
        measures={[
          mockMeasure1,
          mockMeasure2,
          mockMeasure3,
          mockMeasure4,
          mockMeasure5,
          mockMeasure6,
        ]}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();

    await checkDataRows(5);

    const page2 = await screen.findByLabelText("Go to page 2");
    userEvent.click(page2);
    // confirm there are 1 item on page
    const tableBody = screen.getByTestId("transfer-measure-tbl-body");
    await waitFor(() => {
      expect(tableBody?.querySelectorAll("tbody tr")).toHaveLength(1);
    });
  });

  it("should handle limit change", async () => {
    render(
      <TransferDialog
        measures={[
          mockMeasure1,
          mockMeasure2,
          mockMeasure3,
          mockMeasure4,
          mockMeasure5,
          mockMeasure6,
        ]}
        open={true}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();

    // change limit
    const [combobox] = await screen.findAllByText("5");
    userEvent.click(combobox);
    const pageLimit10 = screen.getByRole("option", {
      name: /10/i,
    });
    userEvent.click(pageLimit10);
    await checkDataRows(6);
  });

  it("test handle submit", async () => {
    render(
      <TransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={jest.fn()}
      />
    );
    await checkDataRows(1);

    const newHarpIdInput = getByTestId("harp-id-input");
    expect(newHarpIdInput).toBeInTheDocument();
    expect(newHarpIdInput.value).toBe("");
    const transferBtn = getByTestId("transfer-save-button");
    expect(transferBtn).toBeInTheDocument();
    expect(transferBtn).toBeDisabled();

    fireEvent.change(newHarpIdInput, {
      target: { value: "newUser" },
    });
    expect(newHarpIdInput.value).toBe("newUser");
    expect(transferBtn).toBeEnabled();

    userEvent.click(transferBtn);
  });
});
