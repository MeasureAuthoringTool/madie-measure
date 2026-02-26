import * as React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import SDEPage from "./SDEPage";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import { useMeasureServiceApi, MeasureServiceApi } from "@madie/madie-util";
import { QdmExecutionContextProvider } from "../../routes/qdm/QdmExecutionContext";

const measure = {
  id: "test measure",
  measureName: "the measure for testing",
  cqlLibraryName: "TestCqlLibraryName",
  ecqmTitle: "ecqmTitle",
  measurementPeriodStart: "01/01/2022",
  measurementPeriodEnd: "12/02/2022",
  createdBy: "john doe",
  measureSetId: "testMeasureId",
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }], //#nosec
} as unknown as Measure;

const mockMeasureServiceApi: MeasureServiceApi = {
  updateMeasureTestCaseConfiguration: jest.fn(),
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
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
function renderSdePageComponent() {
  return render(
    <SDEPage setExecutionContextReady={setExecutionContextReady} />
  );
}

describe("SDEPage component", () => {
  const { getByTestId, findByTestId, getByText, getByLabelText } = screen;

  test("Changes to Test Case Configuration enables Save button and saving successfully displays success message", async () => {
    mockMeasureServiceApi.updateMeasureTestCaseConfiguration = jest
      .fn()
      .mockResolvedValueOnce({ status: 200 });

    renderSdePageComponent();

    userEvent.click(screen.getByLabelText("Yes"));

    const saveButton = screen.getByTestId("sde-save");
    expect(saveButton).toBeInTheDocument();
    await waitFor(() => expect(saveButton).toBeEnabled());
    userEvent.click(saveButton);

    await waitFor(() =>
      expect(
        mockMeasureServiceApi.updateMeasureTestCaseConfiguration
      ).toBeCalledWith({ sdeIncluded: true }, measure.id)
    );

    expect(
      screen.getByText("Test Case Configuration Updated Successfully")
    ).toBeInTheDocument();

    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    userEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  test("Change of Test Configuration enables Discard button and click Discard resets the form", async () => {
    renderSdePageComponent();

    const sdeOptionYes = screen.getByRole("radio", { name: "Yes" });
    const sdeOptionNo = screen.getByRole("radio", { name: "No" });
    userEvent.click(getByLabelText("Yes"));

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
      expect(sdeOptionYes).not.toBeChecked();
      expect(sdeOptionNo).toBeChecked();
    });
  });

  test("Discard change then click Keep Working", async () => {
    renderSdePageComponent();

    const sdeOptionYes = screen.getByRole("radio", { name: "Yes" });
    const sdeOptionNo = screen.getByRole("radio", { name: "No" });
    userEvent.click(getByLabelText("Yes"));

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
      expect(sdeOptionYes).toBeChecked();
      expect(sdeOptionNo).not.toBeChecked();
    });
  });
});
