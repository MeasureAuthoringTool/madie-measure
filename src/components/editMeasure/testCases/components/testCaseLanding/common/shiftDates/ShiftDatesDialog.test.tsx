import * as React from "react";
import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import userEvent from "@testing-library/user-event";
import ShiftDatesDialog from "./ShiftDatesDialog";
import { TestCase, Measure } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";
import useTestCaseServiceApi, {
  TestCaseServiceApi,
  SHIFT_TEST_CASE_DATES_ERROR,
  SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED,
} from "../../../../api/useTestCaseServiceApi";

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useFeatureFlags: jest.fn().mockReturnValue({
    Locking: false,
  }),
}));
jest.mock("../../../../api/useTestCaseServiceApi");
const useTestCaseServiceMock =
  useTestCaseServiceApi as jest.Mock<TestCaseServiceApi>;

const testCases = [
  {
    id: "test-case-1",
    title: "test case 1 title",
    series: "test case 1 series",
  },
  {
    id: "test-case-2",
    title: "test case 2 title",
    series: "test case 2 series",
  },
] as TestCase[];

const measure = {
  id: "m1234",
  measureName: "the measure for testing",
  model: "QDM v5.6",
  testCases: testCases,
} as unknown as Measure;

const qiCoreMeasure = {
  ...measure,
  model: "QI-Core v4.1",
} as unknown as Measure;

describe("Shift Test Case Dates Dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: false,
    }));
  });

  test("should render ShiftDatesDialog", async () => {
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={jest.fn}
          canEdit={true}
          testCases={testCases}
          measure={measure}
          setWarnings={jest.fn()}
          setToastOpen={jest.fn()}
          setToastType={jest.fn()}
          setToastMessage={jest.fn()}
        />
      );

      expect(await findByTestId("shift-dates-dialog")).toBeInTheDocument();
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

  test("Should shift dates for qdm measure and shows success toast", async () => {
    const responseData: string[] = [];
    const shiftQdmTestCaseDates = jest.fn().mockResolvedValueOnce(responseData);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQdmTestCaseDates: shiftQdmTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    await act(async () => {
      const { findByTestId, queryByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={measure}
          setWarnings={jest.fn()}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQdmTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("success");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(
          `All Test Case dates successfully shifted.`
        );
      });
    });
  });

  test("Should shift dates for qdm measure and shows warning", async () => {
    const responseData: string[] = [
      "Warning: Test Case 1 dates could not be shifted.",
    ];
    const shiftQdmTestCaseDates = jest.fn().mockResolvedValueOnce(responseData);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQdmTestCaseDates: shiftQdmTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId, queryByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={measure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQdmTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).not.toBeCalledTimes(1);
        expect(setToastType).not.toBeCalledTimes(1);
        expect(setToastType).not.toBeCalledWith("success");
        expect(setToastMessage).not.toBeCalledTimes(1);
        expect(setToastMessage).not.toBeCalledWith(
          `All Test Case dates successfully shifted.`
        );
        expect(setWarnings).toBeCalledTimes(1);
      });
    });
  });

  test("Should not shift dates for qdm measure and shows error", async () => {
    const shiftQdmTestCaseDates = jest
      .fn()
      .mockRejectedValueOnce(new Error(SHIFT_TEST_CASE_DATES_ERROR));
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQdmTestCaseDates: shiftQdmTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId, queryByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={measure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQdmTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("danger");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(SHIFT_TEST_CASE_DATES_ERROR);
        expect(setWarnings).not.toBeCalledTimes(1);
      });
    });
  });

  test("Should shift dates for qicore measure and show success toast", async () => {
    const responseData: string[] = [];
    const shiftQiCoreTestCaseDates = jest
      .fn()
      .mockResolvedValueOnce(responseData);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQiCoreTestCaseDates: shiftQiCoreTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={qiCoreMeasure}
          setWarnings={jest.fn()}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQiCoreTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("success");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(
          `All Test Case dates successfully shifted.`
        );
      });
    });
  });

  test("Should shift dates for qicore measure and show warning", async () => {
    const responseData: string[] = [
      "Warning: Test Case 1 dates could not be shifted.",
    ];
    const shiftQiCoreTestCaseDates = jest
      .fn()
      .mockResolvedValueOnce(responseData);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQiCoreTestCaseDates: shiftQiCoreTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={qiCoreMeasure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQiCoreTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).not.toBeCalledTimes(1);
        expect(setToastType).not.toBeCalledTimes(1);
        expect(setToastType).not.toBeCalledWith("success");
        expect(setToastMessage).not.toBeCalledTimes(1);
        expect(setToastMessage).not.toBeCalledWith(
          `All Test Case dates successfully shifted.`
        );
        expect(setWarnings).toBeCalledTimes(1);
      });
    });
  });

  test("Should not shift dates for qicore measure and show error toast", async () => {
    const shiftQiCoreTestCaseDates = jest
      .fn()
      .mockRejectedValueOnce(new Error(SHIFT_TEST_CASE_DATES_ERROR));
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQiCoreTestCaseDates: shiftQiCoreTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={qiCoreMeasure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQiCoreTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("danger");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(SHIFT_TEST_CASE_DATES_ERROR);
        expect(setWarnings).not.toBeCalledTimes(1);
      });
    });
  });

  it("should successfully shift all test case dates when feature flag is on", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const shiftTestCaseDatesApiMock = jest.fn().mockResolvedValueOnce([]);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQdmTestCaseDates: shiftTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={measure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftTestCaseDatesApiMock).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("success");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(
          `All Test Case dates successfully shifted.`
        );
        expect(setWarnings).not.toBeCalledTimes(1);
      });
    });
  });

  it("should not shift test case dates when locking failed", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const shiftTestCaseDatesApiMock = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED)
      );
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQdmTestCaseDates: shiftTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={measure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftTestCaseDatesApiMock).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("danger");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(
          SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED
        );
        expect(setWarnings).not.toBeCalledTimes(1);
      });
    });
  });

  it("should display locking error for qicore", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const shiftQiCoreTestCaseDates = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED)
      );
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftQiCoreTestCaseDates: shiftQiCoreTestCaseDates,
      } as unknown as TestCaseServiceApi;
    });

    const onClose = jest.fn();
    const setToastOpen = jest.fn();
    const setToastType = jest.fn();
    const setToastMessage = jest.fn();
    const setWarnings = jest.fn();
    await act(async () => {
      const { findByTestId } = render(
        <ShiftDatesDialog
          open={true}
          onClose={onClose}
          canEdit={true}
          testCases={testCases}
          measure={qiCoreMeasure}
          setWarnings={setWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
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
        expect(shiftQiCoreTestCaseDates).toBeCalledTimes(1);
        expect(setToastOpen).toBeCalledTimes(1);
        expect(setToastType).toBeCalledTimes(1);
        expect(setToastType).toBeCalledWith("danger");
        expect(setToastMessage).toBeCalledTimes(1);
        expect(setToastMessage).toBeCalledWith(
          SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED
        );
        expect(setWarnings).not.toBeCalledTimes(1);
      });
    });
  });
});
