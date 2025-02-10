import { act, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import ViewHRModal from "./ViewHRModal";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";

jest.mock("../../../api/useMeasureServiceApi");
const mockMeasureServiceApi = {
  fetchHumanReadable: jest
    .fn()
    .mockResolvedValueOnce("<html>test human readable</html>"),
} as unknown as MeasureServiceApi;
const mockMeasureServiceApiError = {
  fetchHumanReadable: jest.fn().mockRejectedValueOnce("error"),
} as unknown as MeasureServiceApi;
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

useMeasureServiceApiMock.mockImplementation(() => {
  return mockMeasureServiceApi;
});

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
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument();
    expect(screen.getByText(/Export/i)).toBeInTheDocument();
  });

  it("should still display human readable modal when it has error", async () => {
    useMeasureServiceApiMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApiError;
    });
    renderComponent();
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
  });

  it("should call onClose when the close button is clicked", async () => {
    renderComponent();
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("close-button"));
      expect(onCloseFn).toHaveBeenCalled();
    });
  });

  it("should call onClose when the cancel button is clicked", async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should call exportMeasure when the export button is clicked", async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Export/i));
    expect(exportMeasure).toHaveBeenCalled();
  });
});
