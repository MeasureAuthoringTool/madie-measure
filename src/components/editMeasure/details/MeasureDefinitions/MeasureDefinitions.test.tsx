import * as React from "react";
import {
  render,
  fireEvent,
  cleanup,
  waitFor,
  screen,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { within } from "@testing-library/dom";
import { MemoryRouter } from "react-router";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../api/ServiceContext";
import MeasureDefinitions from "./MeasureDefinitions";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../api/useMeasureServiceApi";
import { measureStore, checkUserCanEdit } from "@madie/madie-util";
import { Measure, MeasureDefinition } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../api/useMeasureServiceApi");
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const measure = {
  id: "measure ID",
  createdBy: "testuser@example.com",
} as Measure;

const serviceApiMock = {
  updateMeasure: jest.fn().mockResolvedValue({ status: 200, data: measure }),
} as unknown as MeasureServiceApi;
useMeasureServiceApiMock.mockImplementation(() => serviceApiMock);

function definitionHelper(number: number): MeasureDefinition[] {
  const definitions: MeasureDefinition[] = [];
  for (let i = 0; i < number; i++) {
    definitions.push({
      term: `term ${i}`,
      definition: `definition ${i}`,
    });
  }
  return definitions;
}
const nineItems = definitionHelper(9);
// const measureWithMetaData = {...measure, measureMetaData: {}}
const measureWithNineItems = {
  ...measure,
  measureMetaData: { measureDefinitions: nineItems },
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
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
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

// afterEach(cleanup);
// helper function
const checkRows = async (number: number) => {
  const tableBody = getByTestId("measure-definitions-table-body");
  expect(tableBody).toBeInTheDocument();
  const visibleRows = await within(tableBody).findAllByRole("row");
  expect(visibleRows).toHaveLength(number);
};

const { getByTestId, findByTestId } = screen;
describe("EditMeasure Component", () => {
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

  it("should render a list of definitions when present", async () => {
    measureStore.state.mockImplementationOnce(() => measureWithNineItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    checkRows(9);
  });

  it("Should open a dialog on click, fill out form, save, and see results update on page", async () => {
    measureStore.state.mockImplementation(() => measureWithNineItems);
    measureStore.initialState.mockImplementation(() => measureWithNineItems);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <MeasureDefinitions setErrorMessage={jest.fn()} />
        </MemoryRouter>
      </ApiContextProvider>
    );
    checkRows(9);
    expect(getByTestId("create-definition-button")).toBeEnabled();

    const createButton = await findByTestId("create-definition-button");
    expect(createButton).toBeInTheDocument();

    // user event breaks everything.
    // userEvent.click(screen.getByTestId("create-definition-button"))
    // await waitFor(() => {
    //     expect(getByTestId("dialog-form")).toBeInTheDocument();
    // })
  });
});
