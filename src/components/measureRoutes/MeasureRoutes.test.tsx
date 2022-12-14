import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import MeasureBrowserRoutes, { MeasureRoutes } from "./MeasureRoutes";
import { MemoryRouter } from "react-router";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { describe, expect, test } from "@jest/globals";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";

jest.mock("../../api/useMeasureServiceApi");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const MEASURE_CREATEDBY = "testuser@example.com";
const measure = {
  id: "measure ID",
  createdBy: MEASURE_CREATEDBY,
} as Measure;

const serviceApiMock = {
  fetchMeasure: jest.fn().mockResolvedValue(measure),
  fetchMeasures: jest.fn().mockResolvedValue({
    content: [measure],
    totalPages: 1,
    totalElements: 1,
    numberOfElements: 1,
    pageable: {
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      offset: 0,
      pageNumber: 0,
      pageSize: 10,
      paged: true,
      unpaged: false,
    },
  }),
} as unknown as MeasureServiceApi;

useMeasureServiceApiMock.mockImplementation(() => {
  return serviceApiMock;
});

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
  }),
  measureStore: {
    state: null,
    initialState: null,
    updateMeasure: (measure) => measure,
  },
}));

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
};

jest.mock("../notfound/NotFound", () => () => {
  return (
    <div data-testid="notfound-component-mocked">404 NotFound Component</div>
  );
});
jest.mock("../editMeasure/EditMeasure", () => () => {
  return <div data-testid="editMeasure">EditMeasure</div>;
});

const { findByTestId } = screen;
// react no op error is caused by two awaits in one it call. ignorable.
describe("Measure Router", () => {
  test("Render a default notFound page", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "",
              search: "",
              hash: "",
              state: undefined,
              key: "1fewtg",
            },
          ]}
        >
          <MeasureBrowserRoutes />
        </MemoryRouter>
      </ApiContextProvider>
    );
    const notFound = await findByTestId("notfound-component-mocked");
    expect(notFound).toBeInTheDocument();
  });

  test("Router routes to measureLanding", async () => {
    render(
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
    const measureLanding = await findByTestId("measure-landing");
    expect(measureLanding).toBeInTheDocument();
  });

  test("Router routes to EditMeasure", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/measures/test/edit",
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
    const EditMeasure = await findByTestId("editMeasure");
    expect(EditMeasure).toBeInTheDocument();
  });
});
