import * as React from "react";
import { render, act, cleanup } from "@testing-library/react";
import { useTestCasePolling } from "./useTestCasePolling";
import axios from "../../../../api/axios-instance";

jest.mock("../../../../api/axios-instance");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockedOnUpdate = jest.fn();
const mockOnError = jest.fn();
const WrapperComponent = ({ shouldStart }: { shouldStart: boolean }) => {
  useTestCasePolling({
    testCaseId: "123",
    measureId: "456",
    shouldStart,
    onUpdate: mockedOnUpdate,
    validateTest: false,
    onError: mockOnError,
  });
  return <div>Polling...</div>;
};
describe("useTestCasePolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    cleanup();
  });

  it("should start polling and call getTestCase every 5 seconds for Pending status", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        validationStatus: "Pending",
        id: "123",
      },
    });

    await act(async () => {
      render(<WrapperComponent shouldStart={true} />);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(4);
  });

  it("should stop polling when status becomes Valid", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { validationStatus: "Pending" } })
      .mockResolvedValueOnce({ data: { validationStatus: "Pending" } })
      .mockResolvedValueOnce({ data: { validationStatus: "Valid" } });

    await act(async () => {
      render(<WrapperComponent shouldStart={true} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
      jest.advanceTimersByTime(5000);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(mockedOnUpdate).toHaveBeenCalledTimes(1);
  });

  it("should stop polling on unmount", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { validationStatus: "Pending" },
    });

    let unmount: any;
    await act(async () => {
      const rendered = render(<WrapperComponent shouldStart={true} />);
      unmount = rendered.unmount;
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    // unmount the component
    await act(async () => {
      unmount();
      jest.advanceTimersByTime(10000);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it("should stop polling if api call fails and returns an error message", async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: { validationStatus: "Pending" } })
      .mockResolvedValueOnce({ data: { validationStatus: "Pending" } })
      .mockRejectedValueOnce(new Error("Unable to retrieve test case object"));
    await act(async () => {
      render(<WrapperComponent shouldStart={true} />);
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
      jest.advanceTimersByTime(5000);
    });

    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(mockedOnUpdate).toHaveBeenCalledTimes(0);
    expect(mockOnError).toHaveBeenCalledWith(
      "Unable to retrieve validation results for the test case, please try again. If the error persists, please contact the help desk."
    );
  });
});
