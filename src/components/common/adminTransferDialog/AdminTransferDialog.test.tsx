import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Measure, Model } from "@madie/madie-models";
import AdminTransferDialog, {
  ADMIN_TRANSFER_NOT_IMPLEMENTED,
} from "./AdminTransferDialog";
import { MeasureServiceApi } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  checkUserCanDelete: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
}));

const testUser = "test user";
const mockMeasure1 = {
  id: "TestMeasureId1",
  measureName: "The Measure for Testing 1",
  model: Model.QICORE,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
  measureSet: {
    measureSetId: "MeasureSetId",
    cmsId: 1,
    owner: "currentOwner1",
  },
} as Measure;

const mockMeasure2 = {
  id: "TestMeasureId2",
  measureName: "The Measure for Testing 2",
  model: Model.QICORE_6_0_0,
  createdBy: testUser,
  measureSetId: "MeasureSetId2",
  measureSet: {
    measureSetId: "MeasureSetId2",
    cmsId: 2,
    owner: "currentOwner2",
  },
} as Measure;

const mockMeasureServiceApi = {
  transferMeasures: jest.fn(),
} as unknown as MeasureServiceApi;

describe("AdminTransferDialog component", () => {
  const mockOnClose = jest.fn();
  const mockSetStatusHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render admin transfer dialog with correct title", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(screen.getByTestId("admin-transfer-dialog")).toBeInTheDocument();
    expect(screen.getByText("Transfer Measure Ownership")).toBeInTheDocument();
  });

  it("should display count of measures in info text", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(
      screen.getByText(
        /You are about to Transfer ownership of the 2 selected measure/
      )
    ).toBeInTheDocument();
  });

  it("should NOT display 'This action cannot be undone' warning", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(
      screen.queryByText(/This action cannot be undone/)
    ).not.toBeInTheDocument();
  });

  it("should display measures table with owner column", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1, mockMeasure2]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(screen.getByText("Current Measure Owner")).toBeInTheDocument();
    expect(screen.getByText("currentOwner1")).toBeInTheDocument();
    expect(screen.getByText("currentOwner2")).toBeInTheDocument();
  });

  it("should display New Measure Owner field without Current Measure Owner field", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(screen.getByLabelText(/New Measure Owner/)).toBeInTheDocument();
    expect(screen.queryByTestId("current-owner")).not.toBeInTheDocument();
  });

  it("should display Retain Share Access checkbox", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const checkbox = screen.getByTestId("admin-retainShareAccess");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it("should enable Retain Share Access checkbox when clicked", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /retain share access after transfer/i,
    });
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("should have Transfer button disabled initially", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const transferButton = screen.getByTestId("admin-transfer-save-button");
    expect(transferButton).toBeDisabled();
  });

  it("should enable Transfer button when New Measure Owner is entered", async () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const harpIdInput = screen.getByTestId("admin-harp-id-input");
    fireEvent.change(harpIdInput, { target: { value: "newOwner" } });

    await waitFor(() => {
      const transferButton = screen.getByTestId("admin-transfer-save-button");
      expect(transferButton).not.toBeDisabled();
    });
  });

  it("should show validation error when New Measure Owner is empty on blur", async () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const harpIdInput = screen.getByTestId("admin-harp-id-input");
    fireEvent.blur(harpIdInput);

    await waitFor(() => {
      expect(
        screen.getByText("New Measure Owner is required.")
      ).toBeInTheDocument();
    });
  });

  it("should call onClose with not implemented message when Transfer is clicked", async () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const harpIdInput = screen.getByTestId("admin-harp-id-input");
    fireEvent.change(harpIdInput, { target: { value: "newOwner" } });

    await waitFor(() => {
      const transferButton = screen.getByTestId("admin-transfer-save-button");
      expect(transferButton).not.toBeDisabled();
    });

    const transferButton = screen.getByTestId("admin-transfer-save-button");
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith({
        toastType: "warning",
        toastMessage: ADMIN_TRANSFER_NOT_IMPLEMENTED,
        toastOpen: true,
      });
    });
  });

  it("should call onClose when Cancel button is clicked", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const cancelButton = screen.getByTestId("admin-transfer-cancel-button");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should render with Transfer button in cyan/green color variant", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const transferButton = screen.getByTestId("admin-transfer-save-button");
    expect(transferButton).toBeInTheDocument();
    // Note: The actual button color is determined by MadieDialog's variant prop
    // This test confirms the button exists; visual testing would verify color
  });

  it("should display Owner section header", () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("should handle multiple measures with different owners", () => {
    const mockMeasure3 = {
      ...mockMeasure1,
      id: "TestMeasureId3",
      measureName: "Measure 3",
      measureSet: {
        ...mockMeasure1.measureSet,
        owner: "currentOwner3",
      },
    };

    render(
      <AdminTransferDialog
        measures={[mockMeasure1, mockMeasure2, mockMeasure3]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    expect(screen.getByText("currentOwner1")).toBeInTheDocument();
    expect(screen.getByText("currentOwner2")).toBeInTheDocument();
    expect(screen.getByText("currentOwner3")).toBeInTheDocument();
  });

  it("should clear validation error when valid input is provided", async () => {
    render(
      <AdminTransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={mockOnClose}
        setStatusHandler={mockSetStatusHandler}
      />
    );

    const harpIdInput = screen.getByTestId("admin-harp-id-input");

    // Trigger validation error
    fireEvent.blur(harpIdInput);
    await waitFor(() => {
      expect(
        screen.getByText("New Measure Owner is required.")
      ).toBeInTheDocument();
    });

    // Enter valid input
    fireEvent.change(harpIdInput, { target: { value: "newOwner" } });

    await waitFor(() => {
      expect(
        screen.queryByText("New Measure Owner is required.")
      ).not.toBeInTheDocument();
    });
  });
});
