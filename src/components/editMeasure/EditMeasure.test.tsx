import * as mockCmsIdStubs from "../../__mocks__/cmsIdFormatterStubs";
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
  useUserRoles,
} from "@madie/madie-util";
import { oneItemResponse } from "../__mocks__/mockMeasureResponses";
import userEvent from "@testing-library/user-event";

jest.mock("./details/MeasureDetails");
jest.mock("./editor/MeasureEditor");
jest.mock("../common/createVersionDialog/CreateVersionDialog", () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-testid="create-version-dialog">Create Version Dialog</div>
  )),
}));

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
  updateMeasureLock: jest.fn().mockResolvedValue({}),
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

const mockMeasureReviewServiceApi = {
  getMeasureReview: jest.fn().mockResolvedValue(null),
  createMeasureReview: jest.fn().mockResolvedValue({ id: "new-review-id" }),
  updateMeasureReview: jest
    .fn()
    .mockResolvedValue({ id: "existing-review-id" }),
};

jest.mock("@madie/madie-util", () => ({
  ...mockCmsIdStubs,
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useMeasureReviewServiceApi: jest.fn(() => mockMeasureReviewServiceApi),
  useUserServiceApi: jest.fn(() => ({ getOwnerDetails: jest.fn() })),
  exportMeasure: jest.fn(),
  ExportDialog: ({ open }: any) =>
    open ? <div data-testid="export-dialog">Export Dialog</div> : null,
  ViewHRModal: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="hr-modal-container">
        View HR Modal
        <button data-testid="human-readable-cancel-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null,
  ViewMeasureHistoryDialog: ({ open }: any) =>
    open ? (
      <div data-testid="view-measure-history-dialog">Measure History</div>
    ) : null,
  // ShareDialog behavior is covered by @madie/madie-util's ShareDialog.test.
  ShareDialog: ({ open }: any) =>
    open ? <div data-testid="share-dialog">Share Dialog</div> : null,
  TransferDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="transfer-dialog">
        Transfer Dialog
        <button
          data-testid="transfer-success"
          onClick={() =>
            onClose({ toastType: "success", toastMessage: "", toastOpen: true })
          }
        >
          Transfer Success
        </button>
        <button data-testid="transfer-cancel-button" onClick={() => onClose()}>
          Cancel
        </button>
      </div>
    ) : null,
  ManageReviewDialog: ({ open, entityType, entityId }: any) =>
    open ? (
      <div data-testid="manage-review-dialog">
        Manage Review Dialog {entityType} {entityId}
      </div>
    ) : null,
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(() => ({})),
  useUserRoles: jest.fn(() => ({
    roles: [],
    isAdmin: false,
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

describe("EditMeasure Component", () => {
  beforeEach(() => {
    measureStore.state.mockImplementation(() => measure);
    measure.testCases = testCases;
    mockedNavigate.mockClear();
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

  it("should open the Manage Review dialog for reviewers when the review event is triggered", async () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: true,
    });
    renderRouter();

    await findByTestId("editMeasure");
    act(() => {
      window.dispatchEvent(new Event("review-measure"));
    });

    await waitFor(() =>
      expect(queryByTestId("manage-review-dialog")).toBeInTheDocument()
    );
    expect(queryByTestId("review-dialog")).not.toBeInTheDocument();
  });

  it("should open the mark ready for review dialog for non reviewers when the review event is triggered", async () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: [],
      isAdmin: false,
      isReviewer: false,
    });
    renderRouter();

    await findByTestId("editMeasure");
    act(() => {
      window.dispatchEvent(new Event("review-measure"));
    });

    await waitFor(() =>
      expect(queryByTestId("review-dialog")).toBeInTheDocument()
    );
    expect(queryByTestId("manage-review-dialog")).not.toBeInTheDocument();
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
      expect(queryByTestId("delete-dialog")).toBeInTheDocument()
    );
    const cancelButton = await findByTestId("delete-dialog-cancel-button");
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByTestId("delete-dialog")).not.toBeInTheDocument();
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

  it.each([
    "/measures/fakeid/edit/supplemental-data",
    "/measures/fakeid/edit/risk-adjustment",
  ])(
    "should keep Population Criteria tab highlighted when navigating to %s",
    async (pathname) => {
      renderRouter([{ pathname }]);
      const popCriteria = await screen.findByTestId("groups-tab");
      expect(popCriteria).toHaveAttribute("aria-selected", "true");
    }
  );

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
      expect(queryByTestId("delete-dialog")).toBeInTheDocument()
    );
    const continueButton = await findByTestId("delete-dialog-continue-button");
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
      expect(queryByTestId("delete-dialog")).toBeInTheDocument()
    );
    const continueButton = await findByTestId("delete-dialog-continue-button");
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
      expect(queryByTestId("delete-dialog")).toBeInTheDocument()
    );
    const continueButton = await findByTestId("delete-dialog-continue-button");
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

    const modal = await findByTestId("hr-modal-container");
    expect(modal).toBeInTheDocument();

    // ViewHRModal behavior is covered by @madie/madie-util's ViewHRModal.test.
    const cancelButton = await findByTestId("human-readable-cancel-button");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId("hr-modal-container")
      ).not.toBeInTheDocument();
    });
  });

  // Share/unshare behavior is covered by @madie/madie-util's ShareDialog.test;
  // these only verify the window events open the dialog.
  it("should display the share dialog when the share-measure event is triggered", async () => {
    renderRouter();
    expect(await findByTestId("editMeasure")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("share-measure"));
    });

    await waitFor(() => {
      expect(getByTestId("share-dialog")).toBeInTheDocument();
    });
  });

  it("should display the share dialog when the unshare-measure-from-me event is triggered", async () => {
    renderRouter();
    expect(await findByTestId("editMeasure")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("unshare-measure-from-me"));
    });

    await waitFor(() => {
      expect(getByTestId("share-dialog")).toBeInTheDocument();
    });
  });

  it("should display transfer dialog when the event is triggered and not navigate to /measures when cancel is clicked", async () => {
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
    expect(mockedNavigate).not.toHaveBeenCalledWith("/measures");
  });

  it("should display transfer dialog when the event is triggered and navigate to /measures on successful transfer", async () => {
    renderRouter();

    const result = await findByTestId("editMeasure");
    expect(result).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-measure"));
    });

    await waitFor(() => {
      expect(getByTestId("transfer-dialog")).toBeInTheDocument();
    });

    fireEvent.click(getByTestId("transfer-success"));

    await waitFor(
      () => {
        expect(mockedNavigate).toHaveBeenCalledWith("/measures");
      },
      { timeout: 2000 }
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
