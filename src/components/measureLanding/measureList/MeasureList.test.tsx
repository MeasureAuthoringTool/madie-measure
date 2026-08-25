import * as mockCmsIdStubs from "../../../__mocks__/cmsIdFormatterStubs";
import * as React from "react";
import {
  cleanup,
  getByTestId,
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  act,
} from "@testing-library/react";
import { within } from "@testing-library/dom";
import {
  Measure,
  MeasureErrorType,
  Model,
  Organization,
  Group,
  MeasureGroupTypes,
  MeasureSearchCriteria,
} from "@madie/madie-models";
import MeasureList, { customSort } from "./MeasureList";
import { oneItemResponse } from "../../__mocks__/mockMeasureResponses";
import userEvent from "@testing-library/user-event";
import { v4 as uuid } from "uuid";
import ServiceContext, {
  ApiContextProvider,
} from "../../../api/ServiceContext";
import { Simulate } from "react-dom/test-utils";
// @ts-ignore
import {
  useFeatureFlags,
  checkUserCanEdit,
  useUserServiceApi,
  useUserRoles,
  MeasureServiceApi,
  ServiceConfig,
} from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";

const EXPORT_FAILURE_MESSAGE =
  "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";

// CSSStyleDeclaration
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
}));

const mockOktaTokenApi = {
  getAccessToken: jest.fn().mockResolvedValue("test.jwt"),
  getUserName: jest.fn().mockReturnValue("test user"),
};

let mockCapturedManageReviewOnSuccess: (() => void | Promise<void>) | undefined;

jest.mock("@madie/madie-util", () => ({
  ...mockCmsIdStubs,

  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useUserServiceApi: jest.fn(() => ({
    getOwnerDetails: jest.fn(),
    getBulkUserDetails: jest.fn().mockResolvedValue({}),
  })),
  useOktaTokens: () => mockOktaTokenApi,
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  checkUserCanDelete: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(() => mockUseFeatureFlagsApi),
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
  // Shared action-center icons + dialogs + export flow (moved to madie-util)
  exportMeasure: jest.fn(),
  getNewestMeasureInstance: jest.fn(),
  ExportAction: () => <div data-testid="export-action">Export Action</div>,
  ViewHRAction: ({ onClick }: any) => (
    <button data-testid="view-hr-action-btn" onClick={onClick}>
      View HR Action
    </button>
  ),
  HistoryAction: ({ onClick }: any) => (
    <button data-testid="history-action-btn" onClick={onClick}>
      History Action
    </button>
  ),
  CompareVersionsAction: ({ onClick }: any) => (
    <button data-testid="compare-versions-action-btn" onClick={onClick}>
      Compare Versions Action
    </button>
  ),
  ExportDialog: ({ open }: any) =>
    open ? <div data-testid="export-dialog">Export Dialog</div> : null,
  ViewHRModal: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="view-human-readable-modal">
        View Human Readable Modal
        <button data-testid="view-hr-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  ViewMeasureHistoryDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="view-measure-history-dialog">
        View Measure History Dialog
        <button data-testid="view-history-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
  CompareVersionsDialog: ({ open }: any) =>
    open ? (
      <div data-testid="compare-versions-dialog">Compare Versions Dialog</div>
    ) : null,
  ShareAction: ({ measures, activeTab, onClick }: any) => {
    const options = activeTab === 1 ? ["Unshare"] : ["Share With", "Unshare"];
    return (
      <div>
        <button data-testid="share-action-btn" disabled={!measures?.length}>
          Share
        </button>
        {options.map((option: string) => (
          <div
            key={option}
            role="menuitem"
            tabIndex={0}
            onClick={() => onClick && onClick(option)}
          >
            {option}
          </div>
        ))}
      </div>
    );
  },
  ShareDialog: ({ open }: any) =>
    open ? <div data-testid="share-dialog">Share Dialog</div> : null,
  TransferAction: ({ measures, onClick }: any) => (
    <button
      data-testid="transfer-action-btn"
      disabled={!measures?.length}
      onClick={() => onClick && onClick()}
    >
      Transfer
    </button>
  ),
  TransferDialog: ({ open }: any) =>
    open ? <div data-testid="transfer-dialog">Transfer Dialog</div> : null,
  ManageReviewDialog: ({ open, onSuccess }: any) => {
    mockCapturedManageReviewOnSuccess = onSuccess;
    return open ? (
      <div data-testid="manage-review-dialog">Manage Review Dialog</div>
    ) : null;
  },
}));

jest.mock("../../common/createVersionDialog/CreateVersionDialog", () => ({
  __esModule: true,
  default: () => <div data-testid="create-version-dialog">Version Type</div>,
  formikErrorHandler: jest.fn(),
}));

let mockCapturedReviewOnSuccess: (() => void | Promise<void>) | undefined;

jest.mock("../../common/reviewDialog/ReviewDialog", () => ({
  __esModule: true,
  default: ({
    open,
    onSuccess,
  }: {
    open: boolean;
    onSuccess?: () => void | Promise<void>;
  }) => {
    mockCapturedReviewOnSuccess = onSuccess;
    return open ? <div data-testid="review-dialog">Review Dialog</div> : null;
  },
}));

jest.mock("./actionCenter/draftAction/DraftAction", () => ({
  __esModule: true,
  default: () => <div data-testid="draft-action">Draft Action</div>,
}));
jest.mock("./measureSearch/Search", () => ({
  __esModule: true,
  default: () => <div data-testid="measure-search">Measure Search</div>,
}));

const retrieveMeasuresMock = jest.fn();

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
const testGroup = [
  {
    id: "test",
    scoring: "Ratio",
    measureGroupTypes: ["OUTCOME"],
  },
];
const measures = [
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    ecqmTitle: "ecqmTitleeee",
    measureSetId: "1",
    cqlLibraryName: "QiCore1",
    version: "0.0.000",
    state: "NEW",
    measureName: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: MEASURE_CREATEDBY,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QDM_5_6,
    active: true,
    measureMetaData: {
      draft: true,
    },
    measureSet: {
      cmsId: "cmsId1",
    },
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    measureSetId: "2",
    version: "0.0.000",
    state: "DRAFT",
    measureName: "draft measure - B",
    cqlLibraryName:
      "IDIDID22IDIDID22IDIDID22IDIDID22IDIDID22IDIDID22IDIDID22IDIDID22a",
    cql: "Sample Cql",
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE,
    active: false,
    measureMetaData: {
      draft: true,
    },
    measureSet: {
      cmsId: "cmsId2",
    },
  },
  {
    id: "IDIDID3",
    measureHumanReadableId: null,
    measureSetId: "3",
    version: "1.3",
    state: "VERSIONED",
    measureName: "versioned measure - C",
    cqlLibraryName: "IDIDID3",
    cql: "Sample Cql",
    cqlErrors: true,
    groups: [testGroup],
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE,
    active: false,
    measureMetaData: {
      draft: false,
    },
    measureSet: {
      cmsId: "cmsId3",
    },
  },
  {
    id: "IDIDID4",
    measureHumanReadableId: null,
    measureSetId: "4",
    version: "1.3",
    state: "DRAFT",
    measureName: "versioned measure - D",
    cqlLibraryName: "IDIDID4",
    cql: "Sample Cql",
    cqlErrors: true,
    groups: [
      {
        id: "test",
        scoring: "Cohort",
      },
    ],
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QDM_5_6,
    active: false,
    measureMetaData: {
      draft: false,
    },
    measureSet: {
      cmsId: "cmsId4",
    },
  },
  {
    id: "IDIDID5",
    measureHumanReadableId: null,
    measureSetId: "5",
    version: "1.3",
    state: "DRAFT",
    measureName: "draft measure - E",
    cqlLibraryName: "IDIDID4",
    cql: "Sample Cql",
    cqlErrors: true,
    groups: testGroup,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE,
    active: false,
    measureMetaData: {
      draft: true,
    },
    measureSet: {
      cmsId: "cmsId5",
    },
  },
] as unknown as Measure[];
const badCqlLibraryName = {
  ...measures[0],
  cqlLibraryName: "Q1!@#_",
};
const checkValidSuccess = {
  status: 200,
  response: {
    data: {},
  },
};
const serviceConfig = {
  fhirElmTranslationService: { baseUrl: "" },
  qdmElmTranslationService: { baseUrl: "" },
  measureService: { baseUrl: "" },
  terminologyService: { baseUrl: "" },
} as unknown as ServiceConfig;

const setMeasureListMock = jest.fn();
const setTotalPagesMock = jest.fn();
const setTotalItemsMock = jest.fn();
const setVisibleItemsMock = jest.fn();
const setOffsetMock = jest.fn();
const setLoadingMock = jest.fn();
const setSearchCriteriaMock = jest.fn();
const setErrMsgMock = jest.fn();
const setCurrentSortMock = jest.fn();
const setCurrentDirectionMock = jest.fn();
const setCurrentPageMock = jest.fn();
const handlePageChangeMock = jest.fn();
const setToastOpenMock = jest.fn();
const setToastMessageMock = jest.fn();
const setToastTypeMock = jest.fn();
const onToastCloseMock = jest.fn();
const handleToastMock = jest.fn();

// Base props for most test renders
const baseProps = {
  measureList: measures,
  setMeasureList: setMeasureListMock,
  setTotalPages: setTotalPagesMock,
  setTotalItems: setTotalItemsMock,
  setVisibleItems: setVisibleItemsMock,
  setOffset: setOffsetMock,
  setLoading: setLoadingMock,
  activeTab: 0,
  searchCriteria: null,
  setSearchCriteria: setSearchCriteriaMock,
  currentLimit: 10,
  currentPage: 0,
  setErrMsg: setErrMsgMock,
  // Toast props
  toastOpen: false,
  toastMessage: "",
  toastType: "danger",
  setToastOpen: setToastOpenMock,
  setToastMessage: setToastMessageMock,
  setToastType: setToastTypeMock,
  onToastClose: onToastCloseMock,
  handleToast: handleToastMock,
};
const mockFetchMeasures = jest.fn().mockResolvedValue(oneItemResponse);
const mockFetchMeasure = jest.fn().mockResolvedValue(oneItemResponse);
const mockCreateVersion = jest.fn().mockResolvedValue({});
const mockCheckValidVersion = jest.fn().mockResolvedValue({});

const mockUseFeatureFlagsApi = {
  enableQdmRepeatTransfer: jest.fn().mockResolvedValue(false),
};

const mockMeasureServiceApi = {
  searchMeasuresByCriteria: jest.fn().mockResolvedValue(oneItemResponse),
  fetchMeasures: mockFetchMeasures,
  createVersion: mockCreateVersion,
  deleteMeasure: jest.fn().mockResolvedValue({}),
  checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
  checkValidVersion: mockCheckValidVersion,
  fetchMeasure: mockFetchMeasure,
  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({
    "1": true,
    "2": true,
    "3": true,
  }),
  getMeasureExport: jest
    .fn()
    .mockResolvedValue({ size: 635581, type: "application/octet-stream" }),
  getSharedMeasures: jest.fn().mockResolvedValue({
    measureId1: ["userId1"],
    measureId2: ["userId1", "userId2"],
  }),
  getMeasuresByMeasureSetId: jest
    .fn()
    .mockResolvedValue([{ model: Model.QICORE }, { model: Model.QICORE }]),
  transferMeasures: jest.fn().mockResolvedValue({
    status: 200,
    data: [],
  }),
  unshareMeasures: jest.fn().mockResolvedValue({ measureId1: [] }),
} as unknown as MeasureServiceApi;

describe("Measure List component", () => {
  beforeEach(() => {
    jest.resetModules();
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });

    // Reset all mocks before each test
    jest.clearAllMocks();
    mockMeasureServiceApi.fetchMeasures = mockFetchMeasures;
    mockMeasureServiceApi.searchMeasuresByCriteria = jest
      .fn()
      .mockResolvedValue(oneItemResponse);
    mockMeasureServiceApi.createVersion = mockCreateVersion;
    mockMeasureServiceApi.deleteMeasure = jest.fn().mockResolvedValue({});
    mockMeasureServiceApi.checkNextVersionNumber = jest
      .fn()
      .mockReturnValue("1.0.000");
    mockMeasureServiceApi.checkValidVersion = mockCheckValidVersion;
    mockMeasureServiceApi.fetchMeasure = mockFetchMeasure;
    mockMeasureServiceApi.fetchMeasureDraftStatuses = jest
      .fn()
      .mockResolvedValue({ "1": true, "2": true, "3": true });
    mockMeasureServiceApi.getMeasureExport = jest
      .fn()
      .mockResolvedValue({ size: 635581, type: "application/octet-stream" });
    mockMeasureServiceApi.getSharedMeasures = jest.fn().mockResolvedValue({
      measureId1: ["userId1"],
      measureId2: ["userId1", "userId2"],
    });
    (mockMeasureServiceApi.getMeasuresByMeasureSetId = jest
      .fn()
      .mockResolvedValue([{ model: Model.QICORE }, { model: Model.QICORE }])),
      (mockMeasureServiceApi.transferMeasures = jest
        .fn()
        .mockResolvedValue({ data: true }));
  });

  afterEach(() => {
    cleanup();
  });

  it("should display a list of measures", async () => {
    const { getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null as unknown as MeasureSearchCriteria}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });
    unmount();
  });

  it("should navigate to the edit measure screen on click of edit/view button", async () => {
    const { findByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const editButton = await findByTestId("measure-action-IDIDID2");
    expect(editButton).toBeInTheDocument();
    expect(window.location.href).toBe("http://localhost/");
    userEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith("/measures/IDIDID2/edit/details/");
    unmount();
  });

  it("should display View button for versioned measures", async () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[2].id}`);
    userEvent.click(actionButton);

    const viewButton = await screen.findByTestId("measure-action-IDIDID3");
    expect(viewButton).toBeInTheDocument();
    userEvent.click(viewButton);
    expect(mockPush).toHaveBeenCalledWith("/measures/IDIDID3/edit/details/");
    unmount();
  });

  it("Search measure should display returned measures", async () => {
    const { getByText, unmount } = render(
      <ApiContextProvider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ApiContextProvider>
    );

    const searchField = await screen.findByTestId("measure-trigger-search");
    expect(searchField).toBeInTheDocument();
    unmount();
  });

  it("Clear search criteria should clear input field", async () => {
    const { getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const searchField = (await screen.findByTestId(
      "measure-trigger-search"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();
    unmount();
  });

  it("empty search criteria won't trigger search", async () => {
    const { unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const searchField = await screen.findByTestId("measure-trigger-search");

    unmount();
  });

  it("should display create version dialog on click of version button", async () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[0].id}`);
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("Edit");
    expect(window.location.href).toBe("http://localhost/");

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);

    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    userEvent.click(createVersionButton);
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    unmount();
  });

  it("Should display invalid Cql library name dialog and close on cancel.", async () => {
    mockFetchMeasures.mockResolvedValueOnce(badCqlLibraryName);
    const { getByTestId, unmount, queryByText } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    userEvent.click(createVersionButton);
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    // GAK MAT-9176 Everything below was removed because the it tests the dependencies, not the component itself.
    // The dependencies are already tested in their own unit tests.
    // So, we just need to ensure that the dialog opens and closes here.
    expect(getByTestId("create-version-dialog")).toHaveTextContent(
      /Version Type/
    );
    unmount();
  });

  it("should display unauthorized error while creating a version of a measure", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 403,
        data: {
          timestamp: "2025-04-18T18:06:17.711+00:00",
          message:
            "User userId is not authorized for Measure with ID 680278565a582d3542b71eba",
          status: 403,
          error: "Forbidden",
        },
      } as AxiosResponse,
    } as AxiosError;

    mockCheckValidVersion.mockRejectedValueOnce(axiosError);
    mockFetchMeasures.mockResolvedValueOnce(measures[0]);
    mockCreateVersion.mockRejectedValueOnce(axiosError);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    userEvent.click(createVersionButton);
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();

    unmount();
  });

  it("should display bad request error while creating a version of a measure in draft state", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 400,
        data: {
          timestamp: "2025-04-18T18:06:17.711+00:00",
          message:
            "User userId cannot version Measure with ID 680278565a582d3542b71eba. Measure is not in a draft state.",
          status: 400,
          error: "Bad Request",
        },
      } as AxiosResponse,
    } as AxiosError;

    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(axiosError),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;
    mockMeasureServiceApi.createVersion.mockRejectedValueOnce(axiosError);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.checkValidVersion.mockRejectedValueOnce(axiosError);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();

    unmount();
  });

  it("should display bad request error while creating a version of a measure with no CQL", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 400,
        data: {
          timestamp: "2025-04-18T18:06:17.711+00:00",
          message:
            "User userId cannot version Measure with ID 680278565a582d3542b71eba. Measure has no CQL.",
          status: 400,
          error: "Bad Request",
        },
      } as AxiosResponse,
    } as AxiosError;

    mockMeasureServiceApi.createVersion.mockRejectedValueOnce(axiosError);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.checkValidVersion.mockRejectedValueOnce(axiosError);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();

    unmount();
  });

  it("should display bad request error while creating a version of a measure with CQL with errors", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 400,
        data: {
          timestamp: "2025-04-18T18:06:17.711+00:00",
          message:
            "User userId cannot version Measure with ID 680278565a582d3542b71eba. Measure has CQL errors.",
          status: 400,
          error: "Bad Request",
        },
      } as AxiosResponse,
    } as AxiosError;

    mockMeasureServiceApi.createVersion.mockRejectedValueOnce(axiosError);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.checkValidVersion.mockRejectedValueOnce(axiosError);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();

    unmount();
  });

  it("should display bad request error while creating a version of a measure with no population criteria", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 400,
        data: {
          timestamp: "2025-04-18T18:06:17.711+00:00",
          message:
            "User userId cannot version Measure with ID 680278565a582d3542b71eba. Measure does not have at least one Population Criteria.",
          status: 400,
          error: "Bad Request",
        },
      } as AxiosResponse,
    } as AxiosError;

    mockMeasureServiceApi.createVersion.mockRejectedValueOnce(axiosError);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.checkValidVersion.mockRejectedValueOnce(axiosError);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();

    unmount();
  });

  it("should display server error message if returned while creating a version of a measure", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 500,
        data: {
          timestamp: "2025-04-18T18:06:17.711+00:00",
          message:
            "User userId cannot version Measure with ID 680278565a582d3542b71eba. A server related error occurred.",
          status: 500,
          error: "Internal Server Error",
        },
      } as AxiosResponse,
    } as AxiosError;
    mockMeasureServiceApi.createVersion.mockRejectedValueOnce(axiosError);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.checkValidVersion.mockRejectedValueOnce(axiosError);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();

    unmount();
  });

  it("should display success message while creating a version of a measure", async () => {
    const success = {
      response: {
        data: {},
        request: {
          responseText: JSON.stringify({ message: "" }),
        },
      },
    };

    mockMeasureServiceApi.createVersion.mockResolvedValue(success);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.checkValidVersion.mockResolvedValueOnce(
      checkValidSuccess
    );
    mockMeasureServiceApi.fetchMeasures.mockResolvedValueOnce(oneItemResponse);
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });

    unmount();
  });

  it("should display draft/version actions based on whether measure is draft or versioned", async () => {
    const { findByRole, findByTestId } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const selectButton0 = await findByRole("button", {
      name: "Edit Measure new measure - A 0.0.000 Draft",
    });

    // first measure should have Version action as this is a draft measure
    act(() => {
      userEvent.click(selectButton0);
    });
    const versionButton = await findByTestId("version-action-btn");
    expect(versionButton).toBeInTheDocument();
  });

  it.skip("should display draft dialog on clicking Draft action", async () => {
    const { findByRole, getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    act(() => {
      userEvent.click(selectButton2);
    });
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    act(() => {
      userEvent.click(draftButton);
    });
    expect(getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measures[2].measureName);
    // close dialog
    act(() => {
      userEvent.click(getByText(/Cancel/i));
    });
    unmount();
  });

  it.skip("should create a measure draft successfully", async () => {
    const success = {
      response: {
        data: {},
      },
    };
    const useMeasureServiceMockResolved = {
      draftMeasure: jest.fn().mockResolvedValue(success),
      checkNextVersionNumber: jest.fn(),
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1": true, "2": true, "3": true }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolved;
    });
    const { getByText, findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    act(() => {
      userEvent.click(selectButton2);
    });
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    act(() => {
      userEvent.click(draftButton);
    });
    expect(getByText("Create Draft")).toBeInTheDocument();
    act(() => {
      userEvent.click(getByText(/Continue/i));
    });
    await waitFor(() => {
      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastTypeMock).toHaveBeenCalledWith("success");
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "New draft created successfully."
      );
    });
    unmount();
  });

  it.skip("should display errors if draft creation fails with validation", async () => {
    const error = {
      response: {
        status: 400,
        data: {
          message:
            'Can not create a draft for the measure "Test". Only one draft is permitted per measure.',
        },
      },
    };
    const useMeasureServiceMockRejected = {
      draftMeasure: jest.fn().mockRejectedValue(error),
      checkNextVersionNumber: jest.fn(),
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1": true, "2": true, "3": true }),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    const { getByText, findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    await waitFor(() => {
      measures.forEach((m) => {
        expect(getByText(m.measureName)).toBeInTheDocument();
      });
    });

    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    act(() => {
      userEvent.click(selectButton2);
    });
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    act(() => {
      userEvent.click(draftButton);
    });
    expect(getByText("Create Draft")).toBeInTheDocument();
    act(() => {
      userEvent.click(getByText(/Continue/i));
    });
    await waitFor(() => {
      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        error.response.data.message
      );
    });
    unmount();
  });

  it.skip("should display errors if service down or internal server errors", async () => {
    const error = {
      response: {
        data: {},
        request: {
          responseText: {
            message: "Insert sand in the disk drive to continue.",
          },
        },
      },
    };
    // this method blanks out all other parts of measureService
    const useMeasureServiceMockRejected = {
      draftMeasure: jest.fn().mockRejectedValue(error),
      checkNextVersionNumber: jest.fn(),
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1": true, "2": true, "3": true }),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    const { getByRole, getByTestId, getByText, findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const tableBody = getByTestId("measure-list-tbl");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(5);
    });

    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    userEvent.click(selectButton2);

    await waitFor(() => {
      expect(
        getByRole("button", {
          name: "Draft",
        })
      ).toBeVisible();
    });
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    userEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    userEvent.click(getByText(/Continue/i));
    await waitFor(() => {
      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    });
    unmount();
  });

  it("should display the error when cql is empty while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
        request: {
          responseText: JSON.stringify({ message: "" }),
        },
      },
    };

    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.fetchMeasures.mockResolvedValue(oneItemResponse);
    mockMeasureServiceApi.getMeasureExport.mockRejectedValueOnce(error);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();

    unmount();
  });

  it("should display a 400 as expected", async () => {
    const error = {
      response: {
        status: 400,
        request: {
          responseText: JSON.stringify({ message: "" }),
        },
      },
    };

    mockMeasureServiceApi.fetchMeasure.mockResolvedValueOnce(measures[0]);
    mockMeasureServiceApi.getMeasureExport.mockRejectedValueOnce(error);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");

    unmount();
  });

  it("should cancel export with canceled message ", async () => {
    const error = {
      response: {
        status: 409,
      },
      message: "canceled",
    };
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);

    const { unmount, queryByTestId } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[2]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();

    unmount();
  });

  it("should display the error when cqlErrors is true while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };
    measures[2].cqlErrors = true;
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasures.mockResolvedValue(oneItemResponse);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[2]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();

    unmount();
  });

  it("should display the error when errors is not null while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);

    measures[2].errors = [
      MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES,
    ];
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[2]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();

    unmount();
  });

  it("should display the error when measure type is not present", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[3]);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[3]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();

    unmount();
  });

  it("should display the error when there are no associated population criteria while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[1]);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });

    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();

    unmount();
  });

  it("should display the error when at least one Population Criteria is missing Improvement Notation", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[4]);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[4]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });
    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("should NOT display the error of at least one Population Criteria is missing Improvement Notation for Cohort", async () => {
    const copiedMeasure: Measure = {
      ...measures[4],
      groups: [
        {
          id: "test",
          scoring: "Cohort",
          measureGroupTypes: ["OUTCOME"],
        },
      ],
    } as unknown as Measure;

    const error = {
      response: {
        status: 409,
      },
    };
    let allMeasures: Measure[] = [];
    allMeasures.push(copiedMeasure);

    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(copiedMeasure);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={allMeasures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(2);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });

    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("should display the error when there are no associated libraries in hapi fhir or if the server is down while exporting the measure", async () => {
    const error = {
      response: {
        status: 500,
      },
    };
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[2]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });

    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("should display general error when exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(error);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);
    const org: Organization = {
      id: "testOrgId",
      name: "test org name",
    };
    measures[2].cqlErrors = false;
    measures[2].errors = [];
    measures[2].measureMetaData = {
      developers: [org],
      steward: org,
      description: "test description",
    };
    measures[2].groups = [
      {
        id: "testGroupId",
        measureGroupTypes: [MeasureGroupTypes.OUTCOME],
      } as Group,
    ];

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[2]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });
    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("should  not call the export when clicking cancel button", async () => {
    const success = {
      response: {
        data: {
          size: 635581,
          type: "application/octet-stream",
        },
      },
    };
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(success);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });

    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("should call the export api to generate the measure zip file", async () => {
    const success = {
      response: {
        data: {
          size: 635581,
          type: "application/octet-stream",
        },
      },
    };
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(success);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });
    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("should call the export api to generate the measure zip file but the response does not contain any data displays error message to the user", async () => {
    const errorPayload = {
      timestamp: "2025-04-07T00:30:16.103+00:00",
      message:
        'Measure cannot be exported for publishing because it was versioned prior to MADiE version 2.2.0. Please use a newer version or select "Executable Export" for this measure.',
      status: 404,
      error: "Bad Request",
    };

    const errorBlob = new Blob([JSON.stringify(errorPayload)], {
      type: "application/json",
    });

    if (!errorBlob.text) {
      errorBlob.text = async () => JSON.stringify(errorPayload);
    }

    const exportNotFound = {
      response: {
        data: errorBlob,
        status: 404,
      },
    };
    mockMeasureServiceApi.getMeasureExport.mockRejectedValue(exportNotFound);
    mockMeasureServiceApi.fetchMeasure.mockResolvedValue(measures[2]);

    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });
    const exportButton = screen.getByTestId("export-action");
    expect(exportButton).toBeInTheDocument();
    act(() => {
      userEvent.click(exportButton);
    });

    const exportForPublishingButton = await screen.getByTestId("export-action");
    expect(exportForPublishingButton).toBeInTheDocument();
    unmount();
  });

  it("Should be able to version QDM Measure when enableQdmRepeatTransfer is false", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      enableQdmRepeatTransfer: false,
    }));
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });

    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    act(() => {
      userEvent.click(createVersionButton);
    });
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    unmount();
  });

  it("Should display checkboxes", async () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const tableBody = getByTestId("measure-list-tbl");
    expect(tableBody).toBeInTheDocument();
    const visibleRows = await within(tableBody).findAllByRole("row");
    await waitFor(() => {
      expect(visibleRows).toHaveLength(6);
    });
    const checkboxes = await within(tableBody).findAllByRole("checkbox");
    await waitFor(() => {
      expect(checkboxes.length).toBe(6);
    });
    unmount();
  });

  it("Should display action center", async () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );
    const actionCenter = getByTestId("action-center");
    expect(actionCenter).toBeInTheDocument();
    unmount();
  });

  it("should display delete dialog on clicking Delete action", async () => {
    // Mock the deleteMeasure API call to resolve successfully
    mockMeasureServiceApi.deleteMeasure = jest.fn().mockResolvedValue({
      status: 200,
    });

    const { findByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    // Clear any previous mock calls to ensure clean state
    setToastTypeMock.mockClear();
    setToastMessageMock.mockClear();
    setToastOpenMock.mockClear();

    // Select a measure by clicking its checkbox
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    act(() => {
      userEvent.click(checkBoxes[1]);
    });

    // Click the delete button to open the dialog
    const deleteButton = screen.getByTestId("delete-action-btn");
    expect(deleteButton).toBeInTheDocument();
    act(() => {
      userEvent.click(deleteButton);
    });

    // The dialog should appear with Delete Measure title
    const dialogTitle = await findByText("Delete Measure");
    expect(dialogTitle).toBeInTheDocument();

    // Find and click the confirm delete button - use the correct test ID
    const confirmDeleteButton = screen.getByTestId(
      "delete-dialog-continue-button"
    );
    expect(confirmDeleteButton).toBeInTheDocument();

    // Click the button with fireEvent to ensure the click is processed
    fireEvent.click(confirmDeleteButton);

    // Wait for the deleteMeasure API call to be made
    await waitFor(() => {
      expect(mockMeasureServiceApi.deleteMeasure).toHaveBeenCalled();
    });

    // Now verify the toast props were called with correct values
    await waitFor(() => {
      expect(setToastTypeMock).toHaveBeenCalledWith("success");
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "Measure successfully deleted"
      );
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
    });

    unmount();
  });

  it("should display error toast when deleteMeasure fails", async () => {
    // Mock the deleteMeasure API call to reject with an error
    const errorMessage = "Delete failed due to server error";
    mockMeasureServiceApi.deleteMeasure = jest.fn().mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { findByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    // Select a measure by clicking its checkbox
    const checkBoxes = await screen.findAllByRole("checkbox");
    userEvent.click(checkBoxes[1]);

    // Click the delete button to open the dialog
    const deleteButton = screen.getByTestId("delete-action-btn");
    userEvent.click(deleteButton);

    // The dialog should appear with Delete Measure title
    await findByText("Delete Measure");

    // Find and click the confirm delete button
    const confirmDeleteButton = screen.getByTestId(
      "delete-dialog-continue-button"
    );
    fireEvent.click(confirmDeleteButton);

    // Wait for the deleteMeasure API call to be made and error to be handled
    await waitFor(() => {
      expect(mockMeasureServiceApi.deleteMeasure).toHaveBeenCalled();
      expect(setToastTypeMock).toHaveBeenCalledWith("danger");
      expect(setToastMessageMock).toHaveBeenCalledWith(errorMessage);
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
    });

    unmount();
  });
});

describe("Measure List", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display all columns on Owned Measures tab", async () => {
    const { getByText } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    // Verify all columns are present
    expect(getByText("Measure")).toBeInTheDocument();
    expect(getByText("Version")).toBeInTheDocument();
    expect(getByText("Status")).toBeInTheDocument();
    expect(getByText("Model")).toBeInTheDocument();
    expect(getByText("Shared")).toBeInTheDocument();
    expect(getByText("CMS ID")).toBeInTheDocument();
    expect(getByText("Updated")).toBeInTheDocument();
  });

  it("should display all columns (except Shared column) on Shared Measures tab", async () => {
    const { getByText, queryByText } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={1}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    // Verify all columns are present (expect Shared column)
    expect(getByText("Measure")).toBeInTheDocument();
    expect(getByText("Version")).toBeInTheDocument();
    expect(getByText("Status")).toBeInTheDocument();
    expect(getByText("Model")).toBeInTheDocument();
    expect(queryByText("Shared")).not.toBeInTheDocument();
    expect(getByText("CMS ID")).toBeInTheDocument();
    expect(getByText("Updated")).toBeInTheDocument();
  });

  it("should display all columns on All Measures tab", async () => {
    const { getByText } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={2}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    // Verify all columns are present
    expect(getByText("Measure")).toBeInTheDocument();
    expect(getByText("Version")).toBeInTheDocument();
    expect(getByText("Status")).toBeInTheDocument();
    expect(getByText("Model")).toBeInTheDocument();
    expect(getByText("Shared")).toBeInTheDocument();
    expect(getByText("CMS ID")).toBeInTheDocument();
    expect(getByText("Updated")).toBeInTheDocument();
  });

  it("should enable sortable columns", async () => {
    const { getByText } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    // Verify all columns are present
    expect(getByText("Measure")).toBeInTheDocument();
    const measureButton = screen.getByRole("button", {
      name: "Measure",
    });
    expect(measureButton).toBeEnabled();
    expect(getByText("Version")).toBeInTheDocument();
    const versionButton = screen.getByRole("button", {
      name: "Version",
    });
    expect(versionButton).toBeEnabled();
    expect(getByText("Status")).toBeInTheDocument();
    const statusButton = screen.getByRole("button", {
      name: "Status",
    });
    expect(statusButton).toBeEnabled();
    expect(getByText("Model")).toBeInTheDocument();
    const modelButton = screen.getByRole("button", {
      name: "Model",
    });
    expect(modelButton).toBeEnabled();
    expect(getByText("Shared")).toBeInTheDocument();
    const sharedButton = screen.getByRole("button", {
      name: "Shared",
    });
    expect(sharedButton).toBeEnabled();
    expect(getByText("CMS ID")).toBeInTheDocument();
    const cmsIdButton = screen.getByRole("button", {
      name: "CMS ID",
    });
    expect(cmsIdButton).toBeEnabled();
    expect(getByText("Updated")).toBeInTheDocument();
    const updatedButton = screen.getByRole("button", {
      name: "Updated",
    });
    expect(updatedButton).toBeEnabled();
  });

  it("should sort in order when column is clicked first", async () => {
    // Reset mock functions to ensure clean state
    setCurrentSortMock.mockReset();
    setCurrentDirectionMock.mockReset();
    handlePageChangeMock.mockReset();

    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          currentSort=""
          currentDirection=""
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const versionButton = screen.getByRole("button", {
      name: "Version",
    });
    expect(versionButton).toBeEnabled();

    fireEvent.click(versionButton);

    await waitFor(() => {
      expect(setCurrentSortMock).toHaveBeenCalledWith("version");
      expect(setCurrentDirectionMock).toHaveBeenCalledWith("ASC");
      expect(handlePageChangeMock).toHaveBeenCalledWith(null, 1);
    });
  });

  it("should sort in order when column is clicked second", async () => {
    // Reset mock functions to ensure clean state
    setCurrentSortMock.mockReset();
    setCurrentDirectionMock.mockReset();
    handlePageChangeMock.mockReset();

    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Mock the current sort state as if the column has been clicked once
          currentSort="version"
          currentDirection="ASC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const versionButton = screen.getByRole("button", {
      name: "Version",
    });
    expect(versionButton).toBeEnabled();

    fireEvent.click(versionButton);

    await waitFor(() => {
      expect(setCurrentSortMock).toHaveBeenCalledWith("version");
      expect(setCurrentDirectionMock).toHaveBeenCalledWith("DESC");
      expect(handlePageChangeMock).toHaveBeenCalledWith(null, 1);
    });
  });

  it("should sort in order when column is clicked third", async () => {
    // Reset mock functions to ensure clean state
    setCurrentSortMock.mockReset();
    setCurrentDirectionMock.mockReset();
    handlePageChangeMock.mockReset();

    // Set up the component with currentSort and currentDirection as if the column has been clicked twice
    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          // Mock the current sort state as if the column has been clicked twice
          currentSort="version"
          currentDirection="DESC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          // Toast props
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
          handleToast={handleToastMock}
        />
      </ServiceContext.Provider>
    );

    const versionButton = screen.getByRole("button", {
      name: "Version",
    });
    expect(versionButton).toBeEnabled();

    // Simulate clicking the already sorted column a third time
    fireEvent.click(versionButton);

    // Now verify the sort is cleared
    await waitFor(() => {
      expect(setCurrentSortMock).toHaveBeenCalledWith("");
      expect(setCurrentDirectionMock).toHaveBeenCalledWith("");
      expect(handlePageChangeMock).toHaveBeenCalledWith(null, 1);
    });
  });
});

describe("Measure lock functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display lock icon and 'View' text when measure is locked by another user", async () => {
    const lockedMeasure = {
      ...measures[0],
      measureLock: {
        lockedBy: "AnotherUser",
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        measureId: measures[0].id,
      },
    };

    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={[lockedMeasure]}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          currentSort="lastModifiedAt"
          currentDirection="DESC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
        />
      </ServiceContext.Provider>
    );

    const actionButton = await screen.findByTestId(
      `measure-action-${lockedMeasure.id}`
    );

    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("View");
    expect(
      within(actionButton).getByTestId("LockOutlinedIcon")
    ).toBeInTheDocument();
    expect(actionButton).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Locked by AnotherUser")
    );
  });

  it("should display the locking user's real name when it can be resolved", async () => {
    const lockedMeasure = {
      ...measures[0],
      measureLock: {
        lockedBy: "AnotherUser",
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        measureId: measures[0].id,
      },
    };

    (useUserServiceApi as jest.Mock).mockReturnValueOnce({
      getOwnerDetails: jest.fn(),
      getBulkUserDetails: jest.fn().mockResolvedValue({
        AnotherUser: { firstName: "John", lastName: "Doe" },
      }),
    });

    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={[lockedMeasure]}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          currentSort="lastModifiedAt"
          currentDirection="DESC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
        />
      </ServiceContext.Provider>
    );

    const actionButton = await screen.findByTestId(
      `measure-action-${lockedMeasure.id}`
    );

    await waitFor(() => {
      expect(actionButton).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Locked by John Doe (AnotherUser)")
      );
    });
  });

  it("should display 'Edit' when user has edit permission and measure is not locked", async () => {
    const unlockedMeasure = {
      ...measures[0],
      measureMetaData: { draft: true },
      measureSet: {
        owner: "testUser",
        acls: [],
      },
    };

    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={[unlockedMeasure]}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          currentSort="lastModifiedAt"
          currentDirection="DESC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
        />
      </ServiceContext.Provider>
    );

    const actionButton = await screen.findByTestId(
      `measure-action-${unlockedMeasure.id}`
    );

    expect(actionButton).toHaveTextContent("Edit");
    expect(
      within(actionButton).queryByTestId("LockOutlinedIcon")
    ).not.toBeInTheDocument();
  });

  it("should display 'View' without lock icon when user doesn't have edit permission", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementationOnce(() => false);

    const measure = {
      ...measures[0],
      measureMetaData: { draft: false },
    };

    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={[measure]}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={0}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
          currentSort="lastModifiedAt"
          currentDirection="DESC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
        />
      </ServiceContext.Provider>
    );

    const actionButton = await screen.findByTestId(
      `measure-action-${measure.id}`
    );

    expect(actionButton).toHaveTextContent("View");
    expect(
      within(actionButton).queryByTestId("LockOutlinedIcon")
    ).not.toBeInTheDocument();
  });

  describe("View Human Readable and History dialogs preserve expansion and selection", () => {
    const measureWithChildren = [
      {
        ...measures[0],
        id: "PARENT-1",
        measureSetId: "SET-1",
        measureName: "Parent Measure",
        hasAssociatedMeasures: true,
      },
      ...measures.slice(1),
    ] as unknown as Measure[];

    const childMeasure = {
      id: "CHILD-1",
      measureSetId: "SET-1",
      measureName: "Child Measure",
      version: "0.0.001",
      model: Model.QICORE,
      measureMetaData: { draft: true },
      measureSet: { cmsId: "cmsId1" },
      actions: {},
    };

    beforeEach(() => {
      mockMeasureServiceApi.getMeasuresByMeasureSetId = jest
        .fn()
        .mockResolvedValue([childMeasure]);
    });

    const renderWithExpandedChild = async () => {
      const { container, ...rest } = render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measureWithChildren}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={0}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
            handleToast={handleToastMock}
            setStatusHandler={jest.fn()}
          />
        </ServiceContext.Provider>
      );

      // Wait for the parent measure row to render
      await screen.findByText("Parent Measure");

      // Click the expand arrow span[role="button"] inside the table
      const expandButton = container.querySelector(
        'span[role="button"]'
      ) as HTMLElement;
      expect(expandButton).toBeInTheDocument();
      await act(async () => {
        userEvent.click(expandButton);
      });

      // Wait for the child row to appear
      await screen.findByText("Child Measure");

      // Select the child measure's checkbox
      const checkboxes = screen.getAllByRole("checkbox");
      // The last checkbox belongs to the expanded child row
      const childCheckbox = checkboxes[checkboxes.length - 1];
      await act(async () => {
        userEvent.click(childCheckbox);
      });

      return { container, ...rest, childCheckbox };
    };

    it("closing the View Human Readable dialog preserves the expanded row and selected child measure", async () => {
      const { childCheckbox } = await renderWithExpandedChild();

      // Open the HR dialog via the action button
      const hrBtn = screen.getByTestId("view-hr-action-btn");
      await act(async () => {
        userEvent.click(hrBtn);
      });

      // The dialog should be open
      expect(
        screen.getByTestId("view-human-readable-modal")
      ).toBeInTheDocument();

      // Close the dialog
      await act(async () => {
        userEvent.click(screen.getByTestId("view-hr-close-btn"));
      });

      // Dialog should be gone
      expect(
        screen.queryByTestId("view-human-readable-modal")
      ).not.toBeInTheDocument();

      // The expanded child row should still be visible
      expect(screen.getByText("Child Measure")).toBeInTheDocument();

      // The child checkbox should remain checked
      expect(childCheckbox).toBeChecked();
    });

    it("closing the View History dialog preserves the expanded row and selected child measure", async () => {
      const { childCheckbox } = await renderWithExpandedChild();

      // Open the history dialog via the action button
      const historyBtn = screen.getByTestId("history-action-btn");
      await act(async () => {
        userEvent.click(historyBtn);
      });

      // The dialog should be open
      expect(
        screen.getByTestId("view-measure-history-dialog")
      ).toBeInTheDocument();

      // Close the dialog
      await act(async () => {
        userEvent.click(screen.getByTestId("view-history-close-btn"));
      });

      // Dialog should be gone
      expect(
        screen.queryByTestId("view-measure-history-dialog")
      ).not.toBeInTheDocument();

      // The expanded child row should still be visible
      expect(screen.getByText("Child Measure")).toBeInTheDocument();

      // The child checkbox should remain checked
      expect(childCheckbox).toBeChecked();
    });

    it("closing a non-view dialog (e.g. create version) collapses the expanded row and clears child selection", async () => {
      const { childCheckbox } = await renderWithExpandedChild();

      // The child row should be visible and checkbox checked before we proceed
      expect(screen.getByText("Child Measure")).toBeInTheDocument();
      expect(childCheckbox).toBeChecked();

      // Select only the parent row checkbox so we can open the version dialog
      // (index 0 is the header select-all; the first body row checkbox is at index 1)
      const checkboxes = screen.getAllByRole("checkbox");
      // Uncheck child first so only the parent is selected for version action
      await act(async () => {
        userEvent.click(checkboxes[checkboxes.length - 1]); // uncheck child
      });
      await act(async () => {
        userEvent.click(checkboxes[1]); // select parent
      });

      const createVersionButton = screen.getByTestId("version-action-btn");
      await act(async () => {
        userEvent.click(createVersionButton);
      });

      // CreateVersionDialog opens — handleDialogClose is wired to its onClose,
      // which will reset isRowExpanded/selectedIdForExpansion when the dialog closes.
      expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    });
  });

  describe("Owner Column", () => {
    const measuresWithOwner = measures.map((m) => ({
      ...m,
      ownerDisplayName: `Owner of ${m.measureName}`,
    }));

    it("should display Owner column on Shared Measures tab", async () => {
      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithOwner}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={1}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort="lastModifiedAt"
            currentDirection="DESC"
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Wait for measure data to render by finding measure name
      const measureName = await screen.findByText(
        measuresWithOwner[0].measureName
      );
      expect(measureName).toBeInTheDocument();

      // Check that Owner column header exists
      const ownerHeader = screen.getByText("Owner");
      expect(ownerHeader).toBeInTheDocument();

      // Check that owner values are displayed
      const ownerCell = screen.getByTestId(
        `measure-owner-${measuresWithOwner[0].id}-content`
      );
      expect(ownerCell).toBeInTheDocument();
      expect(ownerCell).toHaveTextContent(
        measuresWithOwner[0].ownerDisplayName
      );
    });

    it("should display Owner column on All Measures tab", async () => {
      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithOwner}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={2}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort="lastModifiedAt"
            currentDirection="DESC"
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Wait for measure data to render by finding measure name
      const measureName = await screen.findByText(
        measuresWithOwner[0].measureName
      );
      expect(measureName).toBeInTheDocument();

      // Check that Owner column header exists
      const ownerHeader = screen.getByText("Owner");
      expect(ownerHeader).toBeInTheDocument();

      // Check that owner values are displayed
      const ownerCell = screen.getByTestId(
        `measure-owner-${measuresWithOwner[0].id}-content`
      );
      expect(ownerCell).toBeInTheDocument();
      expect(ownerCell).toHaveTextContent(
        measuresWithOwner[0].ownerDisplayName
      );
    });

    it("should NOT display Owner column on My Measures tab", async () => {
      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithOwner}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={0}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort="lastModifiedAt"
            currentDirection="DESC"
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Check that Owner column header does NOT exist
      expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    });

    it("should display '-' when measure has no owner", async () => {
      const measuresWithoutOwner = measures.map((m) => ({
        ...m,
        measureSet: {
          ...m.measureSet,
          owner: null,
        },
      }));
      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithoutOwner}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={1}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort="lastModifiedAt"
            currentDirection="DESC"
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Wait for measure data to render by finding measure name
      const measureName = await screen.findByText(
        measuresWithoutOwner[0].measureName
      );
      expect(measureName).toBeInTheDocument();

      // Check that Owner column header exists
      const ownerHeader = screen.getByText("Owner");
      expect(ownerHeader).toBeInTheDocument();

      // Check that owner cell displays '-'
      const ownerCell = screen.getByTestId(
        `measure-owner-${measuresWithoutOwner[0].id}-content`
      );
      expect(ownerCell).toBeInTheDocument();
      expect(ownerCell).toHaveTextContent("-");
    });

    it("should display dash when ownerDisplayName is missing or empty", async () => {
      // Create measures with missing/null owner display names
      const measuresWithMissingOwner = [
        {
          ...measures[0],
          ownerDisplayName: null,
        },
        {
          ...measures[1],
          ownerDisplayName: "",
        },
        {
          ...measures[2],
          ownerDisplayName: undefined,
        },
      ];

      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithMissingOwner}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={1}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort="lastModifiedAt"
            currentDirection="DESC"
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Wait for table to render
      const measureName = await screen.findByText(
        measuresWithMissingOwner[0].measureName
      );
      expect(measureName).toBeInTheDocument();

      // Verify all owner cells display "-" when ownerDisplayName is missing
      const ownerCell0 = screen.getByTestId(
        `measure-owner-${measuresWithMissingOwner[0].id}-content`
      );
      expect(ownerCell0).toHaveTextContent("-");

      const ownerCell1 = screen.getByTestId(
        `measure-owner-${measuresWithMissingOwner[1].id}-content`
      );
      expect(ownerCell1).toHaveTextContent("-");

      const ownerCell2 = screen.getByTestId(
        `measure-owner-${measuresWithMissingOwner[2].id}-content`
      );
      expect(ownerCell2).toHaveTextContent("-");
    });

    it("should display owner display names correctly", async () => {
      // Create measures with different owner display names
      const measuresWithOwners = [
        {
          ...measures[0],
          id: "ID1",
          measureName: "Measure One",
          ownerDisplayName: "John Doe",
        },
        {
          ...measures[1],
          id: "ID2",
          measureName: "Measure Two",
          ownerDisplayName: "Jane Smith",
        },
        {
          ...measures[2],
          id: "ID3",
          measureName: "Measure Three",
          ownerDisplayName: "Bob Johnson",
        },
      ];

      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithOwners}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={1}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort=""
            currentDirection=""
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Wait for measures to render
      await screen.findByText("Measure One");

      // Verify owner display names are shown correctly
      const ownerCell1 = screen.getByTestId(`measure-owner-ID1-content`);
      expect(ownerCell1).toHaveTextContent("John Doe");

      const ownerCell2 = screen.getByTestId(`measure-owner-ID2-content`);
      expect(ownerCell2).toHaveTextContent("Jane Smith");

      const ownerCell3 = screen.getByTestId(`measure-owner-ID3-content`);
      expect(ownerCell3).toHaveTextContent("Bob Johnson");
    });

    it("should not allow sorting on Owner column", async () => {
      render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={measuresWithOwner}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={1}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            setErrMsg={setErrMsgMock}
            currentSort=""
            currentDirection=""
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
          />
        </ServiceContext.Provider>
      );

      // Wait for table to render
      await screen.findByText(measuresWithOwner[0].measureName);

      // Verify Owner column header exists
      const ownerHeader = screen.getByText("Owner");
      expect(ownerHeader).toBeInTheDocument();

      // Owner column should not have a sort button (enableSorting: false)
      // The header exists but should not be clickable for sorting
      const headerCell = ownerHeader.closest("th");
      expect(headerCell).toBeInTheDocument();
    });
  });

  describe("MeasureStatusChips - component measure chip", () => {
    const renderComponentMeasure = (measureOverrides = {}) => {
      const componentMeasure = {
        ...measures[0],
        measureMetaData: { draft: false, composite: false },
        ...measureOverrides,
      };
      return render(
        <ServiceContext.Provider value={serviceConfig}>
          <MeasureList
            measureList={[componentMeasure]}
            setMeasureList={setMeasureListMock}
            setTotalPages={setTotalPagesMock}
            setTotalItems={setTotalItemsMock}
            setVisibleItems={setVisibleItemsMock}
            setOffset={setOffsetMock}
            setLoading={setLoadingMock}
            activeTab={0}
            searchCriteria={null}
            setSearchCriteria={setSearchCriteriaMock}
            currentLimit={10}
            currentPage={0}
            currentSort="lastModifiedAt"
            currentDirection="DESC"
            setCurrentSort={setCurrentSortMock}
            setCurrentDirection={setCurrentDirectionMock}
            handlePageChange={handlePageChangeMock}
            search=""
            toastOpen={false}
            toastMessage=""
            toastType="danger"
            setToastOpen={setToastOpenMock}
            setToastMessage={setToastMessageMock}
            setToastType={setToastTypeMock}
            onToastClose={onToastCloseMock}
            setStatusHandler={undefined}
          />
        </ServiceContext.Provider>
      );
    };

    it("should display 'In Composite' chip when measure is a component measure", async () => {
      renderComponentMeasure({ component: true });

      await screen.findByText(measures[0].measureName);

      const inCompositeChip = screen.getByText("In Composite").closest("div");
      expect(inCompositeChip).toBeInTheDocument();
      // The info icon should be present alongside the label
      expect(
        inCompositeChip.querySelector('[data-testid="InfoOutlinedIcon"]')
      ).toBeInTheDocument();
    });

    it("should NOT display 'In Composite' chip when measure is not a component measure", async () => {
      renderComponentMeasure({ component: false });

      await screen.findByText(measures[0].measureName);

      expect(screen.queryByText("In Composite")).not.toBeInTheDocument();
    });

    it("should NOT display 'In Composite' chip when component field is absent", async () => {
      const { component: _removed, ...measureWithoutComponent } = {
        ...measures[0],
        measureMetaData: { draft: false, composite: false },
      } as any;
      renderComponentMeasure(measureWithoutComponent);

      await screen.findByText(measures[0].measureName);

      expect(screen.queryByText("In Composite")).not.toBeInTheDocument();
    });

    it("should display 'Draft' chip alongside 'In Composite' chip when measure is draft and component", async () => {
      renderComponentMeasure({
        component: true,
        measureMetaData: { draft: true, composite: false },
      });

      await screen.findByText(measures[0].measureName);

      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("In Composite")).toBeInTheDocument();
    });

    it("should display 'Composite' chip when measure is composite", async () => {
      renderComponentMeasure({
        measureMetaData: { draft: false, composite: true },
      });

      await screen.findByText(measures[0].measureName);

      const compositeChip = screen.getByRole("status", {
        name: "Composite",
      });
      expect(compositeChip).toBeInTheDocument();
      expect(compositeChip).toHaveClass("chip-composite");
    });

    it("should NOT display 'Composite' chip when composite is false", async () => {
      renderComponentMeasure({
        measureMetaData: { draft: false, composite: false },
      });

      await screen.findByText(measures[0].measureName);

      expect(
        screen.queryByRole("status", { name: "Composite" })
      ).not.toBeInTheDocument();
    });

    it("should display both 'Draft' and 'Composite' chips when measure is draft and composite", async () => {
      renderComponentMeasure({
        measureMetaData: { draft: true, composite: true },
      });

      await screen.findByText(measures[0].measureName);

      expect(screen.getByRole("status", { name: "Draft" })).toBeInTheDocument();
      expect(
        screen.getByRole("status", { name: "Composite" })
      ).toBeInTheDocument();
    });
  });
});

describe("Review Status", () => {
  const measuresWithReview = [
    { ...measures[0], reviewStatus: "Ready" },
    { ...measures[1], reviewStatus: "" },
  ] as unknown as Measure[];

  const renderReviewList = (activeTab = 0) =>
    render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measuresWithReview}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setLoading={setLoadingMock}
          activeTab={activeTab}
          searchCriteria={null}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          retrieveMeasures={retrieveMeasuresMock}
          currentSort="lastModifiedAt"
          currentDirection="DESC"
          setCurrentSort={setCurrentSortMock}
          setCurrentDirection={setCurrentDirectionMock}
          handlePageChange={handlePageChangeMock}
          search=""
          toastOpen={false}
          toastMessage=""
          toastType="danger"
          setToastOpen={setToastOpenMock}
          setToastMessage={setToastMessageMock}
          setToastType={setToastTypeMock}
          onToastClose={onToastCloseMock}
        />
      </ServiceContext.Provider>
    );

  beforeEach(() => {
    mockCapturedReviewOnSuccess = undefined;
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureReviewStatus: true,
    }));
  });

  it("should display the Review column when the feature flag is on", async () => {
    renderReviewList(0);

    expect(
      await screen.findByRole("columnheader", { name: /review/i })
    ).toBeInTheDocument();
  });

  it("should display 'Ready' for reviewed measures and '-' for the rest", async () => {
    renderReviewList(0);

    const readyRow = (
      await screen.findByText(measuresWithReview[0].measureName)
    ).closest("tr");
    const notReadyRow = (
      await screen.findByText(measuresWithReview[1].measureName)
    ).closest("tr");

    expect(
      within(readyRow as HTMLElement).getByText("Ready")
    ).toBeInTheDocument();
    expect(
      within(notReadyRow as HTMLElement).getByText("-")
    ).toBeInTheDocument();
  });

  it("should not display the Review column when the feature flag is off", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureReviewStatus: false,
    }));
    renderReviewList(0);

    await screen.findByText(measuresWithReview[0].measureName);
    expect(
      screen.queryByRole("columnheader", { name: /review/i })
    ).not.toBeInTheDocument();
  });

  it("should not display the Review column on the All Measures tab", async () => {
    renderReviewList(2);

    await screen.findByText(measuresWithReview[0].measureName);
    expect(
      screen.queryByRole("columnheader", { name: /review/i })
    ).not.toBeInTheDocument();
  });

  it("should display the Review column on the reviewer tabs even with the feature flag off", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureReviewStatus: false,
    }));
    renderReviewList(4);

    expect(
      await screen.findByRole("columnheader", { name: /review/i })
    ).toBeInTheDocument();
  });

  it("should display the My Reviews columns", async () => {
    renderReviewList(4);

    await screen.findByText(measuresWithReview[0].measureName);
    for (const header of [
      /measure/i,
      /version/i,
      /status/i,
      /model/i,
      /shared/i,
      /cms id/i,
      /updated/i,
      /review/i,
      /action/i,
    ]) {
      expect(
        screen.getAllByRole("columnheader", { name: header }).length
      ).toBeGreaterThan(0);
    }
    expect(
      screen.queryByRole("columnheader", { name: /owner/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId(`checkbox-${measuresWithReview[0].id}`)
    ).toBeInTheDocument();
  });

  it("should offer Review as a filter option when the feature flag is on", async () => {
    renderReviewList(0);

    const filterBy = await screen.findByTestId("filter-by-select");
    userEvent.click(within(filterBy).getByRole("combobox", { hidden: true }));

    expect(
      await screen.findByRole("option", { name: "Review" })
    ).toBeInTheDocument();
  });

  it("should omit Review from the filter options when the feature flag is off", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureReviewStatus: false,
    }));
    renderReviewList(0);

    const filterBy = await screen.findByTestId("filter-by-select");
    userEvent.click(within(filterBy).getByRole("combobox", { hidden: true }));

    await screen.findByRole("option", { name: "Measure" });
    expect(
      screen.queryByRole("option", { name: "Review" })
    ).not.toBeInTheDocument();
  });

  it("should pass an onSuccess handler to the review dialog", async () => {
    renderReviewList(0);

    await screen.findByText(measuresWithReview[0].measureName);
    expect(mockCapturedReviewOnSuccess).toBeDefined();
  });

  it("should refetch the tab counts after a reviewer saves a review", async () => {
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: true,
    });
    renderReviewList(0);
    await screen.findByText(measuresWithReview[0].measureName);

    retrieveMeasuresMock.mockClear();
    await act(async () => {
      await mockCapturedManageReviewOnSuccess!();
    });

    await waitFor(() => {
      expect(retrieveMeasuresMock).toHaveBeenCalledTimes(1);
    });
    // the last argument asks for the tab counts to be refetched, since saving a review
    // moves the measure on and off the All Reviews and My Reviews tabs
    expect(retrieveMeasuresMock.mock.calls[0][6]).toBe(true);
    (useUserRoles as jest.Mock).mockReturnValue({ roles: [], isAdmin: false });
  });

  it("should refetch the measure list after a review is saved so the status updates without a page refresh", async () => {
    renderReviewList(0);
    await screen.findByText(measuresWithReview[0].measureName);

    retrieveMeasuresMock.mockClear();
    await act(async () => {
      await mockCapturedReviewOnSuccess!();
    });

    await waitFor(() => {
      expect(retrieveMeasuresMock).toHaveBeenCalledTimes(1);
    });
    // the last argument asks for the tab counts to be refetched, since saving a review
    // moves the measure on and off the All Reviews and My Reviews tabs
    expect(retrieveMeasuresMock.mock.calls[0][6]).toBe(true);
  });
});
