import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MeasureRoutes } from "./MeasureRoutes";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { act } from "react-dom/test-utils";
import { mockPaginationResponses } from "./mockMeasureResponses";
import { describe, expect, test } from "@jest/globals";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("@madie/madie-util", () => () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "TestUser@example.com",
  }),
}));

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn(mockPaginationResponses),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

describe("Measures Pagination", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("On Page load, 10 measures are displayed by default  ", async () => {
    await act(async () => {
      const { findAllByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const rowItems = await findAllByTestId("row-item");
      expect(rowItems).toHaveLength(10);
    });
  });

  test("On First page, previous button is hidden, next is available  ", async () => {
    await act(async () => {
      const { findByTestId, queryByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const nextButton = await findByTestId("NavigateNextIcon");
      expect(nextButton).toBeTruthy();
      expect(queryByTestId("NavigateBeforeIcon")).toBeNull();
    });
  });

  test("On second page, all buttons available", async () => {
    await act(async () => {
      const { findByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "?page=2&limit=10",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const prevButton = await findByTestId("NavigateBeforeIcon");
      expect(prevButton).toBeTruthy();
      const nextButton = await findByTestId("NavigateNextIcon");
      expect(nextButton).toBeTruthy();
    });
  });

  test("passing in query paramaters alters result list", async () => {
    await act(async () => {
      const { findByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "?page=2&limit=10",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const prevButton = await findByTestId("NavigateBeforeIcon");
      expect(prevButton).toBeTruthy();
      const nextButton = await findByTestId("NavigateNextIcon");
      expect(nextButton).toBeTruthy();
    });
  });

  test("passing in query paramaters alters result list", async () => {
    await act(async () => {
      const { findAllByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "?page=1&limit=25",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const itemList = await findAllByTestId("row-item");
      expect(itemList).toHaveLength(25);
    });
  });

  test("Pagination handles the boundaries clean", async () => {
    await act(async () => {
      const { findAllByTestId, queryByTestId } = await render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter
            initialEntries={[
              {
                pathname: "/measures",
                search: "?page=5&limit=25",
                hash: "",
                state: undefined,
                key: "1fewtg",
              },
            ]}
          >
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const itemList = await findAllByTestId("row-item");
      expect(itemList).toHaveLength(10);
      expect(queryByTestId("NavigateNextIcon")).toBeNull();
    });
  });
});
