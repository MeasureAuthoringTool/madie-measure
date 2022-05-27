import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { MeasureRoutes } from "../MeasureRoutes/MeasureRoutes";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { act } from "react-dom/test-utils";
import { oneItemResponse } from "../MeasureRoutes/mockMeasureResponses";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("@madie/madie-util");

const mockMeasureServiceApi = {
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
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
});
