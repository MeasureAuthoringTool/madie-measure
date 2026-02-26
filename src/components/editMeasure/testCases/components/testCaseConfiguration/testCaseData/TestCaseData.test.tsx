import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../api/ServiceContext";
import { QdmExecutionContextProvider } from "../../routes/qdm/QdmExecutionContext";
import TestCaseData from "./TestCaseData";
import { Measure, TestCase } from "@madie/madie-models";
// @ts-ignore
import {
  checkUserCanEdit,
  measureStore,
  useFeatureFlags,
} from "@madie/madie-util";
import userEvent from "@testing-library/user-event";
import useTestCaseServiceApi, {
  TestCaseServiceApi,
  SHIFT_TEST_CASE_DATES_ERROR,
  SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED,
} from "../../../api/useTestCaseServiceApi";
import { act } from "react-dom/test-utils";

const mockServiceConfig = {
  measureService: { baseUrl: "measure.url" },
  testCaseService: { baseUrl: "testcase.url" },
  terminologyService: { baseUrl: "terminology.url" },
  qdmElmTranslationService: { baseUrl: "qdm-translator.url" },
  fhirElmTranslationService: { baseUrl: "fhir-translator.url" },
  excelExportService: { baseUrl: "excel-export.com" },
} as ServiceConfig;

const measure = {
  id: "m1234",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  model: "QDM v5.6",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
  testCases: [
    {
      id: "t1234",
      json: "date1",
    },
  ] as TestCase[],
} as unknown as Measure;

const qiCoreMeasure = { ...measure, model: "QI-Core v4.1.1" } as Measure;

const responseDto = {
  failed: [],
  shifted: ["1234"],
};

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => measure),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useFeatureFlags: jest.fn().mockReturnValue({
    Locking: false,
  }),
}));

const setExecutionContextReady = jest.fn();
const mockShiftTestCaseDatesWarning = jest.fn();

// mocking testCaseService
jest.mock("../../../api/useTestCaseServiceApi");
const useTestCaseServiceMock =
  useTestCaseServiceApi as jest.Mock<TestCaseServiceApi>;

function renderTestCaseDataComponent() {
  return render(
    <ApiContextProvider value={mockServiceConfig}>
      <QdmExecutionContextProvider
        value={{
          measureState: [null, jest.fn()],
          cqmMeasureState: [null, jest.fn()],
          executionContextReady: true,
          setExecutionContextReady: setExecutionContextReady,
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
        }}
      >
        <TestCaseData
          errors={[]}
          warnings={[]}
          setErrors={() => {}}
          setImportWarnings={() => {}}
          setShiftTestCaseDatesWarnings={mockShiftTestCaseDatesWarning}
        />
      </QdmExecutionContextProvider>
    </ApiContextProvider>
  );
}
describe("TestCaseData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkUserCanEdit as jest.Mock).mockImplementation(() => true);
    measureStore.state.mockImplementation(() => measure);
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: false,
    }));
  });

  it("should render Test Case Data component with action buttons", () => {
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "3");
    expect(shiftTestCaseDatesInput.value).toBe("3");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();
  });

  // Unable to stimulate Down Arrow keyboard action
  it.skip("should update the input value by using arrow keys", async () => {
    renderTestCaseDataComponent();

    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    // shiftTestCaseDatesInput.focus();
    // userEvent.keyboard("{ArrowDown}");
    // Simulate.keyDown(shiftTestCaseDatesInput, {
    //   key: "ArrowDown",
    //   // code: "ArrowDown",
    //   // keyCode: 40,
    // });
    // userEvent.keyboard("{arrowdown}");
    userEvent.type(shiftTestCaseDatesInput, "3");
    // await fireEvent.keyPress(shiftTestCaseDatesInput, { key: "ArrowDown" });
    expect(shiftTestCaseDatesInput.value).toBe("-1");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();
  });

  it("should allow negative numbers to be entered", () => {
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "-3");
    expect(shiftTestCaseDatesInput.value).toBe("-3");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();
  });

  it("should display error message when a invalid integer is entered", async () => {
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "-3-5");
    expect(shiftTestCaseDatesInput.value).toBe("");
    expect(saveButton).not.toBeEnabled();
    expect(discardButton).not.toBeEnabled();
    userEvent.tab();
    expect(
      await screen.findByTestId(
        "integer-field-shift-test-case-dates-helper-text"
      )
    ).toHaveTextContent("Must be a valid number of years");
  });

  it("should display discard dialog and clear out form when confirmed", () => {
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    userEvent.click(discardButton);

    const YesDiscardButton = screen.getByRole("button", {
      name: "Yes, Discard All Changes",
    });

    userEvent.click(YesDiscardButton);
    expect(shiftTestCaseDatesInput.value).toBe("");
  });

  it("should display discard dialog and does not clear out form when denied", () => {
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    userEvent.click(discardButton);

    const CancelDiscardButton = screen.getByRole("button", {
      name: "No, Keep Working",
    });

    userEvent.click(CancelDiscardButton);
    expect(shiftTestCaseDatesInput.value).toBe("5");
  });

  it("should successfully shift all test case dates", async () => {
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockResolvedValueOnce(responseDto);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQdmTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("shift-all-test-case-dates-success-text")
      ).toHaveTextContent("All Test Case dates successfully shifted.");
      userEvent.click(screen.getByTestId("ClearIcon"));
      expect(
        screen.queryByTestId("shift-all-test-case-dates-success-text")
      ).not.toBeInTheDocument();
    });
  });

  it("should display an error message when unable to shift all test case dates", async () => {
    const shiftAllTestCaseDatesApiMock = jest.fn().mockRejectedValueOnce({
      response: {
        data: {
          message: "something went wrong",
        },
      },
    });
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQdmTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });
    await waitFor(() =>
      expect(mockShiftTestCaseDatesWarning.mock.calls).toHaveLength(1)
    );
  });

  it("should display disabled state of the form when user doesn't have authorization to edit", () => {
    (checkUserCanEdit as jest.Mock).mockClear().mockImplementation(() => {
      return false;
    });
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("textbox", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).toHaveAttribute("readonly");
    expect(shiftTestCaseDatesInput).toHaveValue("-");

    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });

  it("should display disabled state when no patient are found for the measure", () => {
    measureStore.state.mockImplementationOnce(() => {
      return {
        ...measure,
        testCases: [],
      };
    });
    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("textbox", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).toHaveAttribute("readonly");
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();
  });

  it("should successfully shift all test case dates for QICore", async () => {
    measureStore.state.mockImplementationOnce(() => qiCoreMeasure);

    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockResolvedValueOnce(responseDto);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQiCoreTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;

    //const shiftTestCaseDatesInput = screen.getByTestId("shift-test-case-dates-input");
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("shift-all-test-case-dates-success-text")
      ).toHaveTextContent("All Test Case dates successfully shifted.");
      userEvent.click(screen.getByTestId("ClearIcon"));
      expect(
        screen.queryByTestId("shift-all-test-case-dates-success-text")
      ).not.toBeInTheDocument();
    });
  });

  it("should display an error message when unable to shift all test case dates for QICore", async () => {
    measureStore.state.mockImplementationOnce(() => qiCoreMeasure);
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockRejectedValueOnce(new Error(SHIFT_TEST_CASE_DATES_ERROR));
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQiCoreTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("shift-all-test-case-dates-generic-error-text")
      ).toHaveTextContent(SHIFT_TEST_CASE_DATES_ERROR)
    );
  });

  it("should successfully shift all test case dates when feature flag is on", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockResolvedValueOnce(responseDto);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQdmTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(
        screen.getByTestId("shift-all-test-case-dates-success-text")
      ).toHaveTextContent("All Test Case dates successfully shifted.");
      userEvent.click(screen.getByTestId("ClearIcon"));
      expect(
        screen.queryByTestId("shift-all-test-case-dates-success-text")
      ).not.toBeInTheDocument();
    });
  });

  it("should successfully shift all test case dates with failed test cases", async () => {
    measureStore.state.mockImplementationOnce(() => qiCoreMeasure);
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const failedResponseDto = {
      failed: ["1234"],
      shifted: [],
    };
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockResolvedValueOnce(failedResponseDto);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQiCoreTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(mockShiftTestCaseDatesWarning.mock.calls).toHaveLength(1)
    );
  });

  it("should display an error message when unable to shift all test case dates when feature flag is on", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED)
      );
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQdmTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(mockShiftTestCaseDatesWarning.mock.calls).toHaveLength(0)
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("shift-all-test-case-dates-generic-error-text")
      ).toHaveTextContent(SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED)
    );
  });

  it("should display an error message when unable to shift all test case dates due to locking for qicore", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      Locking: true,
    }));
    measureStore.state.mockImplementationOnce(() => qiCoreMeasure);

    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockRejectedValueOnce(
        new Error(SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED)
      );
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQiCoreTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });
    const discardButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(shiftTestCaseDatesInput).not.toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(discardButton).toBeDisabled();

    userEvent.type(shiftTestCaseDatesInput, "5");

    expect(shiftTestCaseDatesInput.value).toBe("5");
    expect(saveButton).toBeEnabled();
    expect(discardButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(mockShiftTestCaseDatesWarning.mock.calls).toHaveLength(0)
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("shift-all-test-case-dates-generic-error-text")
      ).toHaveTextContent(SHIFT_TEST_CASE_DATES_ERROR_TEST_CASE_LOCKED)
    );
  });

  it("should handle QDM response with failed test cases", async () => {
    const failedResponseDto = {
      failed: ["Test case 1 failed to shift", "Test case 2 failed to shift"],
      shifted: ["1234"],
    };
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockResolvedValueOnce(failedResponseDto);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQdmTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });

    userEvent.type(shiftTestCaseDatesInput, "5");
    expect(saveButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(mockShiftTestCaseDatesWarning.mock.calls).toHaveLength(1)
    );
    expect(mockShiftTestCaseDatesWarning).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it("should handle QI-Core response with failed test cases", async () => {
    measureStore.state.mockImplementationOnce(() => qiCoreMeasure);
    const failedResponseDto = {
      failed: ["Test case 1 failed to shift", "Test case 2 failed to shift"],
      shifted: ["1234"],
    };
    const shiftAllTestCaseDatesApiMock = jest
      .fn()
      .mockResolvedValueOnce(failedResponseDto);
    useTestCaseServiceMock.mockImplementationOnce(() => {
      return {
        shiftAllQiCoreTestCaseDates: shiftAllTestCaseDatesApiMock,
      } as unknown as TestCaseServiceApi;
    });

    renderTestCaseDataComponent();
    const shiftTestCaseDatesInput = screen.getByRole("spinbutton", {
      name: "Shift Test Case Dates",
    }) as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Save" });

    userEvent.type(shiftTestCaseDatesInput, "5");
    expect(saveButton).toBeEnabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(mockShiftTestCaseDatesWarning.mock.calls).toHaveLength(1)
    );
    expect(mockShiftTestCaseDatesWarning).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });
});
