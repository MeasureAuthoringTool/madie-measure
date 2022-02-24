import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import MeasureLanding, { MeasureRoutes } from "./MeasureLanding";
import { MemoryRouter } from "react-router";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Model } from "../../models/Model";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";

const measures = [
  {
    id: "ab123",
    measureHumanReadableId: "ab123",
    measureSetId: null,
    version: 1.2,
    revisionNumber: 12,
    state: "NA",
    measureName: "TestMeasure1",
    cqlLibraryName: "TestLib1",
    measureScoring: MeasureScoring.COHORT,
    cql: null,
    createdAt: null,
    createdBy: "TestUser1",
    lastModifiedAt: null,
    lastModifiedBy: "TestUser1",
    model: Model.QICORE,
    measureMetaData: null,
  },
];

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
  fetchMeasures: jest.fn().mockResolvedValue(measures),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

describe("MeasureLanding", () => {
  test("shows the children when the checkbox is checked", async () => {
    render(
      <div id="main">
        <MeasureLanding />
      </div>
    );

    expect(screen.getByTestId("browser-router")).toBeTruthy();
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
  });

  test("renders create new measure screen on button click", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/measure"]}>
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
