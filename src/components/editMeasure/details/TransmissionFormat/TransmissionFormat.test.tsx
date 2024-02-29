import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import TransmissionFormat from "./TransmissionFormat";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";

jest.mock("../../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const measure = {
  id: "measure ID",
  measureName: "measureName",
  createdBy: "testuser",
  model: "QDM v5.6",
  measureMetaData: {
    transmissionFormat: "",
  },
} as Measure;

let serviceApiMock = {
  updateMeasure: jest.fn().mockResolvedValue({ status: 200, data: measure }),
} as unknown as MeasureServiceApi;
useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useFeatureFlags: () => ({}),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => measure),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: jest.fn((routeObj) => routeObj),
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  elmTranslationService: {
    baseUrl: "",
  },
  terminologyService: { baseUrl: "" },
};

// mocking useHistory
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
}));
const { getByTestId, findByTestId, queryByText } = screen;
const expectInputValue = (
  element: HTMLTextAreaElement,
  value: string
): void => {
  expect(element).toBeInstanceOf(HTMLTextAreaElement);
  const inputEl = element as HTMLTextAreaElement;
  expect(inputEl.value).toBe(value);
};
describe("Transmission Format page", () => {
  afterEach(() => jest.clearAllMocks());

  it("Should handle successful save of transmission format", async () => {
    measureStore.state.mockImplementation(() => measure);
    measureStore.initialState.mockImplementation(() => measure);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const textAreaInput = getByTestId(
      "measure-transmission-format"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "transmission format example" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "transmission format example");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);
    expect(
      await findByTestId("measure-transmission-format-success")
    ).toHaveTextContent("Measure Transmission Format Saved Successfully");
    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("Should handle dirtyCheck and cancel: write, discard, cancel, discard, continue", async () => {
    measureStore.state.mockImplementation(() => measure);
    measureStore.initialState.mockImplementation(() => measure);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const textAreaInput = getByTestId(
      "measure-transmission-format"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "transmission format example" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "transmission format example");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toHaveProperty("disabled", false);
    fireEvent.click(cancelButton);
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    const discardDialogCancelButton = screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(discardDialogCancelButton).toBeInTheDocument();
    fireEvent.click(discardDialogCancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });

    expect(cancelButton).toHaveProperty("disabled", false);
    fireEvent.click(cancelButton);
    expect(discardDialog).toBeInTheDocument();
    expect(queryByText("You have unsaved changes.")).toBeVisible();

    const discardDialogContinueButton = screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(discardDialogContinueButton).toBeInTheDocument();
    fireEvent.click(discardDialogContinueButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("Should handle failure of updating a measure", async () => {
    measureStore.state.mockImplementation(() => measure);
    measureStore.initialState.mockImplementation(() => measure);
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({ data: {} }),
    } as unknown as MeasureServiceApi;
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const textAreaInput = getByTestId(
      "measure-transmission-format"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "transmission format example" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "transmission format example");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);
    expect(
      await findByTestId("measure-transmission-format-error")
    ).toHaveTextContent(`Error updating Transmission Format for "measureName"`);
    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });
});
