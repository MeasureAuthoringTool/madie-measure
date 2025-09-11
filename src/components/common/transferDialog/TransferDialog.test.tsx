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
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";

jest.mock("../../../api/useMeasureServiceApi");
const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

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
  success: true,
  message: "Measures transferred successfully",
});
const mockMeasureServiceApi = {
  transferMeasures: mockTransferMeasuresResponse,
} as unknown as MeasureServiceApi;

describe("Transfer Measures Dialog component", () => {
  const { getByTestId, findByLabelText, findAllByText, getByRole } = screen;

  beforeEach(() => {
    jest.resetModules();
    useMeasureServiceMock.mockImplementation(() => {
      return mockMeasureServiceApi;
    });
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

  it("test handle submit failure", async () => {
    const mockMeasureServiceApiRejected = {
      transferMeasures: jest
        .fn()
        .mockRejectedValue(new Error(TRANSFER_MEASURE_FAILURE)),
    } as unknown as MeasureServiceApi;
    useMeasureServiceMock.mockImplementation(() => {
      return mockMeasureServiceApiRejected;
    });

    const submitMock = jest.fn();
    render(
      <TransferDialog
        measures={[mockMeasure1]}
        open={true}
        onClose={submitMock}
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
      expect(mockMeasureServiceApiRejected.transferMeasures).toBeCalledWith(
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
