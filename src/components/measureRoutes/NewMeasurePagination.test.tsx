import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routesConfig } from "./MeasureRoutes";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { act } from "react-dom/test-utils";
import { mockPaginationResponses } from "../__mocks__/mockMeasureResponses";
import { describe, expect, test } from "@jest/globals";

const serviceConfig: ServiceConfig = {
  terminologyService: { baseUrl: "example-service-url" },
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  useFeatureFlags: () => null, // Values of flags do not matter for these tests
}));

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn(mockPaginationResponses),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);
const { findAllByTestId, findByTestId, queryByTestId } = screen;

describe("Measures Pagination", () => {
  afterEach(() => {
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
  test("On Page load, 10 measures are displayed by default  ", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);
    const rowItems = await findAllByTestId("row-item");
    expect(rowItems).toHaveLength(10);
  });

  test("On First page, previous button is hidden, next is available  ", async () => {
    await act(async () => {
      renderRouter([
        {
          pathname: "/measures",
          search: "",
          hash: "",
          state: undefined,
          key: "1fewtg",
        },
      ]);
      const nextButton = await findByTestId("NavigateNextIcon");
      expect(nextButton).toBeTruthy();
      expect(queryByTestId("NavigateBeforeIcon")).toBeNull();
    });
  });

  test("On second page, all buttons available", async () => {
    await act(async () => {
      renderRouter([
        {
          pathname: "/measures",
          search: "?page=2&limit=10",
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
  });

  test("passing in query paramaters alters result list", async () => {
    await act(async () => {
      renderRouter([
        {
          pathname: "/measures",
          search: "?page=2&limit=10",
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
  });

  test("passing in query paramaters alters result list", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?page=1&limit=25",
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
        search: "?page=5&limit=25",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);
    const itemList = await findAllByTestId("row-item");
    expect(itemList).toHaveLength(10);
    expect(queryByTestId("NavigateNextIcon")).toBeNull();
  });
});
