import * as React from "react";
import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import ShiftDatesDialog from "./ShiftDatesDialog";
import { TestCase } from "@madie/madie-models";

const testCases = [
  {
    title: "test case 1 title",
    series: "test case 1 series",
  },
  {
    title: "test case 2 title",
    series: "test case 2 series",
  },
] as TestCase[];

describe("Shift Test Case Dates Dialog", () => {
  test("should render ShiftDatesDialog", async () => {
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={jest.fn}
          canEdit={true}
          testCases={testCases}
        />
      );

      expect(await findByTestId("shift-dates-dialog")).toBeInTheDocument();
      expect(
        await findByTestId("shift-dates-selected-test-cases")
      ).toBeInTheDocument();
      expect(
        await findByTestId("test case 1 series - test case 1 title")
      ).toBeInTheDocument();
      expect(
        await findByTestId("test case 2 series - test case 2 title")
      ).toBeInTheDocument();
      expect(
        await findByTestId("shift-dates-number-input")
      ).toBeInTheDocument();

      const cancelBtn = await findByTestId("shift-dates-cancel-button");
      expect(cancelBtn).toBeInTheDocument();
      expect(cancelBtn).toBeEnabled();

      const saveBtn = await findByTestId("shift-dates-save-button");
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn).not.toBeEnabled();
    });
  });

  test("Save button enabled when user fills in shift dates input", async () => {
    const onClose = jest.fn();
    const onTestCaseShiftDates = jest.fn();
    await act(async () => {
      const { findByTestId, queryByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          onTestCaseShiftDates={onTestCaseShiftDates}
        />
      );

      const shiftDatesInput = (await findByTestId(
        "shift-dates-input"
      )) as HTMLInputElement;
      expect(shiftDatesInput).toBeInTheDocument();

      const saveBtn = await findByTestId("shift-dates-save-button");
      expect(saveBtn).toBeInTheDocument();
      expect(saveBtn).not.toBeEnabled();

      userEvent.type(shiftDatesInput, "1");
      expect(shiftDatesInput.value).toBe("1");
      expect(saveBtn).toBeEnabled();

      userEvent.click(saveBtn);

      await waitFor(() => {
        expect(onClose).toBeCalledTimes(1);
        expect(onTestCaseShiftDates).toBeCalledTimes(1);
      });
    });
  });
});
