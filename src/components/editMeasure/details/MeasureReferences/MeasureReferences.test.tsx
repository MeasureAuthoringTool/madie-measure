import * as React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
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
// @ts-ignore
import { measureStore } from "@madie/madie-util";
import { Measure, Model, Reference } from "@madie/madie-models";
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

const expectedOptions1 = ["Citation", "Justification", "Unknown"];
const expectedOptions2 = ["Citation", "Justification"];

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
const measureWithElevenItems = {
  ...measure,
  measureMetaData: { references: referenceHelper(11) },
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
  // useNavigate: jest.fn(),
  useNavigate: () => mockedNavigate,
}));

const {
  getByTestId,
  findByTestId,
  findAllByTestId,
  getByRole,
  findByLabelText,
} = screen;
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

  it("test search", async () => {
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

    const searchInput = getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = getByTestId("measure-reference-search-input");
    userEvent.type(searchInputField, "type 1");
    userEvent.keyboard("{Enter}");

    await checkRows(1);

    const clearSearch = getByTestId("ClearIcon");
    userEvent.click(clearSearch);

    await checkRows(9);
  });

  it("does not do search when there is no search value", async () => {
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

    const searchInput = getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = getByTestId("measure-reference-search-input");
    userEvent.type(searchInputField, "");
    userEvent.keyboard("{Enter}");

    await checkRows(9);

    const clearSearch = getByTestId("ClearIcon");
    userEvent.click(clearSearch);

    await checkRows(9);
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

    const editButton = screen.getByTestId(`edit-measure-reference-id 1`);
    expect(editButton).toBeInTheDocument();

    const deleteButton = getByTestId(`delete-measure-reference-id 1`);
    expect(deleteButton).toBeInTheDocument();

    userEvent.click(editButton);

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

  it("should render delete dialogue on Test Case list page when delete button is clicked", async () => {
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

    const deleteButton = getByTestId(`delete-measure-reference-id 1`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-continue-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-dialog-cancel-button"));
    await waitFor(() => {
      const submitButton = screen.queryByText("Yes, Delete");
      expect(submitButton).not.toBeInTheDocument();
    });
  });

  it("should successfully delete measure reference page when delete button is clicked", async () => {
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

    const deleteButton = getByTestId(`delete-measure-reference-id 1`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-continue-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-dialog-continue-button"));
    const toastMessage = await screen.findByTestId(
      "measure-references-success"
    );
    expect(toastMessage).toHaveTextContent(
      "Measure reference deleted successfully"
    );
    expect(screen.queryByTestId("delete-dialog-body")).toBeNull();
  });

  it("should show error message when delete measure reference page fails", async () => {
    measureStore.state.mockImplementation(() => measureWithNineItems);
    measureStore.initialState.mockImplementation(() => measureWithNineItems);
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
    await checkRows(9);

    const deleteButton = getByTestId(`delete-measure-reference-id 1`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-continue-button")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("delete-dialog-cancel-button")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("delete-dialog-continue-button"));
    const toastMessage = await screen.findByTestId("measure-references-error");
    expect(toastMessage).toHaveTextContent(
      `Error updating measure "measureName"`
    );
    expect(screen.queryByTestId("delete-dialog-body")).toBeNull();
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

  it("Should open the Type dropdown with expected options for QDM v5.6 measure", async () => {
    measureStore.state.mockImplementation(() => {
      return {
        ...measureWithNineItems,
        model: Model.QDM_5_6,
      };
    });

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const createButton = await findByTestId("create-reference-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();

    const referenceTypeSelect = screen.getByTestId("measure-referenceType");
    const referenceTypeSelectDropdown = within(referenceTypeSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceTypeSelectDropdown);

    const referenceTypeOptionsList = await findAllByTestId(/-option/i);
    expect(referenceTypeOptionsList).toHaveLength(3);

    referenceTypeOptionsList.forEach((option, index) => {
      expect(option).toHaveTextContent(expectedOptions1[index]);
    });
  });

  it("Should open the Type dropdown with expected options for QI-Core v4.1.1 measure", async () => {
    measureStore.state.mockImplementation(() => {
      return {
        ...measureWithNineItems,
        model: Model.QICORE,
      };
    });

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const createButton = await findByTestId("create-reference-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();

    const referenceTypeSelect = screen.getByTestId("measure-referenceType");
    const referenceTypeSelectDropdown = within(referenceTypeSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceTypeSelectDropdown);

    const referenceTypeOptionsList = await findAllByTestId(/-option/i);
    expect(referenceTypeOptionsList).toHaveLength(2);

    referenceTypeOptionsList.forEach((option, index) => {
      expect(option).toHaveTextContent(expectedOptions2[index]);
    });
  });

  it("Should open the Type dropdown with expected options for QI-Core v6.0.0 measure", async () => {
    measureStore.state.mockImplementation(() => {
      return {
        ...measureWithNineItems,
        model: Model.QICORE_6_0_0,
      };
    });

    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const createButton = await findByTestId("create-reference-button");
    expect(createButton).toBeInTheDocument();
    await checkDialogExists();

    const referenceTypeSelect = screen.getByTestId("measure-referenceType");
    const referenceTypeSelectDropdown = within(referenceTypeSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceTypeSelectDropdown);

    const referenceTypeOptionsList = await findAllByTestId(/-option/i);
    expect(referenceTypeOptionsList).toHaveLength(2);

    referenceTypeOptionsList.forEach((option, index) => {
      expect(option).toHaveTextContent(expectedOptions2[index]);
    });
  });

  it("Should show error message when measure references are not loaded", async () => {
    measureStore.state.mockImplementationOnce(() => null);
    measureStore.initialState.mockImplementationOnce(() => null);
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

  it("Test change page works", async () => {
    measureStore.state.mockImplementation(() => measureWithElevenItems);
    measureStore.initialState.mockImplementation(() => measureWithElevenItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
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
          <MeasureReferences setErrorMessage={jest.fn()} />
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

  it("Editing existing reference with type Citation, user should see Citation in the dropdown", async () => {
    const reference: Reference = {
      id: "id 1",
      referenceType: "Citation",
      referenceText: "text 1",
    };
    const testMeasure = {
      ...measure,
      measureMetaData: { references: [reference] },
    };
    measureStore.state.mockImplementation(() => testMeasure);
    measureStore.initialState.mockImplementation(() => testMeasure);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureReferences setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await checkRows(1);

    const editButton = screen.getByTestId(`edit-measure-reference-id 1`);
    expect(editButton).toBeInTheDocument();

    const deleteButton = getByTestId(`delete-measure-reference-id 1`);
    expect(deleteButton).toBeInTheDocument();

    userEvent.click(editButton);

    await waitFor(() => {
      expect(getByTestId("dialog-form")).toBeInTheDocument();
    });

    const typeInput = screen.getByTestId(
      "measure-referenceType-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("Citation");
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
  });
});
