import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act, Simulate } from "react-dom/test-utils";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import MeasureReferences from "./MeasureReferences";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { measureStore } from "@madie/madie-util";
import { Measure, Reference } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const measure = {
  id: "measure ID",
  measureName: "measureName",
  createdBy: "testuser@example.com", //#nosec
} as Measure;

let serviceApiMock = {
  updateMeasure: jest.fn().mockResolvedValue({ status: 200, data: measure }),
} as unknown as MeasureServiceApi;
useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

function referenceHelper(number: number): Reference[] {
  const references: Reference[] = [];
  for (let i = 0; i < number; i++) {
    references.push({
      id: `id ${i}`,
      referenceType: `type ${i}`,
      referenceText: `text ${i}`,
    });
  }
  return references;
}

const nineItems = referenceHelper(9);
const measureWithNineItems = {
  ...measure,
  measureMetaData: { references: nineItems },
};
const measureWithTenItems = {
  ...measure,
  measureMEtaData: { references: referenceHelper(10) },
};

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
  useHistory: () => {
    const push = (val) => mockPush(val);
    return { push, block: () => null };
  },
}));

const { getByTestId, findByTestId, getByLabelText } = screen;
const expectInputValue = (
  element: HTMLTextAreaElement,
  value: string
): void => {
  expect(element).toBeInstanceOf(HTMLTextAreaElement);
  const inputEl = element as HTMLTextAreaElement;
  expect(inputEl.value).toBe(value);
};
describe("Measure References Component", () => {
  afterEach(() => jest.clearAllMocks());
  const expectInputValue = (
    element: HTMLTextAreaElement,
    value: string
  ): void => {
    expect(element).toBeInstanceOf(HTMLTextAreaElement);
    const inputEl = element as HTMLTextAreaElement;
    expect(inputEl.value).toBe(value);
  };
  const checkRows = async (number: number) => {
    const tableBody = getByTestId("measure-references-table-body");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(number);
    });
  };
  const checkDialogExists = async () => {
    userEvent.click(screen.getByTestId("create-reference-button"));
    await waitFor(() => {
      expect(getByTestId("dialog-form")).toBeInTheDocument();
    });
  };
  const checkDialogHidden = async () => {
    await waitFor(() => {
      expect(getByTestId("dialog-form")).not.toBeVisible();
    });
  };
  it("should render a loading page if the measure is not yet loaded", () => {
    measureStore.state.mockImplementationOnce(() => null);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const result = getByTestId("empty-references");
    expect(result).toBeInTheDocument();
  });

  it("should render a loading page if the measure is not yet loaded", async () => {
    measureStore.state.mockImplementationOnce(() => null);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const result = getByTestId("empty-references");
    expect(result).toBeInTheDocument();
  });

  it("Should allow editing dialog with populated values on clicking Edit and changes are saved.", async () => {
    measureStore.state.mockImplementation(() => measureWithNineItems);
    measureStore.initialState.mockImplementation(() => measureWithNineItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(9);

    const editButton = await findByTestId("measure-definition-edit-id 1");
    expect(editButton).toBeInTheDocument();
    userEvent.click(screen.getByTestId("measure-definition-edit-id 1"));
    await waitFor(() => {
      expect(getByTestId("dialog-form")).toBeInTheDocument();
    });

    const typeInput = screen.getByTestId(
      "measure-referenceType-input"
    ) as HTMLInputElement;
    expect(typeInput.value).toBe("type 1");
    const textAreaInput = getByTestId(
      "measure-referenceText"
    ) as HTMLTextAreaElement;
    expect(textAreaInput.value).toBe("text 1");

    fireEvent.change(typeInput, {
      target: { value: "Citation" },
    });
    expect(typeInput.value).toBe("Citation");

    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "text 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "text 10");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-references-success")
    ).toHaveTextContent("Measure Reference Saved Successfully");
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("Should open a dialog on click, fill out form, cancel closes the form.", async () => {
    measureStore.state.mockImplementation(() => measureWithNineItems);
    measureStore.initialState.mockImplementation(() => measureWithNineItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(9);
    expect(getByTestId("create-reference-button")).toBeEnabled();

    const createButton = await findByTestId("create-reference-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();

    const typeInput = screen.getByTestId(
      "measure-referenceType-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");

    fireEvent.change(typeInput, {
      target: { value: "Citation" },
    });
    expect(typeInput.value).toBe("Citation");

    const textAreaInput = getByTestId(
      "measure-referenceText"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "text 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "text 10");
    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toHaveProperty("disabled", false);
    fireEvent.click(cancelButton);
    await checkDialogHidden();
  });

  it("Should open a dialog on click, fill out form, handle success", async () => {
    measureStore.initialState.mockImplementationOnce(
      () => measureWithNineItems
    );
    measureStore.state.mockImplementationOnce(() => measureWithNineItems);

    const newTenMeasure = Object.assign({}, measureWithTenItems);
    serviceApiMock = {
      updateMeasure: jest
        .fn()
        .mockResolvedValueOnce({ data: newTenMeasure, status: 200 }),
    } as unknown as MeasureServiceApi;

    const { unmount } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(9);
    expect(getByTestId("create-reference-button")).toBeEnabled();

    const createButton = await findByTestId("create-reference-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();

    const typeInput = screen.getByTestId(
      "measure-referenceType-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");

    fireEvent.change(typeInput, {
      target: { value: "Citation" },
    });
    expect(typeInput.value).toBe("Citation");

    const textAreaInput = getByTestId(
      "measure-referenceText"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "reference 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "reference 10");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-references-success")
    ).toHaveTextContent("Measure Reference Saved Successfully");
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
    unmount();
  });

  it("Should open a dialog on click, fill out form, handle failure", async () => {
    measureStore.initialState.mockImplementationOnce(
      () => measureWithNineItems
    );
    measureStore.state.mockImplementationOnce(() => measureWithNineItems);

    serviceApiMock = {
      updateMeasure: jest.fn().mockRejectedValueOnce({ data: {} }),
    } as unknown as MeasureServiceApi;

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByTestId("create-reference-button")).toBeEnabled();

    const createButton = await findByTestId("create-reference-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();

    const typeInput = screen.getByTestId(
      "measure-referenceType-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");

    fireEvent.change(typeInput, {
      target: { value: "Citation" },
    });
    expect(typeInput.value).toBe("Citation");

    const textAreaInput = getByTestId(
      "measure-referenceText"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "reference 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "reference 10");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-references-error")
    ).toHaveTextContent('Error updating measure "measureName"');
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });
});
