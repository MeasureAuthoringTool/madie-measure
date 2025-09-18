import * as React from "react";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import MeasureDefinitions from "./MeasureDefinitions";
// @ts-ignore
import { measureStore } from "@madie/madie-util";
import { Measure, MeasureDefinition } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";

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

function createDefinitiions(number: number): MeasureDefinition[] {
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

const measureWithNineItems = {
  ...measure,
  measureMetaData: { measureDefinitions: createDefinitiions(9) },
};
const measureWithElevenItems = {
  ...measure,
  measureMetaData: { measureDefinitions: createDefinitiions(11) },
};

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
}));

const serviceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  elmTranslationService: {
    baseUrl: "",
  },
  terminologyService: { baseUrl: "" },
} as unknown as ServiceConfig;

const mockedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

const {
  getByTestId,
  findByTestId,
  findByLabelText,
  getByRole,
  queryByText,
  queryByTestId,
} = screen;

describe("Measure Definitions Component", () => {
  afterEach(() => jest.clearAllMocks());

  const expectInputValue = (
    element: HTMLTextAreaElement,
    value: string
  ): void => {
    expect(element).toBeInstanceOf(HTMLTextAreaElement);
    const inputEl = element as HTMLTextAreaElement;
    expect(inputEl.value).toBe(value);
  };

  const checkDialogExists = async () => {
    userEvent.click(getByTestId("create-definition-button"));
    await waitFor(() => {
      expect(getByTestId("dialog-form")).toBeInTheDocument();
    });
  };
  const checkDialogHidden = async () => {
    await waitFor(() => {
      expect(getByTestId("dialog-form")).not.toBeVisible();
    });
  };

  const checkRows = async (number: number) => {
    const tableBody = getByTestId("measure-definitions-table-body");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(number);
    });
  };

  it("should render a loading page if there are no measure definitions", () => {
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

  it("Should display a list of measure definitions.", async () => {
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
  });

  it("Test pagination works", async () => {
    measureStore.state.mockImplementation(() => measureWithElevenItems);
    measureStore.initialState.mockImplementation(() => measureWithElevenItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(10);

    // change page
    const pageButton = await findByLabelText("Go to page 2");
    act(() => {
      userEvent.click(pageButton);
    });
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalled();
    });
  });

  it("Test change page limit works", async () => {
    measureStore.state.mockImplementation(() => measureWithElevenItems);
    measureStore.initialState.mockImplementation(() => measureWithElevenItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(10);

    // change limit
    const [combobox] = await screen.findAllByText("10");
    userEvent.click(combobox);
    const pageLimit25 = screen.getByRole("option", {
      name: /25/i,
    });
    userEvent.click(pageLimit25);
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalled();
    });
    await checkRows(11);
  });

  it("test search", async () => {
    measureStore.state.mockImplementation(() => measureWithElevenItems);
    measureStore.initialState.mockImplementation(() => measureWithElevenItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(10);

    const searchInput = getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = getByTestId("measure-definition-search-input");
    userEvent.type(searchInputField, "term 1");
    userEvent.keyboard("{Enter}");

    await checkRows(2);

    const clearSearch = getByTestId("ClearIcon");
    userEvent.click(clearSearch);

    await checkRows(10);
  });

  it("test search edge case with no definitions", async () => {
    measureStore.state.mockImplementation(() => []);
    measureStore.initialState.mockImplementation(() => []);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const searchInput = getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = getByTestId("measure-definition-search-input");
    userEvent.type(searchInputField, "www");
    userEvent.keyboard("{Enter}");

    expect(
      screen.queryByText(
        "There are currently no definitions. Click the (Add Term) button above to add one."
      )
    ).toBeInTheDocument();
  });

  it("does not do search when there is no search value", async () => {
    measureStore.state.mockImplementation(() => measureWithElevenItems);
    measureStore.initialState.mockImplementation(() => measureWithElevenItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(10);

    const searchInput = getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = getByTestId("measure-definition-search-input");
    userEvent.type(searchInputField, "");
    userEvent.keyboard("{Enter}");

    await checkRows(10);

    const clearSearch = getByTestId("ClearIcon");
    userEvent.click(clearSearch);

    await checkRows(10);
  });

  it("test edit measure definition.", async () => {
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

    const editButton = getByTestId(`edit-measure-definition-id 1`);
    expect(editButton).toBeInTheDocument();

    const deleteButton = getByTestId(`delete-measure-definition-id 1`);
    expect(deleteButton).toBeInTheDocument();

    userEvent.click(editButton);

    await waitFor(() => {
      expect(getByTestId("dialog-form")).toBeInTheDocument();
    });

    const termInput = getByTestId(
      "measure-definition-term-input"
    ) as HTMLInputElement;
    expect(termInput.value).toBe("term 1");
    const definitionInput = within(
      screen.getByTestId("definition-rich-text-editor")
    ).getByRole("textbox");
    expect(definitionInput).toHaveTextContent("definition 1");

    fireEvent.change(termInput, {
      target: { value: "term 111" },
    });
    expect(termInput.value).toBe("term 111");

    act(() => {
      fireEvent.input(definitionInput, {
        target: { textContent: "definition 111" },
      });
    });
    fireEvent.blur(definitionInput);
    expect(definitionInput).toHaveTextContent("definition 111");
    const submitButton = getByTestId("save-button");
    expect(submitButton).toHaveProperty("disabled", false);
    fireEvent.click(submitButton);

    expect(
      await screen.findByTestId("measure-definitions-success")
    ).toHaveTextContent("Measure Definition saved Successfully");
    const toastCloseButton = await findByTestId("close-error-button");
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    await waitFor(() => {
      expect(toastCloseButton).not.toBeInTheDocument();
    });
  });

  it("should render delete dialogue", async () => {
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

    const deleteButton = getByTestId(`delete-measure-definition-id 1`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    expect(getByTestId("delete-dialog")).toBeInTheDocument();
    expect(getByTestId("delete-dialog-continue-button")).toBeInTheDocument();
    expect(getByTestId("delete-dialog-cancel-button")).toBeInTheDocument();

    fireEvent.click(getByTestId("delete-dialog-cancel-button"));
    await waitFor(() => {
      const submitButton = queryByText("Yes, Delete");
      expect(submitButton).not.toBeInTheDocument();
    });
  });

  it("test delete success", async () => {
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

    const deleteButton = getByTestId(`delete-measure-definition-id 1`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    expect(getByTestId("delete-dialog")).toBeInTheDocument();
    expect(getByTestId("delete-dialog-continue-button")).toBeInTheDocument();
    expect(getByTestId("delete-dialog-cancel-button")).toBeInTheDocument();

    fireEvent.click(getByTestId("delete-dialog-continue-button"));

    await waitFor(() => {
      const toastMessage = findByTestId("measure-definitions-success");
      expect(toastMessage).not.toBeNull();
      expect(queryByTestId("delete-dialog-body")).toBeNull();
    });
  });

  it("test delete failure", async () => {
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
    await checkRows(9);

    const deleteButton = getByTestId(`delete-measure-definition-id 1`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    expect(getByTestId("delete-dialog")).toBeInTheDocument();
    expect(getByTestId("delete-dialog-continue-button")).toBeInTheDocument();
    expect(getByTestId("delete-dialog-cancel-button")).toBeInTheDocument();

    fireEvent.click(getByTestId("delete-dialog-continue-button"));

    await waitFor(() => {
      expect(queryByTestId("delete-dialog-body")).toBeNull();
    });
  });

  it("test create measure defintition success.", async () => {
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

    const termInput = getByTestId(
      "measure-definition-term-input"
    ) as HTMLInputElement;
    expect(termInput).toBeInTheDocument();
    expect(termInput.value).toBe("");

    fireEvent.change(termInput, {
      target: { value: "term 1" },
    });
    expect(termInput.value).toBe("term 1");

    const definitionInput = within(
      screen.getByTestId("definition-rich-text-editor")
    ).getByRole("textbox");
    expect(definitionInput).toBeInTheDocument();
    expect(definitionInput).toHaveTextContent("");
    act(() => {
      fireEvent.input(definitionInput, {
        target: { textContent: "definition 1" },
      });
    });
    fireEvent.blur(definitionInput);
    expect(definitionInput).toHaveTextContent("definition 1");
    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toHaveProperty("disabled", false);
    fireEvent.click(cancelButton);
    await checkDialogHidden();
  });

  it("render Definition rich text editor if EnhancedTextFormatting flag is true", async () => {
    measureStore.initialState.mockImplementationOnce(
      () => measureWithNineItems
    );
    measureStore.state.mockImplementationOnce(() => measureWithNineItems);

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

    const termInput = getByTestId(
      "measure-definition-term-input"
    ) as HTMLInputElement;
    expect(termInput).toBeInTheDocument();
    expect(termInput.value).toBe("");

    fireEvent.change(termInput, {
      target: { value: "term 1" },
    });
    expect(termInput.value).toBe("term 1");

    const definitionEditor = within(
      screen.getByTestId("definition-rich-text-editor")
    ).getByRole("textbox");
    expect(definitionEditor).toBeInTheDocument();
    expect(definitionEditor).toHaveTextContent("");

    fireEvent.input(definitionEditor, {
      target: { textContent: "definition 1" },
    });

    expect(definitionEditor).toHaveTextContent("definition 1");
  });
});
