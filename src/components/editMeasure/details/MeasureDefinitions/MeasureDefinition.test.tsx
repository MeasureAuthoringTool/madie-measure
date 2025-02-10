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

const measure = {
  id: "measure ID",
  measureName: "measureName",
  createdBy: "testuser@example.com", //#nosec
} as Measure;

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
  useNavigate: () => mockedNavigate,
}));

const { getByTestId } = screen;

describe("Measure Definitions Component", () => {
  afterEach(() => jest.clearAllMocks());

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
    const pageButton = await screen.findByLabelText("Go to page 2");
    act(() => {
      userEvent.click(pageButton);
    });
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalled();
    });
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

    const searchInput = screen.getByRole("textbox", { name: "Search" });
    expect(searchInput).toBeInTheDocument();
    const searchInputField = screen.getByTestId(
      "measure-definition-search-input"
    );
    userEvent.type(searchInputField, "test");
    userEvent.keyboard("{Enter}");
    expect(mockedNavigate).toHaveBeenCalledWith(
      expect.stringContaining("search=test&page=1&limit=10")
    );
  });
});
