import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routesConfig } from "./MeasureRoutes";
import { MeasureServiceApi } from "@madie/madie-util";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { mockPaginationResponses } from "../__mocks__/mockMeasureResponses";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: jest.fn(() => jest.fn()), // Mock navigate as a function
}));

const serviceConfig = {
  fhirElmTranslationService: { baseUrl: "fhir/services" },
  qdmElmTranslationService: { baseUrl: "qdm/services" },
  terminologyService: { baseUrl: "example-service-url" },
  measureService: { baseUrl: "example-service-url" },
} as ServiceConfig;

const mockUser = "TestUser1";
jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => mockUser,
  }),
  useFeatureFlags: () => ({
    MeasureListCheckboxes: false,
  }),
  useUserRoles: () => ({
    roles: [],
    isAdmin: false,
  }),
  checkUserCanEdit: jest.fn(() => true),
  checkUserCanDelete: jest.fn(() => true),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => ({ unsubscribe: () => null }),
  },
}));

const mockMeasureServiceApi = {
  searchMeasuresByCriteria: jest.fn(mockPaginationResponses),
  getMeasureCounts: jest.fn().mockResolvedValue({
    ownedMeasures: 5,
    sharedMeasures: 3,
    allMeasures: 10,
  }),
} as unknown as MeasureServiceApi;

const { findAllByTestId, findByTestId, queryByTestId } = screen;

describe("Measures Pagination", () => {
  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear(); // Clear local storage after each test
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

  test("On Page load, 10 measures are displayed by default for Owned Measures tab", async () => {
    // Set local storage for Owned Measures tab
    localStorage.setItem(
      "ownedMeasuresPageOptions",
      JSON.stringify({ page: 1, limit: 10 })
    );

    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=0&page=1&limit=10",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const rowItems = await findAllByTestId("row-item");
    expect(rowItems).toHaveLength(10);
  });

  test("On Page load, 10 measures are displayed by default for Shared Measures tab", async () => {
    // Set local storage for Owned Measures tab
    localStorage.setItem(
      "sharedMeasuresPageOptions",
      JSON.stringify({ page: 1, limit: 10 })
    );

    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=1&page=1&limit=10",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const rowItems = await findAllByTestId("row-item");
    expect(rowItems).toHaveLength(10);
  });

  test("On Page load, 25 measures are displayed by default for All Measures tab (respecting stored limit)", async () => {
    // Set local storage for All Measures tab
    localStorage.setItem(
      "allMeasuresPageOptions",
      JSON.stringify({ page: 1, limit: 25 })
    );

    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=2&page=1&limit=25",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const rowItems = await findAllByTestId("row-item");
    expect(rowItems).toHaveLength(25);
  });

  test("On First page, previous button is hidden, next is available", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=0&page=1&limit=10",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const nextButton = await findByTestId("NavigateNextIcon");
    expect(nextButton).toBeTruthy();
    expect(queryByTestId("NavigateBeforeIcon")).toBeNull();
  });

  test("On second page, all buttons available", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=0&page=2&limit=10",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const prevButton = await findByTestId("NavigateBeforeIcon");
    expect(prevButton).toBeTruthy();
    const nextButton = await findByTestId("NavigateNextIcon");
    expect(nextButton).toBeTruthy();
  });

  test("Passing in query parameters alters result list", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=0&page=1&limit=25",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const itemList = await findAllByTestId("row-item");
    expect(itemList).toHaveLength(25);
  });

  test("Pagination handles the boundaries clean", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=0&page=1&limit=25",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    await waitFor(() => {
      const itemList = screen.getAllByTestId("row-item");
      expect(itemList).toHaveLength(25);
    });
  });

  test("Local storage is updated correctly when navigating pages", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?tab=0&page=1&limit=10",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);

    const nextButton = await findByTestId("NavigateNextIcon");
    userEvent.click(nextButton);

    await waitFor(() => {
      const updatedStorage = JSON.parse(
        localStorage.getItem("ownedMeasuresPageOptions")
      );
      expect(updatedStorage).toEqual({ page: 1, limit: "10" });
    });
  });
});
