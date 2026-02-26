import * as React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { within } from "@testing-library/dom";
import { Measure, Model } from "@madie/madie-models";
import TransferDialog, {
  TRANSFER_MEASURE_SUCCESS,
  TRANSFER_MEASURE_FAILURE,
} from "./TransferDialog";
import userEvent from "@testing-library/user-event";
import { MeasureServiceApi } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
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
  },
} as Measure;

const mockMeasure2 = {
  id: "TestMeasureId2",
  measureName: "The Measure for Testing 2",
  model: Model.QICORE_6_0_0,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure3 = {
  id: "TestMeasureId3",
  measureName: "The Measure for Testing 3",
  model: Model.QDM_5_6,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure4 = {
  id: "TestMeasureId4",
  measureName: "The Measure for Testing 4",
  model: Model.QICORE,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure5 = {
  id: "TestMeasureId5",
  measureName: "The Measure for Testing 5",
  model: Model.QICORE,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockMeasure6 = {
  id: "TestMeasureId6",
  measureName: "The Measure for Testing 6",
  model: Model.QDM_5_6,
  createdBy: testUser,
  measureSetId: "MeasureSetId",
} as Measure;

const mockTransferMeasuresResponse = jest.fn().mockResolvedValue({
  status: 200,
  data: [],
});
const mockMeasureServiceApi = {
  transferMeasures: mockTransferMeasuresResponse,
} as unknown as MeasureServiceApi;

describe("Transfer Measures Dialog component", () => {
  const { getByTestId, findByLabelText, findAllByText, getByRole } = screen;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
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
        setStatusHandler={jest.fn()}
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
        setStatusHandler={jest.fn()}
      />
    );

    expect(getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();

    await checkDataRows(5);

    const page2 = await findByLabelText("Go to page 2");
    userEvent.click(page2);
    // confirm there are 1 item on page
    const tableBody = getByTestId("transfer-measure-tbl-body");
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
        setStatusHandler={jest.fn()}
      />
    );
    expect(getByTestId("transfer-measure-tbl")).toBeInTheDocument();
    expect(getByTestId("transfer-dialog")).toBeInTheDocument();

    // change limit
    const [combobox] = await findAllByText("5");
    userEvent.click(combobox);
    const pageLimit10 = getByRole("option", {
      name: /10/i,
    });
    userEvent.click(pageLimit10);
    await checkDataRows(6);
  });

  it("test handle submit successfully", async () => {
    const submitMock = jest.fn();
    render(
      <TransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={submitMock}
        setStatusHandler={jest.fn()}
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

    act(() => {
      userEvent.click(transferBtn);
    });

    await waitFor(() => {
      expect(mockMeasureServiceApi.transferMeasures).toBeCalledWith(
        [mockMeasure1.id],
        "newUser",
        false
      );
      expect(submitMock).toHaveBeenCalledWith({
        toastType: "success",
        toastMessage: TRANSFER_MEASURE_SUCCESS,
        toastOpen: true,
      });
    });
  });

  it("should handle partial transfer (207)", async () => {
    // Have 3 measures, fail 2 of them
    const measures = [mockMeasure1, mockMeasure2, mockMeasure3];
    const failedMeasureIds = [mockMeasure1.id, mockMeasure3.id];

    // Mock API to return 207 with the 2 failed measure IDs
    mockTransferMeasuresResponse.mockResolvedValue({
      status: 207,
      data: failedMeasureIds,
    });

    const setStatusHandlerMock = jest.fn();
    const onCloseMock = jest.fn();

    render(
      <TransferDialog
        measures={measures}
        open={true}
        onClose={onCloseMock}
        setStatusHandler={setStatusHandlerMock}
      />
    );

    const transferBtn = screen.getByTestId("transfer-save-button");
    const newHarpIdInput = screen.getByTestId("harp-id-input");

    expect(transferBtn).toBeInTheDocument();
    expect(transferBtn).toBeDisabled();

    fireEvent.change(newHarpIdInput, { target: { value: "newUser" } });

    expect(transferBtn).toBeEnabled();

    fireEvent.click(transferBtn);

    await waitFor(() => {
      // Verify API call
      expect(mockTransferMeasuresResponse).toHaveBeenCalledWith(
        measures.map((m) => m.id),
        "newUser",
        false
      );

      // Verify warning status with 2 failed measures
      expect(setStatusHandlerMock).toHaveBeenCalledWith({
        warning: {
          status: true,
          primaryMessage: `2 Measures could not be transferred. Please try again, or contact help desk if the issue persists.`,
          secondaryMessages: expect.arrayContaining([
            mockMeasure1.measureName,
            mockMeasure3.measureName,
          ]),
        },
      });

      // Verify dialog closes without toast
      expect(onCloseMock).toHaveBeenCalledWith({
        toastType: "success",
        toastOpen: false,
      });
    });
  });

  it("test handle submit failure", async () => {
    mockMeasureServiceApi.transferMeasures = jest
      .fn()
      .mockRejectedValue(new Error(TRANSFER_MEASURE_FAILURE));

    const submitMock = jest.fn();
    render(
      <TransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={submitMock}
        setStatusHandler={jest.fn()}
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

    act(() => {
      userEvent.click(transferBtn);
    });

    await waitFor(() => {
      expect(mockMeasureServiceApi.transferMeasures).toBeCalledWith(
        [mockMeasure1.id],
        "newUser",
        false
      );
      expect(submitMock).toHaveBeenCalledWith({
        toastType: "danger",
        toastMessage: TRANSFER_MEASURE_FAILURE,
        toastOpen: true,
      });
    });
  });
});
