import * as React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExecutionOptions from "./ExecutionOptions";
import { Measure } from "@madie/madie-models";

// Mock measure object
const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  testCaseConfiguration: { executeInvalidTestCases: false },
  measureSet: { owner: "john doe", acls: [] },
} as unknown as Measure;

// Mock API
const mockMeasureServiceApi = {
  updateMeasureTestCaseConfiguration: jest.fn(),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: measure,
    subscribe: () => ({ unsubscribe: () => null }),
  },
  routeHandlerStore: {
    updateRouteHandlerState: jest.fn(),
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
}));

function renderExecutionOptionsComponent() {
  return render(<ExecutionOptions />);
}

describe("ExecutionOptions component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Enabling checkbox enables Save and Discard buttons", async () => {
    renderExecutionOptionsComponent();

    const checkbox = screen.getByTestId("execute-invalid-test-cases");
    expect(checkbox).not.toBeChecked();

    userEvent.click(checkbox);

    const saveButton = screen.getByTestId("execution-options-save");
    expect(saveButton).toBeEnabled();

    const cancelButton = screen.getByTestId("cancel-button");
    expect(cancelButton).toBeEnabled();
  });

  test("Saving after enabling checkbox calls API and shows success toast", async () => {
    mockMeasureServiceApi.updateMeasureTestCaseConfiguration = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });

    renderExecutionOptionsComponent();

    const checkbox = screen.getByTestId("execute-invalid-test-cases");
    userEvent.click(checkbox);
    const saveButton = screen.getByTestId("execution-options-save");
    expect(saveButton).toBeEnabled();

    const cancelButton = screen.getByTestId("cancel-button");
    expect(cancelButton).toBeEnabled();

    userEvent.click(saveButton);
    await waitFor(() =>
      expect(
        mockMeasureServiceApi.updateMeasureTestCaseConfiguration
      ).toBeCalledWith({ executeInvalidTestCases: true }, measure.id)
    );
  });

  test("Saving after enabling checkbox and API fails shows error toast", async () => {
    mockMeasureServiceApi.updateMeasureTestCaseConfiguration = jest
      .fn()
      .mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "failed to update measure" } },
      });

    renderExecutionOptionsComponent();

    const checkbox = screen.getByTestId("execute-invalid-test-cases");
    userEvent.click(checkbox);

    const saveButton = screen.getByTestId("execution-options-save");
    userEvent.click(saveButton);

    await waitFor(() =>
      expect(
        mockMeasureServiceApi.updateMeasureTestCaseConfiguration
      ).toBeCalledWith({ executeInvalidTestCases: true }, measure.id)
    );

    const errorToast = screen.getByTestId(
      "execution-options-generic-error-text"
    );
    expect(errorToast.textContent).toEqual(
      "An error occurred while updating the Test Case Configuration."
    );

    const toastCloseButton = screen.getByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    userEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(errorToast).not.toBeVisible();
    });
  });

  test("Clicking Discard opens discard dialog and resets form", async () => {
    renderExecutionOptionsComponent();

    const checkbox = screen.getByTestId("execute-invalid-test-cases");
    userEvent.click(checkbox);

    const cancelButton = screen.getByTestId("cancel-button");
    userEvent.click(cancelButton);

    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();

    const continueButton = screen.getByTestId("discard-dialog-continue-button");
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(checkbox).not.toBeChecked();
    });
  });

  test("Clicking Discard then Keep Working closes dialog and keeps changes", async () => {
    renderExecutionOptionsComponent();

    const checkbox = screen.getByTestId("execute-invalid-test-cases");
    userEvent.click(checkbox);

    const cancelButton = screen.getByTestId("cancel-button");
    userEvent.click(cancelButton);

    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();

    const discardCancelButton = screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    userEvent.click(discardCancelButton);

    await waitFor(() => {
      expect(discardDialog).not.toBeVisible();
    });
  });
});
