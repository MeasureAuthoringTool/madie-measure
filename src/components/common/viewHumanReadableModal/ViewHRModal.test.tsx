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

describe("View Human Readable Modal component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should display human readable modal", async () => {
    render(<ViewHRModal open={true} onClose={onCloseFn} measureId="" />);
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
  });

  it("should still display human readable modal when it has error", async () => {
    useMeasureServiceApiMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApiError;
    });
    render(
      <ViewHRModal open={true} onClose={onCloseFn} measureId="testMeasureId" />
    );
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
  });

  it("should call onClose when the cancel button is clicked", async () => {
    render(
      <ViewHRModal open={true} onClose={onCloseFn} measureId="testMeasureId" />
    );
    expect(screen.getByTestId("view-hr-modal")).toBeInTheDocument();
    act(() => {
      fireEvent.click(screen.getByTestId("modal-close-btn"));
      expect(onCloseFn).toHaveBeenCalled();
    });
  });
});
