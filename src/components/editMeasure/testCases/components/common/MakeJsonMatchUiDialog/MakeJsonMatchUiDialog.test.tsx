import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MakeJsonMatchUiDialog from "./MakeJsonMatchUiDialog";
import useTestCaseServiceApi from "../../../api/useTestCaseServiceApi";
import { TestCase } from "@madie/madie-models";

jest.mock("../../../api/useTestCaseServiceApi");
const mockTestCaseServiceApi = useTestCaseServiceApi as jest.Mock;

const mockUpdateQiCoreJsonWithGroupAndTitle = jest.fn();

describe("MakeJsonMatchUiDialog", () => {
  const mockOnClose = jest.fn();
  const mockSetUpdateQiCoreJsonWithGroupAndTitleWarning = jest.fn();
  const mockSetShiftTestCaseDatesWarnings = jest.fn();
  const mockSetWarnings = jest.fn();
  const mockSetToastMessage = jest.fn();
  const mockSetToastType = jest.fn();
  const mockSetToastOpen = jest.fn();

  const mockTestCases: TestCase[] = [
    { id: "tc1", title: "Test 1" } as TestCase,
    { id: "tc2", title: "Test 2" } as TestCase,
    { id: "tc3", title: "Test 3" } as TestCase,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockTestCaseServiceApi.mockReturnValue({
      updateQiCoreJsonWithGroupAndTitle: mockUpdateQiCoreJsonWithGroupAndTitle,
    });
  });

  const renderDialog = (props = {}) => {
    return render(
      <MakeJsonMatchUiDialog
        open={true}
        onClose={mockOnClose}
        selectedTestCases={mockTestCases}
        measureId="measure123"
        selectedTestCaseCount={3}
        setUpdateQiCoreJsonWithGroupAndTitleWarning={
          mockSetUpdateQiCoreJsonWithGroupAndTitleWarning
        }
        setShiftTestCaseDatesWarnings={mockSetShiftTestCaseDatesWarnings}
        setWarnings={mockSetWarnings}
        setToastMessage={mockSetToastMessage}
        setToastType={mockSetToastType}
        setToastOpen={mockSetToastOpen}
        {...props}
      />
    );
  };

  it("renders the dialog with correct content", () => {
    renderDialog();

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(
      screen.getByText(/For each of the selected 3 test cases/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Set all "family" fields in the JSON/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Set all "given" fields in the JSON/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to proceed?")
    ).toBeInTheDocument();
  });

  it("renders cancel and continue buttons", () => {
    renderDialog();

    expect(
      screen.getByTestId("make-json-match-ui-cancel-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("make-json-match-ui-continue-button")
    ).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", async () => {
    renderDialog();

    const cancelButton = screen.getByTestId("make-json-match-ui-cancel-button");
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it("shows success toast when all test cases are updated successfully", async () => {
    mockUpdateQiCoreJsonWithGroupAndTitle.mockResolvedValue({
      failed: [],
      updated: ["tc1", "tc2", "tc3"],
    });

    renderDialog();

    const continueButton = screen.getByTestId(
      "make-json-match-ui-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSetToastType).toHaveBeenCalledWith("success");
      expect(mockSetToastMessage).toHaveBeenCalledWith(
        "All family and given fields have been set for the selected test cases"
      );
      expect(mockSetToastOpen).toHaveBeenCalledWith(true);
      expect(
        mockSetUpdateQiCoreJsonWithGroupAndTitleWarning
      ).toHaveBeenCalledWith([]);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("sets warnings when some test cases fail", async () => {
    mockUpdateQiCoreJsonWithGroupAndTitle.mockResolvedValue({
      failed: ["tc2"],
      updated: ["tc1", "tc3"],
    });

    renderDialog();

    const continueButton = screen.getByTestId(
      "make-json-match-ui-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSetShiftTestCaseDatesWarnings).toHaveBeenCalledWith([]);
      expect(
        mockSetUpdateQiCoreJsonWithGroupAndTitleWarning
      ).toHaveBeenCalledWith(expect.any(Function));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error toast when all test cases fail", async () => {
    mockUpdateQiCoreJsonWithGroupAndTitle.mockResolvedValue({
      failed: ["tc1", "tc2", "tc3"],
      updated: [],
    });

    renderDialog();

    const continueButton = screen.getByTestId(
      "make-json-match-ui-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSetToastType).toHaveBeenCalledWith("danger");
      expect(mockSetToastMessage).toHaveBeenCalledWith(
        "The operation could not be completed on the selected test cases. Review the JSON to make changes manually."
      );
      expect(mockSetToastOpen).toHaveBeenCalledWith(true);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error toast when API call fails", async () => {
    mockUpdateQiCoreJsonWithGroupAndTitle.mockRejectedValue(
      new Error("API Error")
    );

    renderDialog();

    const continueButton = screen.getByTestId(
      "make-json-match-ui-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSetToastType).toHaveBeenCalledWith("danger");
      expect(mockSetToastMessage).toHaveBeenCalledWith(
        "The operation could not be completed on the selected test cases. Review the JSON to make changes manually."
      );
      expect(mockSetToastOpen).toHaveBeenCalledWith(true);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("does not call API when no test cases are selected", async () => {
    renderDialog({ selectedTestCases: [] });

    const continueButton = screen.getByTestId(
      "make-json-match-ui-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUpdateQiCoreJsonWithGroupAndTitle).not.toHaveBeenCalled();
    });
  });

  it("calls API with correct test case IDs", async () => {
    mockUpdateQiCoreJsonWithGroupAndTitle.mockResolvedValue({
      failed: [],
      updated: ["tc1", "tc2", "tc3"],
    });

    renderDialog();

    const continueButton = screen.getByTestId(
      "make-json-match-ui-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockUpdateQiCoreJsonWithGroupAndTitle).toHaveBeenCalledWith(
        ["tc1", "tc2", "tc3"],
        "measure123"
      );
    });
  });
});
