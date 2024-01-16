import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act, Simulate } from "react-dom/test-utils";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import MeasureDefinitions, { MeasureDefinition } from "./MeasureDefinitions";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const measure = {
  id: "measure ID",
  measureName: "measureName",
  createdBy: "testuser@example.com",
} as Measure;

let serviceApiMock = {
  updateMeasure: jest.fn().mockResolvedValue({ status: 200, data: measure }),
} as unknown as MeasureServiceApi;
useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

function definitionHelper(number: number): MeasureDefinition[] {
  const definitions: MeasureDefinition[] = [];
  for (let i = 0; i < number; i++) {
    definitions.push({
      id: `id ${i}`,
      term: `term ${i}`,
      definition: `definition ${i}`,
    });
  }
  return definitions;
}

const nineItems = definitionHelper(9);
const measureWithNineItems = {
  ...measure,
  measureMetaData: { measureDefinitions: nineItems },
};
const measureWithTenItems = {
  ...measure,
  measureMEtaData: { measureDefinitions: definitionHelper(10) },
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

const { getByTestId, findByTestId } = screen;
const expectInputValue = (
  element: HTMLTextAreaElement,
  value: string
): void => {
  expect(element).toBeInstanceOf(HTMLTextAreaElement);
  const inputEl = element as HTMLTextAreaElement;
  expect(inputEl.value).toBe(value);
};
describe("EditMeasure Component", () => {
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
    const tableBody = getByTestId("measure-definitions-table-body");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(number);
    });
  };
  const checkDialogExists = async () => {
    userEvent.click(screen.getByTestId("create-definition-button"));
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
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const result = getByTestId("empty-definitions");
    expect(result).toBeInTheDocument();
  });

  it("should allow adding term and definition", async () => {
    measureStore.state.mockImplementationOnce(() => null);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const result = getByTestId("empty-definitions");
    expect(result).toBeInTheDocument();

    const createButton = await findByTestId("create-definition-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();
    const termBoxNode = await getByTestId("qdm-measure-term-input");
    userEvent.type(termBoxNode, "term");
    Simulate.change(termBoxNode);
    expect(termBoxNode.value).toBe("term");

    const textAreaInput = getByTestId(
      "qdm-measure-definition"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "definition" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "definition");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-definitions-success")
    ).toHaveTextContent("Measure Definition Saved Successfully");
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("Should allow editing dialog with populated values on clicking Edit and changes are saved.", async () => {
    measureStore.state.mockImplementation(() => measureWithNineItems);
    measureStore.initialState.mockImplementation(() => measureWithNineItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(9);

    const editButtonForDefinition8 = await findByTestId(
      "measure-definition-edit-id 8"
    );
    expect(editButtonForDefinition8).toBeInTheDocument();

    userEvent.click(editButtonForDefinition8);
    await waitFor(() => {
      expect(getByTestId("dialog-form")).toBeInTheDocument();
    });

    const termInput = await findByTestId("qdm-measure-term-input");
    expect(termInput.value).toBe("term 8");
    const definitionInput = await findByTestId("qdm-measure-definition");
    expect(definitionInput.value).toBe("definition 8");

    fireEvent.change(termInput, {
      target: { value: "term 8 changed" },
    });

    //const saveButton = findByTestId("save-button");
    //expect(saveButton).toBeDisabled();
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-definitions-success")
    ).toHaveTextContent("Measure Definition Saved Successfully");
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
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(9);
    expect(getByTestId("create-definition-button")).toBeEnabled();

    const createButton = await findByTestId("create-definition-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();
    const termBoxNode = await getByTestId("qdm-measure-term-input");
    userEvent.type(termBoxNode, "term 10");
    Simulate.change(termBoxNode);
    expect(termBoxNode.value).toBe("term 10");

    const textAreaInput = getByTestId(
      "qdm-measure-definition"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "definition 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "definition 10");
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
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(9);
    expect(getByTestId("create-definition-button")).toBeEnabled();

    const createButton = await findByTestId("create-definition-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();
    const termBoxNode = await getByTestId("qdm-measure-term-input");
    userEvent.type(termBoxNode, "term 10");
    Simulate.change(termBoxNode);
    expect(termBoxNode.value).toBe("term 10");

    const textAreaInput = getByTestId(
      "qdm-measure-definition"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "definition 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "definition 10");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-definitions-success")
    ).toHaveTextContent("Measure Definition Saved Successfully");
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
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    expect(getByTestId("create-definition-button")).toBeEnabled();

    const createButton = await findByTestId("create-definition-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();
    const termBoxNode = await getByTestId("qdm-measure-term-input");
    userEvent.type(termBoxNode, "term 10");
    Simulate.change(termBoxNode);
    expect(termBoxNode.value).toBe("term 10");

    const textAreaInput = getByTestId(
      "qdm-measure-definition"
    ) as HTMLTextAreaElement;
    expectInputValue(textAreaInput, "");
    act(() => {
      fireEvent.change(textAreaInput, {
        target: { value: "definition 10" },
      });
    });
    fireEvent.blur(textAreaInput);
    expectInputValue(textAreaInput, "definition 10");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-definitions-error")
    ).toHaveTextContent('Error updating measure "measureName"');
    const toastCloseButton = await screen.findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });
});
