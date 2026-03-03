import * as React from "react";
import {
  render,
  fireEvent,
  cleanup,
  waitFor,
  screen,
} from "@testing-library/react";
import { act, Simulate } from "react-dom/test-utils";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { routesConfig } from "../measureRoutes/MeasureRoutes";

import {
  GroupPopulation,
  Measure,
  MeasureScoring,
  PopulationExpectedValue,
  TestCase,
} from "@madie/madie-models";
import MeasureEditor from "./editor/MeasureEditor";
// @ts-ignore
import {
  useMeasureServiceApi,
  MeasureServiceApi,
  measureStore,
  useFeatureFlags,
} from "@madie/madie-util";
import { oneItemResponse } from "../__mocks__/mockMeasureResponses";
import userEvent from "@testing-library/user-event";
import checkUserIsAdmin from "../../utils/checkUserIsAdmin";

jest.mock("./details/MeasureDetails");
jest.mock("./editor/MeasureEditor");
jest.mock("../common/createVersionDialog/CreateVersionDialog", () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="create-version-dialog">Create Version Dialog</div>
  )),
}));
jest.mock("../../utils/checkUserIsAdmin");

const mockCheckUserIsAdmin = checkUserIsAdmin as jest.MockedFunction<
  typeof checkUserIsAdmin
>;

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
  cqlLibraryName: "TestCql",
  model: "QI-Core v4.1.1",
  testCases: testCases,
  measureSetId: "MeasureSetId1",
  measureMetaData: {
    composite: false,
  },
} as unknown as Measure;

const mockMeasureServiceApi = {
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
  getRecentMeasuresByMeasureSetId: jest.fn().mockResolvedValue([measure]),
  fetchMeasure: jest.fn().mockResolvedValue(measure),
  getAllPopulationBasisOptions: jest.fn().mockResolvedValue([]),
  getReturnTypesForAllCqlDefinitions: jest.fn().mockResolvedValue({}),
  updateMeasure: jest.fn().mockResolvedValueOnce({ status: 200 }),
  createVersion: jest.fn().mockResolvedValue({ id: "newVersionId" }),
  deleteMeasure: jest.fn().mockResolvedValue({}),
  checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
  checkValidVersion: jest.fn().mockResolvedValue({ status: 200 }),
  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({
    "1": true,
    "2": true,
    "3": true,
  }),
  getMeasureHistoryLogs: jest.fn().mockResolvedValue([]),
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
  transferMeasures: jest.fn().mockResolvedValue({
    status: 200,
    data: [],
  }),
  draftMeasure: jest.fn().mockResolvedValue({ id: "newDraftId" }),
  unshareMeasures: jest.fn().mockResolvedValue({ measureId1: [] }),
} as unknown as MeasureServiceApi;

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(() => ({})),
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

describe("EditMeasure Component", () => {
  beforeEach(() => {
    measureStore.state.mockImplementation(() => measure);
    measure.testCases = testCases;
    mockCheckUserIsAdmin.mockReturnValue(false);
  });
  afterEach(cleanup);
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
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();

    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
  });

  it("should display a delete dialog when the event is triggered, discards.", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
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
    mockMeasureServiceApi.deleteMeasure = jest.fn().mockResolvedValue({
      status: 200,
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
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
    mockMeasureServiceApi.deleteMeasure = jest.fn().mockRejectedValueOnce({
      status: 500,
      response: { data: { message: "update failed" } },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
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
      expect(screen.getByRole("alert")).toHaveTextContent("update failed");
    });
  });

  it("delete fails without an error object", async () => {
    mockMeasureServiceApi.deleteMeasure = jest
      .fn()
      .mockRejectedValueOnce("I'm an error");
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
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
      expect(screen.getByRole("alert")).toHaveTextContent("I'm an error");
    });
  });

  it("should redirect to 404", async () => {
    mockMeasureServiceApi.fetchMeasure = jest.fn().mockRejectedValueOnce("404");

    renderRouter();
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/404");
    });
  });

  it("should display view human readable modal when the event is triggered, discards.", async () => {
    mockMeasureServiceApi.fetchMeasure = jest
      .fn()
      .mockResolvedValue(oneItemResponse);
    renderRouter();

    await findByTestId("editMeasure");
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    await waitFor(() => {
      expect(queryByTestId("loading")).toBeNull();
    });

    act(() => {
      window.dispatchEvent(new Event("view-humanreadable"));
    });

    const modal = await findByTestId("view-hr-modal");
    expect(modal).toBeInTheDocument();

    expect(screen.queryByText("test human readable")).toBeInTheDocument();

    const cancelButton = await findByTestId("human-readable-cancel-button");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText("test human readable")).not.toBeInTheDocument();
    });
  });

  it("should display a share dialog when the event is triggered and close dialog when cancel button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("share-measure"));
    });

    await waitFor(() => {
      expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
      expect(getByTestId("share-dialog")).toBeInTheDocument();
    });
    expect(mockMeasureServiceApi.getSharedMeasures).toHaveBeenCalled();
    expect(
      mockMeasureServiceApi.getRecentMeasuresByMeasureSetId
    ).toHaveBeenCalled();
    const cancelButton = getByTestId("share-cancel-button");
    fireEvent.click(cancelButton);
    expect(queryByTestId("share-dialog")).toBeVisible();
  });

  it("should display an unshare from me confirmation dialog when the event is triggered and close dialog when cancel button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("unshare-measure-from-me"));
    });

    await waitFor(() => {
      expect(getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    });

    const cancelButton = getByTestId("share-confirmation-dialog-cancel-button");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        queryByTestId("share-confirmation-dialog")
      ).not.toBeInTheDocument();
    });
  });

  it("should display an unshare from me confirmation dialog when the event is triggered and successfully unshare when accept button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("unshare-measure-from-me"));
    });

    await waitFor(() => {
      expect(getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    });

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(
        getByTestId("edit-measure-information-success-text")
      ).toBeInTheDocument();
    });
  });

  it("should display an unshare from me confirmation dialog when the event is triggered and fail to unshare when accept button is clicked", async () => {
    mockMeasureServiceApi.unshareMeasures = jest.fn().mockRejectedValueOnce({
      status: 500,
      response: { data: { message: "update failed" } },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("unshare-measure-from-me"));
    });

    await waitFor(() => {
      expect(getByTestId("share-confirmation-dialog")).toBeInTheDocument();
    });

    const acceptBtn = await screen.findByTestId(
      "share-confirmation-dialog-accept-button"
    );
    expect(acceptBtn).toBeEnabled();

    fireEvent.click(acceptBtn);

    const errorText = await screen.findByTestId(
      "edit-measure-information-generic-error-text"
    );
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent("update failed");
  });

  it("should display transfer dialog when the event is triggered and close dialog when cancel button is clicked", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-measure"));
    });

    await waitFor(() => {
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();
    });

    const cancelButton = getByTestId("transfer-cancel-button");
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });
  });

  it("should display transfer dialog when the event is triggered and handle a successful transfer", async () => {
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

        expect(mockMeasureServiceApi.transferMeasures).toBeCalledWith(
          [measure.id],
          "newUser",
          false
        );

        expect(queryByTestId("transfer-dialog")).not.toBeInTheDocument();
      }, 4500)
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

  // temporarily skipping as it has github build issues
  it("should create a draft and show success toast", async () => {
    renderRouter();

    act(() => {
      window.dispatchEvent(new Event("draft-measure"));
    });

    await waitFor(() => {
      expect(screen.getByText("Create Draft")).toBeInTheDocument();
    });

    const nameInput = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Draft Measure Name" } });

    const submitButton = screen.getByTestId("create-draft-continue-button");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMeasureServiceApi.draftMeasure).toHaveBeenCalledWith(
        measure.id,
        measure.model,
        "Draft Measure Name"
      );
      expect(
        screen.getByTestId("edit-measure-information-success-text")
      ).toBeInTheDocument();
    });
  });
  it("should display view measure history modal when the event is triggered, discards.", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
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
      }, 4000)
    );
  });

  it("should display a version dialog when the event is triggered, discards.", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("version-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("create-version-dialog")).toBeInTheDocument()
    );
  });

  it("Version succeeds.", async () => {
    mockMeasureServiceApi.unshareMeasures = jest
      .fn()
      .mockResolvedValue({ measureId1: [] });
    mockMeasureServiceApi.createVersion = jest.fn().mockResolvedValueOnce({
      status: 200,
      response: {
        data: {
          message: "Version created successfully.",
        },
      },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("version-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("create-version-dialog")).toBeInTheDocument()
    );
  });

  it("Version fails with 423.", async () => {
    mockMeasureServiceApi.createVersion = jest.fn().mockRejectedValueOnce({
      response: {
        status: 423,
        data: {
          message:
            "Unable to version measure. Locked while being edited by anotherUser.",
        },
      },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("version-measure"));
    });
    await waitFor(() =>
      expect(queryByTestId("create-version-dialog")).toBeInTheDocument()
    );

    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
  });

  // temporarily skipping as it has github build issues
  it.skip("Version fails with 400.", async () => {
    mockMeasureServiceApi.createVersion = jest.fn().mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: "Requested measure cannot be versioned",
        },
      },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("version-measure"));
    });
    await waitFor(() =>
      expect(
        queryByTestId("create-version-continue-button")
      ).toBeInTheDocument()
    );

    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");
    expect(getByTestId("create-version-continue-button")).not.toBeDisabled();

    const continueButton = await findByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    const errorText = await screen.findByTestId(
      "edit-measure-information-generic-error-text"
    );
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent(
      "Requested measure cannot be versioned"
    );
  });
  // temporarily skipping as it has github build issues
  it.skip("Version fails with 403.", async () => {
    mockMeasureServiceApi.createVersion = jest.fn().mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          message: "User is unauthorized to create a version",
        },
      },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("version-measure"));
    });
    await waitFor(() =>
      expect(
        queryByTestId("create-version-continue-button")
      ).toBeInTheDocument()
    );

    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");
    expect(getByTestId("create-version-continue-button")).not.toBeDisabled();

    const continueButton = await findByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    const errorText = await screen.findByTestId(
      "edit-measure-information-generic-error-text"
    );
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent(
      "User is unauthorized to create a version"
    );
  });
  // temporarily skipping as it has github build issues
  it.skip("Version fails with other errors.", async () => {
    mockMeasureServiceApi.createVersion = jest.fn().mockRejectedValueOnce({
      response: {
        status: 500,
        data: {
          message: "An unexpected error occurred",
        },
      },
    });
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();
    act(() => {
      window.dispatchEvent(new Event("version-measure"));
    });
    await waitFor(() =>
      expect(
        queryByTestId("create-version-continue-button")
      ).toBeInTheDocument()
    );

    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");
    expect(getByTestId("create-version-continue-button")).not.toBeDisabled();

    const continueButton = await findByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    const errorText = await screen.findByTestId(
      "edit-measure-information-generic-error-text"
    );
    expect(errorText).toBeInTheDocument();
    expect(errorText).toHaveTextContent("An unexpected error occurred");
  });
  // temporarily skipping as it has github build issues
  it.skip("shows error toast when draftMeasure fails", async () => {
    mockMeasureServiceApi.draftMeasure = jest.fn().mockRejectedValueOnce({
      response: { data: { message: "Draft failed" } },
    });
    renderRouter();

    act(() => {
      window.dispatchEvent(new Event("draft-measure"));
    });

    await waitFor(() => {
      expect(screen.getByText("Create Draft")).toBeInTheDocument();
    });

    const nameInput = await screen.findByRole("textbox", {
      name: "Measure Name",
    });
    fireEvent.change(nameInput, { target: { value: "Draft Measure Name" } });

    const submitButton = screen.getByTestId("create-draft-continue-button");
    fireEvent.click(submitButton);

    await waitFor(
      () => {
        expect(
          screen.getByTestId("edit-measure-information-generic-error-text")
        ).toHaveTextContent("Draft failed");
      },
      { timeout: 3000 }
    );
  });

  test("Renders in read-only mode when measure is locked", async () => {
    const lockedMeasure = {
      ...measure,
      measureLock: { lockedBy: "anotherUser" },
    };
    measureStore.state.mockImplementation(() => lockedMeasure);

    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();
    expect(mockMeasureServiceApi.fetchMeasure).toHaveBeenCalled();
    const loading = queryByTestId("loading");
    expect(loading).toBeNull();

    const detailsLink = await findByText("Details");
    expect(detailsLink).toBeInTheDocument();
    await waitFor(() => {
      expect(detailsLink).toHaveAttribute("aria-selected", "true");
    });
  });

  it("shouldn't render CQL Editor tab when it is a composite measure", async () => {
    measureStore.state.mockImplementation(() => measure);
    if (!measure.measureMetaData) {
      measure.measureMetaData = {};
    }
    measure.measureMetaData.composite = true;
    renderRouter();
    expect(await findByText("Details")).toBeInTheDocument();
    expect(await screen.queryByText("CQL Editor")).not.toBeInTheDocument();
    expect(await findByText("Population Criteria")).toBeInTheDocument();
    expect(
      await findByText(`Test Cases (${measure?.testCases?.length})`)
    ).toBeInTheDocument();
    const detailsLink = await findByText("Details");
    await waitFor(() => {
      expect(detailsLink).toHaveAttribute("aria-selected", "true");
    });
  });
});
