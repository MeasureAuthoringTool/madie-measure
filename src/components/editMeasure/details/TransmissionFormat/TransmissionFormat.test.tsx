import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import TransmissionFormat from "./TransmissionFormat";

import {
  measureStore,
  checkUserCanEdit,
  MeasureServiceApi,
} from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

const measure = {
  id: "measure ID",
  measureName: "measureName",
  createdBy: "testuser",
  model: "QDM v5.6",
  measureMetaData: {
    transmissionFormat: "",
  },
} as Measure;

let mockMeasureServiceApi = {
  updateMeasure: jest.fn().mockResolvedValue({ status: 200, data: measure }),
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
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

const serviceConfig = {
  fhirElmTranslationService: { baseUrl: "fhir/services" },
  qdmElmTranslationService: { baseUrl: "qdm/services" },
  measureService: {
    baseUrl: "base.url",
  },
  terminologyService: { baseUrl: "" },
} as ServiceConfig;

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
  expect(element).toBeInstanceOf(HTMLDivElement);
  const inputEl = element;
  expect(inputEl).toBe(value);
};
describe("Transmission Format page", () => {
  afterEach(() => jest.clearAllMocks());

  it("Should handle successful save of transmission format", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const editor = screen.getByRole("textbox");
    expect(editor).toHaveTextContent("");
    fireEvent.change(editor, {
      target: { innerHTML: "transmission format example" },
    });
    expect(editor).toHaveTextContent("transmission format example");
    const submitButton = screen.getByTestId("save-button");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    fireEvent.click(submitButton);
    expect(
      await screen.findByTestId("measure-transmission-format-success")
    ).toHaveTextContent("Measure Transmission Format Saved Successfully");
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("Should handle dirtyCheck and cancel: write, discard, cancel, discard, continue", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const editor = screen.getByRole("textbox");
    expect(editor).toHaveTextContent("");
    fireEvent.change(editor, {
      target: { innerHTML: "transmission format example" },
    });
    expect(editor).toHaveTextContent("transmission format example");
    const submitButton = screen.getByTestId("save-button");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    const cancelButton = screen.getByTestId("cancel-button");
    expect(cancelButton).toBeEnabled();
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

    expect(cancelButton).toBeEnabled();
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
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockRejectedValueOnce({ data: {} });

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const editor = screen.getByRole("textbox");
    expect(editor).toHaveTextContent("");
    fireEvent.change(editor, {
      target: { innerHTML: "transmission format example" },
    });
    expect(editor).toHaveTextContent("transmission format example");
    const submitButton = screen.getByTestId("save-button");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    fireEvent.click(submitButton);
    expect(
      await screen.findByTestId("measure-transmission-format-error")
    ).toHaveTextContent(`Error updating Transmission Format for "measureName"`);
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("should handle successful save of transmission format entered in rich text editor", async () => {
    mockMeasureServiceApi.updateMeasure = jest
      .fn()
      .mockResolvedValue({ status: 200, data: measure });
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const editor = screen.getByRole("textbox");
    expect(editor).toHaveTextContent("");
    fireEvent.change(editor, {
      target: { innerHTML: "transmission format example" },
    });
    expect(editor).toHaveTextContent("transmission format example");
    const submitButton = getByTestId("save-button");
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
    userEvent.click(submitButton);
    expect(
      await screen.findByText("Measure Transmission Format Saved Successfully")
    ).toBeInTheDocument();
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    userEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("Should render disabled components the measure is locked", async () => {
    checkUserCanEdit.mockReturnValue(true);
    const lockedMeasure = {
      ...measure,
      measureLock: { lockedBy: "anotherUser" },
    };
    measureStore.state.mockImplementation(() => lockedMeasure);
    measureStore.initialState.mockImplementation(() => lockedMeasure);

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const editor = screen.getByTestId("transmissionFormat-value");
    expect(editor).toHaveClass("rich-text-editor_read_only");
    expect(editor).toHaveTextContent("-");
  });
});
