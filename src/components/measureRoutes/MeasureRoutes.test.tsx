import { jest } from "@jest/globals";
import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { routesConfig } from "./MeasureRoutes";
import { createMemoryRouter, RouterProvider } from "react-router";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  }),
}));

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

const mockUser = "TestUser1";
jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => mockUser,
  }),
  useFeatureFlags: () => {
    return {
      MeasureListCheckboxes: false,
    };
  }, // Values of flags do not matter for these tests
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  checkUserCanDelete: jest.fn(() => {
    return true;
  }),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
}));

jest.mock("../notfound/NotFound", () => () => {
  return (
    <div data-testid="notfound-component-mocked">404 NotFound Component</div>
  );
});
jest.mock("../editMeasure/EditMeasure", () => () => {
  return <div data-testid="editMeasure">EditMeasure</div>;
});
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
    await waitFor(() => {
      const notFound = screen.getByTestId("notfound-component-mocked");
      expect(notFound).toBeInTheDocument();
    });
  });

  test("Router routes to measureLanding", async () => {
    renderRouter([
      {
        pathname: "/measures",
        search: "?page=1&limit=10",
        hash: "",
        state: undefined,
        key: "1fewtg",
      },
    ]);
    await waitFor(() => {
      const measureLanding = screen.getByTestId("measure-landing");
      expect(measureLanding).toBeInTheDocument();
    });
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
    const EditMeasure = await screen.findByTestId("editMeasure");
    expect(EditMeasure).toBeInTheDocument();
  });
});
