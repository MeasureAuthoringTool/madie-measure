import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MeasureRoutes } from "../measureRoutes/MeasureRoutes";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import {
  oneItemResponse,
  multipleItemsResponse,
} from "../measureRoutes/mockMeasureResponses";
import MeasureLanding from "./MeasureLanding";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
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
    jest.clearAllMocks();
  });

  test("shows my measures on page load", async () => {
    await act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const measure1 = await screen.findByText("TestMeasure1");
      expect(measure1).toBeInTheDocument();
      expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
        true,
        10,
        0
      );
      const myMeasuresTab = screen.getByRole("tab", { name: "My Measures" });
      expect(myMeasuresTab).toBeInTheDocument();
      expect(myMeasuresTab).toHaveClass("Mui-selected");
      const allMeasuresTab = screen.getByRole("tab", { name: "All Measures" });
      expect(allMeasuresTab).toBeInTheDocument();
      expect(allMeasuresTab).not.toHaveClass("Mui-selected");
    });
  });

  test("shows all measures measures on tab click", async () => {
    await act(async () => {
      const { findByTestId } = render(
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
      const measure1 = await screen.findByText("TestMeasure1");
      expect(measure1).toBeInTheDocument();
      expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
        true,
        10,
        0
      );
      const myMeasuresTab = await findByTestId("my-measures-tab");
      userEvent.click(myMeasuresTab);
      expect(myMeasuresTab).toHaveClass("Mui-selected");

      const allMeasuresTab = await findByTestId("all-measures-tab");
      userEvent.click(allMeasuresTab);
      expect(allMeasuresTab).toHaveClass("Mui-selected");
      await waitFor(() =>
        expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
          false,
          10,
          0
        )
      );
    });
  });

  test("Search measure should call search api with search criteria", async () => {
    await act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureLanding />
          </MemoryRouter>
        </ApiContextProvider>
      );
    });
    const searchFieldInput = screen.getByTestId("searchMeasure-input");
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);
    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).toHaveBeenCalledWith(true, 10, 0, "test");
  });

  test("Create event triggers the event listener", async () => {
    await act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
    });
    const event = new Event("create");
    window.dispatchEvent(event);
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0
    );
  });
  test("test pagination page button", async () => {
    await act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
    });
    const pageButton = screen.getByRole("button", {
      name: /page 1/i,
    });
    userEvent.click(pageButton);
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
  });

  test("test pagination page limit change", async () => {
    await act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
    });

    const pageLimit10Button = screen.getByRole("button", {
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
});
