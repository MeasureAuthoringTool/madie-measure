import { act, render, screen } from "@testing-library/react";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import ViewHRModal from "./ViewHRModal";
import { MeasureServiceApi } from "@madie/madie-util";
import userEvent from "@testing-library/user-event";

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
}));

const mockMeasureServiceApi = {
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),

  fetchHumanReadable: jest
    .fn()
    .mockResolvedValueOnce("<html>test human readable</html>")
    .mockRejectedValueOnce("error"),
} as unknown as MeasureServiceApi;

const onCloseFn = jest.fn();
const exportMeasure = jest.fn();

describe("View Human Readable Modal component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <ViewHRModal
        open={true}
        onClose={onCloseFn}
        exportMeasure={exportMeasure}
        measureId="testMeasureId"
      />
    );
  };

  it("should display human readable modal", async () => {
    render(
      <ViewHRModal
        open={true}
        onClose={onCloseFn}
        exportMeasure={exportMeasure}
        measureId=""
      />
    );
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
    expect(screen.getByTestId("close-button")).toBeInTheDocument();
    expect(screen.getByText(/Close/i)).toBeInTheDocument();
    expect(screen.getByText(/Export/i)).toBeInTheDocument();
  });

  it("should still display human readable modal when it has error", async () => {
    renderComponent();
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
  });

  it("should call onClose when the Close button is clicked", async () => {
    renderComponent();
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
    act(() => {
      userEvent.click(screen.getByTestId("close-button"));
      expect(onCloseFn).toHaveBeenCalled();
    });
  });

  it("should call onClose when the Close button is clicked", async () => {
    renderComponent();
    userEvent.click(screen.getByText(/Close/i));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should call exportMeasure for publishing when the export button is clicked", async () => {
    renderComponent();
    userEvent.click(screen.getByText(/Export/i));
    const exportForPublishingButton = await screen.findByRole("button", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);
    expect(exportMeasure).toHaveBeenCalledWith("Error");
  });

  it("should call exportMeasure when the export button is clicked", async () => {
    renderComponent();
    userEvent.click(screen.getByText(/Export/i));
    const exportButton = await screen.findByRole("button", {
      name: "Export",
    });
    userEvent.click(exportButton);
    expect(exportMeasure).toHaveBeenCalledWith("Info");
  });
});
