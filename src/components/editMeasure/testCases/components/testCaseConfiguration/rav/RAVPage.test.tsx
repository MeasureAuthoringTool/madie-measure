import * as React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import RAVPage from "./RAVPage";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";

const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

jest.mock("../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
let serviceApiMock: MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
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
}));

const setExecutionContextReady = jest.fn();

function renderRavPageComponent() {
  return render(
    <RAVPage setExecutionContextReady={setExecutionContextReady} />
  );
}

describe("RAVPage component", () => {
  const { getByTestId, findByTestId, getByText, getByLabelText } = screen;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Changes to Test Case Configuration enables Save button and saving successfully displays success toast", async () => {
    serviceApiMock = {
      updateMeasureTestCaseConfiguration: jest
        .fn()
        .mockResolvedValueOnce({ status: 200 }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    renderRavPageComponent();

    const ravOptionYes = screen.getByRole("radio", { name: "Yes" });
    const ravOptionNo = screen.getByRole("radio", { name: "No" });

    userEvent.click(getByLabelText("No"));

    await waitFor(() => {
      expect(ravOptionYes).not.toBeChecked();
      expect(ravOptionNo).toBeChecked();
    });

    const saveButton = getByTestId("rav-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    userEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasureTestCaseConfiguration).toBeCalledWith(
        { ravIncluded: false },
        measure.id
      )
    );

    const successToast = getByTestId("edit-rav-success-text");
    expect(successToast.textContent).toEqual(
      "Test Case Configuration Updated Successfully"
    );

    const toastCloseButton = await findByTestId("close-toast-button");
    expect(toastCloseButton).toBeInTheDocument();
    userEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("Changes to Test Case Configuration enables Save button but fails to save successfully and displays error toast", async () => {
    serviceApiMock = {
      updateMeasureTestCaseConfiguration: jest.fn().mockRejectedValueOnce({
        status: 500,
        response: { data: { message: "failed to update measure" } },
      }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

    renderRavPageComponent();

    const ravOptionYes = screen.getByRole("radio", { name: "Yes" });
    const ravOptionNo = screen.getByRole("radio", { name: "No" });

    userEvent.click(getByLabelText("No"));

    await waitFor(() => {
      expect(ravOptionYes).not.toBeChecked();
      expect(ravOptionNo).toBeChecked();
    });

    const saveButton = getByTestId("rav-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    userEvent.click(saveButton);
    await waitFor(() =>
      expect(serviceApiMock.updateMeasureTestCaseConfiguration).toBeCalledWith(
        { ravIncluded: false },
        measure.id
      )
    );

    const errorToast = getByTestId("edit-rav-generic-error-text");
    expect(errorToast.textContent).toEqual(
      "Error updating Test Case Configuration: failed to update measure"
    );

    const toastCloseButton = await findByTestId("close-toast-button");
    expect(toastCloseButton).toBeInTheDocument();
    userEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("Change of Test Configuration enables Discard button and click Discard resets the form", async () => {
    renderRavPageComponent();

    const ravOptionYes = screen.getByRole("radio", { name: "Yes" });
    const ravOptionNo = screen.getByRole("radio", { name: "No" });
    userEvent.click(getByLabelText("No"));

    await waitFor(() => {
      expect(ravOptionYes).not.toBeChecked();
      expect(ravOptionNo).toBeChecked();
    });

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    act(() => {
      userEvent.click(cancelButton);
    });

    const discardDialog = getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = getByTestId("discard-dialog-continue-button");
    expect(continueButton).toBeInTheDocument();
    userEvent.click(continueButton);
    await waitFor(() => {
      expect(ravOptionYes).toBeChecked();
      expect(ravOptionNo).not.toBeChecked();
    });
  });

  test("Discard change then click Keep Working", async () => {
    renderRavPageComponent();

    const ravOptionYes = screen.getByRole("radio", { name: "Yes" });
    const ravOptionNo = screen.getByRole("radio", { name: "No" });
    userEvent.click(getByLabelText("No"));

    await waitFor(() => {
      expect(ravOptionYes).not.toBeChecked();
      expect(ravOptionNo).toBeChecked();
    });

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    await waitFor(() => expect(cancelButton).toBeEnabled());
    userEvent.click(cancelButton);

    const discardDialog = getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const discardCancelButton = getByTestId("discard-dialog-cancel-button");
    expect(discardCancelButton).toBeInTheDocument();
    userEvent.click(discardCancelButton);
    await waitFor(() => {
      expect(ravOptionYes).not.toBeChecked();
      expect(ravOptionNo).toBeChecked();
    });
  });
});
