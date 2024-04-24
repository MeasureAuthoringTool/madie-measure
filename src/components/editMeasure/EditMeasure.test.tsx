import * as React from "react";
import {
  render,
  fireEvent,
  cleanup,
  waitFor,
  screen,
} from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routesConfig } from "../measureRoutes/MeasureRoutes";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import MeasureEditor from "./editor/MeasureEditor";
import { measureStore } from "@madie/madie-util";

jest.mock("./details/MeasureDetails");
jest.mock("./editor/MeasureEditor");
jest.mock("../../api/useMeasureServiceApi");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const MeasureEditorMock = MeasureEditor as jest.Mock<JSX.Element>;

MeasureEditorMock.mockImplementation(() => {
  return <div>library testCql version '1.0.000'</div>;
});

const mockedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

const measure = {
  id: "measure ID",
  createdBy: "testuser@example.com",
} as Measure;

const serviceApiMock = {
  fetchMeasure: jest.fn().mockResolvedValue(measure),
  getAllPopulationBasisOptions: jest.fn().mockResolvedValue([]),
  getReturnTypesForAllCqlDefinitions: jest.fn().mockResolvedValue({}),
  updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
} as unknown as MeasureServiceApi;

useMeasureServiceApiMock.mockImplementation(() => {
  return serviceApiMock;
});

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn(),
  useFeatureFlags: () => ({}),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: () => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: jest.fn((routeObj) => routeObj),
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  elmTranslationService: {
    baseUrl: "",
  },
  terminologyService: { baseUrl: "" },
};

const { getByTestId, findByTestId, queryByTestId, queryByText, findByText } =
  screen;

const renderRouter = (
  initialEntries = [{ pathname: "/measures/fakeid/edit/details/" }]
) => {
  const router = createMemoryRouter(routesConfig, {
    initialEntries,
  });

  render(
    <ApiContextProvider value={serviceConfig}>
      <RouterProvider router={router} />
    </ApiContextProvider>
  );
};
afterEach(cleanup);

describe("EditMeasure Component", () => {
  measureStore.state.mockImplementationOnce(() => null);
  it("should render a loading page if the measure is not yet loaded", async () => {
    renderRouter();
    const result = getByTestId("loading");
    expect(result).toBeInTheDocument();
    await findByTestId("editMeasure"); // let the rendering finish
  });

  it("should render the EditMeasure contents after the measure is loaded", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();

    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
  });

  it("should display a delete dialog when the event is triggered, discards.", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("delete-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("delete-measure-dialog-button")).toBeInTheDocument()
    );
    const cancelButton = await findByTestId("cancel-delete-measure-button");
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByText("Are you sure you want to delete")).not.toBeVisible();
    });
  });

  it("should render edit measure menu with measure details page active by default", async () => {
    renderRouter();

    //verify all menus present in the dom
    expect(await findByText("Details")).toBeInTheDocument();
    expect(await findByText("CQL Editor")).toBeInTheDocument();
    expect(await findByText("Population Criteria")).toBeInTheDocument();
    expect(await findByText("Test Cases")).toBeInTheDocument();
    const detailsLink = await findByText("Details");
    await waitFor(() => {
      expect(detailsLink).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should render editor", async () => {
    renderRouter([{ pathname: "/measures/fakeid/edit/cql-editor/" }]);
    const editorLink = await findByText("CQL Editor");
    expect(editorLink).toHaveAttribute("aria-selected", "true");
  });

  it("should render details", async () => {
    renderRouter([{ pathname: "/measures/fakeid/edit/details/" }]);
    const detailsLink = await findByText("Details");
    expect(detailsLink).toHaveAttribute("aria-selected", "true");
  });

  it("should render popCriteria", async () => {
    renderRouter([{ pathname: "/measures/fakeid/edit/groups/1" }]);
    const popCriteria = await findByText("Population Criteria");
    expect(popCriteria).toHaveAttribute("aria-selected", "true");
  });
  it("should render test-cases", async () => {
    renderRouter([{ pathname: "/measures/fakeid/edit/test-cases/" }]);
    const tcLink = await findByText("Test Cases");
    expect(tcLink).toHaveAttribute("aria-selected", "true");
  });

  it("delete succeeds", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("delete-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("delete-measure-dialog-button")).toBeInTheDocument()
    );
    const continueButton = await findByTestId("delete-measure-button-2");
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(
        getByTestId("edit-measure-information-success-text")
      ).toBeInTheDocument();
    });
    const closeButton = getByTestId("close-error-button");
    act(() => {
      fireEvent.click(closeButton);
    });

    await waitFor(() => {
      const closeButton = queryByTestId('"close-error-button"');
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  it("delete fails", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValueOnce({
      status: 500,
      response: { data: { message: "update failed" } },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("delete-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("delete-measure-dialog-button")).toBeInTheDocument()
    );
    const continueButton = await findByTestId("delete-measure-button-2");
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(getByTestId("edit-measure-alert")).toBeInTheDocument();
    });
  });

  it("delete fails without an error object", async () => {
    serviceApiMock.updateMeasure = jest
      .fn()
      .mockRejectedValueOnce("I'm an error");
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("delete-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("delete-measure-dialog-button")).toBeInTheDocument()
    );
    const continueButton = await findByTestId("delete-measure-button-2");
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(queryByText("Are you sure you want to delete")).not.toBeVisible();
      expect(getByTestId("edit-measure-alert")).toBeInTheDocument();
    });
  });

  it("should redirect to 404", async () => {
    const serviceApiRejectedMock = {
      fetchMeasure: jest.fn().mockRejectedValue("404"),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => {
      return serviceApiRejectedMock;
    });
    renderRouter();
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/404");
    });
  });
});
