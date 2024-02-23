import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { routesConfig } from "./MeasureRoutes";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ServiceConfig } from "../../api/ServiceContext";
import { describe, expect, test } from "@jest/globals";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";

jest.mock("../../api/useMeasureServiceApi");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
}));

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
  useFeatureFlags: () => null,
}));

const serviceConfig: ServiceConfig = {
  terminologyService: { baseUrl: "example-service-url" },
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

const renderRouter = (initialEntries) => {
  const router = createMemoryRouter(routesConfig, {
    initialEntries: initialEntries,
  });
  render(<RouterProvider router={router} />);
};

describe("Measure Router", () => {
  test("Render a default notFound page", async () => {
    renderRouter([
      {
        pathname: "/test",
        search: "",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);
    const notFound = await findByTestId("notfound-component-mocked");
    expect(notFound).toBeInTheDocument();
  });

  test("Router routes to measureLanding", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);
    const measureLanding = screen.getByTestId("measure-landing");
    expect(measureLanding).toBeInTheDocument();
  });

  test("Router routes to EditMeasure", async () => {
    renderRouter([
      {
        pathname: "/measures/test/edit",
        search: "",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);
    const EditMeasure = await findByTestId("editMeasure");
    expect(EditMeasure).toBeInTheDocument();
  });
});
