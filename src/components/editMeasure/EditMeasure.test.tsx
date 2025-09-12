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
import {
  GroupPopulation,
  Measure,
  MeasureScoring,
  PopulationExpectedValue,
  TestCase,
} from "@madie/madie-models";
import MeasureEditor from "./editor/MeasureEditor";
// @ts-ignore
import { measureStore, useFeatureFlags } from "@madie/madie-util";
import { oneItemResponse } from "../__mocks__/mockMeasureResponses";

jest.mock("./details/MeasureDetails");
jest.mock("./editor/MeasureEditor");
jest.mock("../../api/useMeasureServiceApi");

const useMeasureServiceApiMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;

const MeasureEditorMock = MeasureEditor as jest.Mock<JSX.Element>;

MeasureEditorMock.mockImplementation(() => {
  return <div>library testCql version '1.0.000'</div>;
});

const testCases = [
  {
    id: "1",
    description: "Test IPP",
    title: "WhenAllGood",
    series: "IPP-Pass",
    validResource: true,
    json: "{}",
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: true,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
  },
  {
    id: "2",
    description: "Test IPP Fail when something is wrong",
    title: "WhenSomethingIsWrong",
    series: "IPP-Fail",
    validResource: true,
    json: "{}",
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: false,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
  },
  {
    id: "3",
    description: "Invalid test case",
    title: "WhenJsonIsInvalid",
    series: "IPP-Fail",
    validResource: false,
    json: "{}",
    groupPopulations: [
      {
        groupId: "1",
        scoring: MeasureScoring.PROPORTION,
        populationValues: [
          {
            name: "initialPopulation",
            expected: false,
          },
          {
            name: "denominator",
            expected: false,
          },
          {
            name: "numerator",
            expected: true,
          },
        ] as PopulationExpectedValue[],
      },
    ] as GroupPopulation[],
  },
] as TestCase[];

const mockedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockedNavigate,
}));

const measure = {
  id: "measure ID",
  createdBy: "testuser@example.com",
  model: "QI-Core v4.1.1",
  testCases: testCases,
  measureSetId: "MeasureSetId1",
} as Measure;

const serviceApiMock = {
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
  getRecentMeasuresByMeasureSetId: jest.fn().mockResolvedValue([measure]),
  fetchMeasure: jest.fn().mockResolvedValue(measure),
  getAllPopulationBasisOptions: jest.fn().mockResolvedValue([]),
  getReturnTypesForAllCqlDefinitions: jest.fn().mockResolvedValue({}),
  updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
  createVersion: jest.fn().mockResolvedValue({}),
  deleteMeasure: jest.fn().mockResolvedValue({}),
  checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
  checkValidVersion: jest.fn().mockResolvedValue({}),
  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({
    "1": true,
    "2": true,
    "3": true,
  }),
  getMeasureExport: jest
    .fn()
    .mockResolvedValue({ size: 635581, type: "application/octet-stream" }),
  getReturnTypesForAllCqlFunctions: jest.fn().mockResolvedValue({}),
  fetchHumanReadable: jest.fn().mockResolvedValue("test human readable"),
  getSharedMeasures: jest.fn().mockResolvedValue({
    measureId1: ["userId1"],
    measureId2: ["userId1", "userId2"],
  }),
  getMeasuresByMeasureSetId: jest.fn().mockImplementation((measureSetId) => {
    return [measure];
  }),
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
  useFeatureFlags: jest.fn(() => ({
    TransferMeasure: true,
  })),
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

const serviceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  qdmElmTranslationService: {
    baseUrl: "",
  },
  fhirElmTranslationService: {
    baseUrl: "",
  },
  terminologyService: { baseUrl: "" },
} as ServiceConfig;

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
  beforeEach(() => {
    measureStore.state.mockImplementation(() => measure);
    measure.testCases = testCases;
  });
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
    expect(
      await findByText(`Test Cases (${measure?.testCases?.length})`)
    ).toBeInTheDocument();
    const detailsLink = await findByText("Details");
    await waitFor(() => {
      expect(detailsLink).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should render edit measure menu with zero test cases", async () => {
    measure.testCases = [];
    renderRouter();
    //verify all menus present in the dom
    expect(await findByText("Details")).toBeInTheDocument();
    expect(await findByText("CQL Editor")).toBeInTheDocument();
    expect(await findByText("Population Criteria")).toBeInTheDocument();
    expect(await findByText(`Test Cases (0)`)).toBeInTheDocument();
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
    waitFor(() =>
      renderRouter([{ pathname: "/measures/fakeid/edit/groups/1" }])
    );
    const popCriteria = await screen.findByTestId("groups-tab");
    expect(popCriteria).toHaveAttribute("aria-selected", "true");
  });

  it("should render test-cases", async () => {
    renderRouter([{ pathname: "/measures/fakeid/edit/test-cases/" }]);
    const tcLink = await screen.findByTestId("patients-tab");
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
    useMeasureServiceApiMock.mockImplementationOnce(() => {
      return serviceApiRejectedMock;
    });
    renderRouter();
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/404");
    });
  });

  it("should display view human readable modal when the event is triggered, discards.", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    setTimeout(() => {
      expect(loading).toBeNull();
    }, 500);

    act(() => {
      window.dispatchEvent(new Event("view-humanreadable"));
    });

    await waitFor(() =>
      setTimeout(() => {
        expect(queryByTestId("view-hr-modal")).toBeInTheDocument();
      }, 1000)
    );

    setTimeout(async () => {
      const cancelButton = await findByTestId("modal-secondary-btn");
      fireEvent.click(cancelButton);
    }, 500);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "The human readable file is not available for this measure.  Contact Help Desk for additional information."
        )
      ).not.toBeInTheDocument();
    });
  });

  it("should display a share dialog when the event is triggered and close dialog when cancel button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("share-measure"));
    });

    await waitFor(async () => {
      expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
      expect(getByTestId("share-dialog")).toBeInTheDocument();
    });
    expect(serviceApiMock.getSharedMeasures).toHaveBeenCalled();
    expect(serviceApiMock.getRecentMeasuresByMeasureSetId).toHaveBeenCalled();
    const cancelButton = getByTestId("share-cancel-button");
    fireEvent.click(cancelButton);
    expect(queryByTestId("share-dialog")).toBeVisible();
  });

  it("should display transfer dialog when the event is triggered and close dialog when cancel button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-measure"));
    });

    await waitFor(async () => {
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();
    });

    const cancelButton = getByTestId("transfer-cancel-button");
    fireEvent.click(cancelButton);
    await waitFor(async () => {
      expect(queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });
  });

  it("should display transfer dialog when the event is triggered and close dialog when continue button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-measure"));
    });

    await waitFor(() =>
      setTimeout(() => {
        expect(getByTestId("transfer-dialog")).toBeInTheDocument();

        const newHarpIdInput = getByTestId("harp-id-input");
        expect(newHarpIdInput).toBeInTheDocument();
        expect(newHarpIdInput.value).toBe("");
        const transferBtn = getByTestId("transfer-save-button");
        expect(transferBtn).toBeInTheDocument();
        expect(transferBtn).toBeDisabled();

        fireEvent.change(newHarpIdInput, {
          target: { value: "newUser" },
        });
        expect(newHarpIdInput.value).toBe("newUser");
        expect(transferBtn).toBeEnabled();

        fireEvent.click(transferBtn);

        expect(queryByTestId("transfer-dialog")).not.toBeInTheDocument();
      }, 1000)
    );
  });

  it("pressing Space on a tab prevents default and triggers click", async () => {
    renderRouter([{ pathname: "/measures/fakeid/edit/details/" }]);

    const editorTab = await findByText("CQL Editor");
    const clickSpy = jest.spyOn(editorTab, "click");
    const preventDefault = jest.fn();

    fireEvent.keyDown(editorTab, { key: " ", preventDefault });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("should display view human readable modal when the event is triggered, discards.", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(serviceApiMock.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    setTimeout(() => {
      expect(loading).toBeNull();
    }, 500);

    act(() => {
      window.dispatchEvent(new Event("view-measure-history"));
    });

    await waitFor(() =>
      setTimeout(() => {
        expect(queryByTestId("view-measure-history")).toBeInTheDocument();
      }, 1000)
    );

    setTimeout(async () => {
      const cancelButton = await findByTestId("modal-secondary-btn");
      fireEvent.click(cancelButton);
    }, 500);

    await waitFor(() => {
      expect(
        screen.queryByText(
          "The human readable file is not available for this measure.  Contact Help Desk for additional information."
        )
      ).not.toBeInTheDocument();
    });
  });
});
