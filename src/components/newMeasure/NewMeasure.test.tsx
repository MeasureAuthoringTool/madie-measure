import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import NewMeasure from "./NewMeasure";
import { MeasureScoring } from "../../models/MeasureScoring";
import { Model } from "../../models/Model";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";

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

describe("Measure Page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shows my measures on page load", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewMeasure />
      </ApiContextProvider>
    );
    expect(screen.getByTestId("create-new-measure-button")).toBeTruthy();
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(true);
    const myMeasuresTab = screen.getByRole("tab", { name: "My Measures" });
    expect(myMeasuresTab).toBeInTheDocument();
    expect(myMeasuresTab).toHaveClass("Mui-selected");
    const allMeasuresTab = screen.getByRole("tab", { name: "All Measures" });
    expect(allMeasuresTab).toBeInTheDocument();
    expect(allMeasuresTab).not.toHaveClass("Mui-selected");
  });

  test("shows all measures measures on tab click", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewMeasure />
      </ApiContextProvider>
    );
    expect(screen.getByTestId("create-new-measure-button")).toBeTruthy();
    const measure1 = await screen.findByText("TestMeasure1");
    expect(measure1).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(true);
    const myMeasuresTab = screen.getByRole("tab", { name: "My Measures" });
    expect(myMeasuresTab).toHaveClass("Mui-selected");
    const allMeasuresTab = screen.getByRole("tab", { name: "All Measures" });
    mockMeasureServiceApi.fetchMeasures = jest.fn().mockResolvedValue([
      ...measures,
      {
        id: "ab123",
        measureHumanReadableId: "ab123",
        measureSetId: null,
        version: 1.2,
        revisionNumber: 12,
        state: "NA",
        measureName: "TestMeasure2",
        cqlLibraryName: "TestLib2",
        measureScoring: MeasureScoring.COHORT,
        cql: null,
        createdAt: null,
        createdBy: "TestUser2",
        lastModifiedAt: null,
        lastModifiedBy: "TestUser2",
        model: Model.QICORE,
        measureMetaData: null,
      },
    ]);

    userEvent.click(allMeasuresTab);
    const measure2 = await screen.findByText("TestMeasure2");
    expect(measure2).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(false);
  });
});
