import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MeasureRoutes } from "../MeasureLanding/MeasureLanding";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { act } from "react-dom/test-utils";
import { mockPaginationResponses } from "../measureLanding/mockMeasureResponses";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("../../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "test.jwt",
}));

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn(mockPaginationResponses),
  //   fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

describe("Measures Pagination", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("On Page load, 10 measures are displayed by default  ", async () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      await waitFor(() => {
        const itemList = screen.getAllByTestId("row-item");
        expect(itemList).toHaveLength(10);
        const nextButton = screen.getByLabelText("Go to next page");
        expect(nextButton).toBeInTheDocument();
        const prevButton = screen.getByLabelText("Go to previous page");
        expect(prevButton).toBeNull();
      });
    });
  });

  test("On First page, previous button is hidden, next is available  ", async () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      await waitFor(() => {
        const itemList = screen.getAllByTestId("row-item");
        const nextButton = screen.getByLabelText("Go to next page");
        expect(nextButton).toBeInTheDocument();
        const prevButton = screen.getByLabelText("Go to previous page");
        expect(prevButton).toBeNull();
      });
    });
  });

  test("passing in query paramaters alters result list", async () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures?page=1&limit=25"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      await waitFor(() => {
        const itemList = screen.getAllByTestId("row-item");
        expect(itemList).toHaveLength(25);
      });
    });
  });

  test("Boundaries of requests display correct amount of items on screen", async () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures?page=4&limit=25"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      await waitFor(() => {
        const itemList = screen.getAllByTestId("row-item");
        expect(itemList).toHaveLength(10);
      });
    });
  });

  test("On Last page next button is hidden, prev is available", async () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures?page=4&limit=25"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      await waitFor(() => {
        const nextButton = screen.getByLabelText("Go to next page");
        expect(nextButton).toBeNull();
        const prevButton = screen.getByLabelText("Go to previous page");
        expect(prevButton).toBeInTheDocument();
      });
    });
  });
});
