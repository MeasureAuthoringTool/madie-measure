import * as React from "react";
import { render, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { MemoryRouter } from "react-router";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import EditMeasure from "./EditMeasure";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../api/useMeasureServiceApi";
import { Measure } from "@madie/madie-models";
import MeasureEditor from "../measureEditor/MeasureEditor";
import { measureStore } from "@madie/madie-util";

jest.mock("./measureDetails/MeasureDetails");
jest.mock("../measureEditor/MeasureEditor");
jest.mock("../../api/useMeasureServiceApi");

const setErrorMessage = jest.fn();
const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const MeasureEditorMock = MeasureEditor as jest.Mock<JSX.Element>;

MeasureEditorMock.mockImplementation(() => {
  return <div>library testCql version '1.0.000'</div>;
});

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
    getUserName: jest.fn(() => "testuser@example.com"), //#nosec
    getAccessToken: () => "test.jwt",
  })),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: (set) => {
      return { unsubscribe: () => null };
    },
  },
  routeHandlerStore: {
    subscribe: (set) => {
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

// mocking useHistory
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useHistory: () => {
    const push = (val) => mockPush(val);
    return { push, block: () => null };
  },
}));

afterEach(cleanup);

describe("EditMeasure Component", () => {
  measureStore.state.mockImplementationOnce(() => null);
  it("should render a loading page if the measure is not yet loaded", async () => {
    const { getByTestId, findByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const result = getByTestId("loading");
    expect(result).toBeInTheDocument();
    await findByTestId("editMeasure"); // let the rendering finish
  });

  it("should render the EditMeasure contents after the measure is loaded", async () => {
    const { findByTestId, queryByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();

    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
  });

  it("should display a delete dialog when the event is triggered, discards.", async () => {
    const { findByTestId, queryByTestId, queryByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

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
    const { findByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    //verify all menus present in the dom
    expect(await findByText("Details")).toBeInTheDocument();
    expect(await findByText("CQL Editor")).toBeInTheDocument();
    expect(await findByText("Population Criteria")).toBeInTheDocument();
    expect(await findByText("Test Cases")).toBeInTheDocument();
    expect((await findByText("Details")).classList).toContain("active");
  });

  it("should render respective menu contents on clicking menu items", async () => {
    const { findByText } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

    // CQL Editor Menu click action
    fireEvent.click(await findByText("CQL Editor"));
    expect((await findByText("CQL Editor")).classList).toContain("active");
    expect(document.body.textContent).toContain(
      "library testCql version '1.0.000'"
    );

    // Measure Groups Menu click action
    fireEvent.click(await findByText("Population Criteria"));
    expect((await findByText("Population Criteria")).classList).toContain(
      "active"
    );

    // Test Cases Menu click action
    fireEvent.click(await findByText("Test Cases"));
    expect((await findByText("Test Cases")).classList).toContain("active");
    expect(document.body.textContent).toContain("Patient Component");
  });

  it("delete succeeds", async () => {
    const { findByTestId, queryByTestId, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

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
  });

  it("delete fails", async () => {
    serviceApiMock.updateMeasure = jest.fn().mockRejectedValueOnce({
      status: 500,
      response: { data: { message: "update failed" } },
    });
    const { findByTestId, queryByTestId, getByTestId } = render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );

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

  it("should redirect to 404", async () => {
    const serviceApiRejectedMock = {
      fetchMeasure: jest.fn().mockRejectedValue("404"),
    } as unknown as MeasureServiceApi;
    useMeasureServiceApiMock.mockImplementation(() => {
      return serviceApiRejectedMock;
    });
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter initialEntries={["/"]}>
          <EditMeasure />
        </MemoryRouter>
      </ApiContextProvider>
    );
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/404");
    });
  });
});
