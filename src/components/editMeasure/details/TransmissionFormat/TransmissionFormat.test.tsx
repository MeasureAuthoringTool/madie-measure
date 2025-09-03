import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import TransmissionFormat from "./TransmissionFormat";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
// @ts-ignore - test environment stub
import { measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../api/useMeasureServiceApi");
// Mock the rich text TextEditor with a simple textarea to isolate form logic
jest.mock("../../populationCriteria/groups/TextEditor", () => (props) => {
  const { setFieldValue, label, name, value, readOnly, onChange } =
    props as any;
  return (
    <textarea
      data-testid="transmission-format-mock"
      aria-label={label || "Description"}
      name={name || "transmissionFormat"}
      value={value || ""}
      readOnly={readOnly}
      onChange={(e) => {
        // invoke formik's onChange if provided
        onChange && onChange(e);
        // ensure formik dirty state via setFieldValue (some editors bypass event target wiring)
        setFieldValue &&
          setFieldValue(name || "transmissionFormat", e.target.value, true);
      }}
      style={{ width: 400, minHeight: 120 }}
    />
  );
});
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
  useFeatureFlags: jest.fn(() => ({})),
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
const { getByTestId, queryByText } = screen;
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
    const input = screen.getByTestId("transmission-format-mock");
    expect(input).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Example" } });
    const saveBtn = getByTestId("save-button");
    await waitFor(() => expect(saveBtn).toBeEnabled());
    fireEvent.click(saveBtn);
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
    const input = screen.getByTestId("transmission-format-mock");
    fireEvent.change(input, { target: { value: "Changed" } });
    const cancelButton = getByTestId("cancel-button");
    await waitFor(() => expect(cancelButton).toBeEnabled());
    fireEvent.click(cancelButton);
    const discardDialog = await screen.findByTestId("discard-dialog");
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
    measureStore.state.mockImplementation(() => measure);
    measureStore.initialState.mockImplementation(() => measure);
    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({ data: {} }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <TransmissionFormat setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const input = screen.getByTestId("transmission-format-mock");
    fireEvent.change(input, { target: { value: "Failure" } });
    const saveBtn = getByTestId("save-button");
    await waitFor(() => expect(saveBtn).toBeEnabled());
    fireEvent.click(saveBtn);
  });
});
