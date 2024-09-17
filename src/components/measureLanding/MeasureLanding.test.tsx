import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routesConfig } from "../measureRoutes/MeasureRoutes";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import {
  oneItemResponse,
  multipleItemsResponse,
} from "../__mocks__/mockMeasureResponses";
import { within } from "@testing-library/dom";

const serviceConfig: ServiceConfig = {
  fhirElmTranslationService: { baseUrl: "fhir/services" },
  qdmElmTranslationService: { baseUrl: "qdm/services" },
  terminologyService: { baseUrl: "example-service-url" },
  measureService: {
    baseUrl: "example-service-url",
  },
};

const abortController = new AbortController();
const mockUser = "TestUser1";

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getUserName: () => mockUser,
  }),
  useFeatureFlags: () => {
    return {
      MeasureListCheckboxes: true,
      associateMeasures: true,
    };
  },
}));

const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockedUsedNavigate,
}));

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn().mockResolvedValue(multipleItemsResponse),
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

describe("Measure Page", () => {
  afterEach(() => {
    mockedUsedNavigate.mockReset();
    jest.clearAllMocks();
  });
  const renderRouter = (initialEntries) => {
    const router = createMemoryRouter(routesConfig, {
      initialEntries: initialEntries,
    });

    render(
      <ApiContextProvider value={serviceConfig}>
        <RouterProvider router={router} />
      </ApiContextProvider>
    );
  };

  test("shows my measures on page load", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0,
      abortController.signal
    );
    const myMeasuresTab = screen.getByRole("tab", { name: "My Measures" });
    expect(myMeasuresTab).toBeInTheDocument();
    expect(myMeasuresTab).toHaveClass("Mui-selected");
    const allMeasuresTab = screen.getByRole("tab", { name: "All Measures" });
    expect(allMeasuresTab).toBeInTheDocument();
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");
  });

  test("all measure nav click triggers nav", async () => {
    renderRouter(["/measures"]);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0,
      abortController.signal
    );

    const myMeasuresTab = await screen.findByTestId("my-measures-tab");
    userEvent.click(myMeasuresTab);
    expect(myMeasuresTab).toHaveClass("Mui-selected");

    const allMeasuresTab = await screen.findByTestId("all-measures-tab");
    act(() => {
      userEvent.click(allMeasuresTab);
    });
    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=1&page=0&limit=10");
  });
  test("loading in with props for all measures page, triggers a fetch", async () => {
    renderRouter(["/measures?tab=1&page=0&limit=10"]);
    const allMeasuresTab = await screen.findByTestId("all-measures-tab");
    await waitFor(() => {
      expect(allMeasuresTab).toHaveClass("Mui-selected");
    });
    await waitFor(() =>
      expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
        false,
        10,
        0,
        abortController.signal
      )
    );
  });

  test("Search measure should call search api with search criteria", async () => {
    renderRouter(["/measures"]);

    const measureInput = (await screen.findByTestId(
      "searchMeasure-input"
    )) as HTMLInputElement;
    expect(measureInput).toBeInTheDocument();
    userEvent.type(measureInput, "test");
    expect(measureInput.value).toBe("test");
    fireEvent.submit(measureInput);
    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).toHaveBeenCalledWith(true, 10, 0, "test", abortController.signal);
  });

  test("Create event triggers the event listener", async () => {
    renderRouter(["/measures"]);
    const event = new Event("create");
    window.dispatchEvent(event);
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0,
      abortController.signal
    );
  });

  test("test pagination page button", async () => {
    renderRouter(["/measures"]);
    const pageButton = await screen.findByRole("button", {
      name: /page 1/i,
    });
    act(() => {
      userEvent.click(pageButton);
    });
    expect(mockedUsedNavigate).toHaveBeenCalledWith("?tab=0&page=1&limit=10");
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
  });

  test("test pagination page limit change", async () => {
    renderRouter(["/measures"]);
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0,
      abortController.signal
    );

    const pageLimit10Button = await screen.findByRole("button", {
      name: /10/i,
    });
    userEvent.click(pageLimit10Button);
    const pageLimit25 = screen.getByRole("option", {
      name: /25/i,
    });
    userEvent.click(pageLimit25);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
  });

  it("Should display errors when fetching measures is rejected", async () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    renderRouter(["/measures"]);

    const error = await screen.findByTestId("generic-error-text-header");
    expect(error).toBeInTheDocument();
    const errorText = await screen.findByText("Unable to fetch measures");
    expect(errorText).toBeInTheDocument();
  });

  it("Should not display errors when fetching measures is canceled", async () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("canceled"));
    renderRouter(["/measures"]);
    expect(await screen.queryByTestId("generic-error-text-header")).toBeNull();
    expect(await screen.queryByText("Unable to fetch measures")).toBeNull();
  });

  test("Search measure should display errors when searching measures is rejected", async () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    (mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    renderRouter(["/measures"]);

    const measureInput = (await screen.findByTestId(
      "searchMeasure-input"
    )) as HTMLInputElement;
    expect(measureInput).toBeInTheDocument();
    userEvent.type(measureInput, "test");
    expect(measureInput.value).toBe("test");
    fireEvent.submit(measureInput);
    const error = await screen.findByTestId("generic-error-text-header");
    expect(error).toBeInTheDocument();
    const errorText = await screen.findByText("Unable to fetch measures");
    expect(errorText).toBeInTheDocument();
  });

  test("Search measure should not display errors when searching measures is canceled", async () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("canceled"));
    (mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("canceled"));
    renderRouter(["/measures"]);

    const measureInput = (await screen.findByTestId(
      "searchMeasure-input"
    )) as HTMLInputElement;
    expect(measureInput).toBeInTheDocument();
    userEvent.type(measureInput, "test");
    expect(measureInput.value).toBe("test");
    fireEvent.submit(measureInput);

    expect(await screen.queryByTestId("generic-error-text-header")).toBeNull();
    expect(await screen.queryByText("Unable to fetch measures")).toBeNull();
  });

  test("render associate cms id dialog", async () => {
    renderRouter(["/measures"]);
    await waitFor(() => {
      expect(screen.getByTestId("measure-list-tbl")).toBeInTheDocument();
    });
    screen.debug();
    const measure1Checkbox = await within(
      await screen.findByTestId("measure-name-measureId1_select")
    ).findByRole("checkbox");
    userEvent.click(measure1Checkbox);
    const measure2Checkbox = await within(
      await screen.findByTestId("measure-name-measureId2_select")
    ).findByRole("checkbox");
    userEvent.click(measure2Checkbox);
    const associateCmsIdBtn = await screen.findByTestId(
      "associate-cms-id-action-btn"
    );
    expect(associateCmsIdBtn).toBeEnabled();
    userEvent.click(associateCmsIdBtn);
    const dialogTable = await screen.findByTestId(
      "associate-cms-id-dialog-tbl"
    );
    expect(dialogTable).toBeInTheDocument();
    const measure1Name = await within(dialogTable).getByText("TestMeasure1");
    expect(measure1Name).toBeInTheDocument();
    const measure2Name = await within(dialogTable).getByText("TestMeasure2");
    expect(measure2Name).toBeInTheDocument();
    expect(
      screen.getByText("Copy QDM Metadata to QI-Core measure")
    ).toBeInTheDocument();
  });
});
