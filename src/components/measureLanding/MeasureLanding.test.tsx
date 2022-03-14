import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { MeasureRoutes } from "./MeasureLanding";
import { MemoryRouter } from "react-router";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { act } from "react-dom/test-utils";
import { oneItemResponse } from "../measureLanding/mockMeasureResponses";

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
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

// react no op error is caused by two awaits in one it call. ignorable.
describe("MeasureLanding", () => {
  test("renders create new measure screen on button click", () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      expect(screen.getByTestId("create-new-measure-button")).toBeTruthy();
      const measure1 = await screen.findByText("TestMeasure1");
      expect(measure1).toBeInTheDocument();
      const newMeasureBtn = screen.getByRole("button", { name: "New Measure" });
      userEvent.click(newMeasureBtn);
      const measureNameInput = await screen.findByRole("textbox", {
        name: "Measure Name",
      });
      expect(measureNameInput).toBeInTheDocument();
    });
  });

  test("renders create new measure screen on button click", () => {
    act(async () => {
      render(
        <ApiContextProvider value={serviceConfig}>
          <MemoryRouter initialEntries={["/measures"]}>
            <MeasureRoutes />
          </MemoryRouter>
        </ApiContextProvider>
      );
      const measure1 = await screen.findByText("TestMeasure1");
      expect(measure1).toBeInTheDocument();
    });
  });
});
