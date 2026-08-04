import * as mockCmsIdStubs from "../../../__mocks__/cmsIdFormatterStubs";
import * as React from "react";
import {
  cleanup,
  getByTestId,
  fireEvent,
  render,
  screen,
  waitFor,
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
import MeasureList from "./MeasureList";
import { oneItemResponse } from "../../__mocks__/mockMeasureResponses";
import userEvent from "@testing-library/user-event";
import { v4 as uuid } from "uuid";
import ServiceContext, {
  ApiContextProvider,
} from "../../../api/ServiceContext";
import { Simulate } from "react-dom/test-utils";
// @ts-ignore
import {
  checkUserCanEdit,
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
  TransferDialog: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="transfer-dialog">
        Transfer Dialog
        <button data-testid="transfer-cancel-button" onClick={() => onClose()}>
          Cancel
        </button>
      </div>
    ) : null,
}));

jest.mock("../../common/createVersionDialog/CreateVersionDialog", () => ({
  __esModule: true,
  default: () => <div data-testid="create-version-dialog">Version Type</div>,
  formikErrorHandler: jest.fn(),
}));

jest.mock("./actionCenter/draftAction/DraftAction", () => ({
  __esModule: true,
  default: () => <div data-testid="draft-action">Draft Action</div>,
}));
jest.mock("./measureSearch/Search", () => ({
  __esModule: true,
  default: () => <div data-testid="measure-search">Measure Search</div>,
}));

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
const retrieveMeasuresMock = jest.fn();
const setStatusHandlerMock = jest.fn();

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
  retrieveMeasures: retrieveMeasuresMock,
  setStatusHandler: setStatusHandlerMock,
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
} as unknown as MeasureServiceApi;

describe("Action Center Tests", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockFetchMeasures.mockResolvedValue(oneItemResponse);
    mockFetchMeasure.mockResolvedValue(oneItemResponse);
    mockMeasureServiceApi.fetchMeasures = mockFetchMeasures;
    mockMeasureServiceApi.fetchMeasure = mockFetchMeasure;
    mockMeasureServiceApi.searchMeasuresByCriteria = jest
      .fn()
      .mockResolvedValue(oneItemResponse);
    mockMeasureServiceApi.createVersion = mockCreateVersion;
    mockMeasureServiceApi.deleteMeasure = jest.fn().mockResolvedValue({});
    mockMeasureServiceApi.checkNextVersionNumber = jest
      .fn()
      .mockReturnValue("1.0.000");
    mockMeasureServiceApi.checkValidVersion = mockCheckValidVersion;

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
      (mockMeasureServiceApi.transferMeasures = jest.fn().mockResolvedValue({
        status: 200,
        data: [],
      }));
    mockOktaTokenApi.getAccessToken = jest.fn().mockResolvedValue("test.jwt");
    mockOktaTokenApi.getUserName = jest.fn().mockReturnValue("test user");
  });
  afterEach(() => {
    cleanup();
  });

  it("should display View button for versioned measures", async () => {
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
    const actionButton = screen.getByTestId(`measure-action-${measures[2].id}`);

    expect(actionButton).toBeInTheDocument();

    userEvent.click(actionButton);
    expect(mockPush).toHaveBeenCalledWith("/measures/IDIDID3/edit/details/");
  });

  it("should display Edit button for draft and editable measures", async () => {
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
    const actionButtonEdit = screen.getByTestId(
      `measure-action-${measures[0].id}`
    );
    expect(actionButtonEdit).toBeInTheDocument();
    userEvent.click(actionButtonEdit);
    expect(mockPush).toHaveBeenCalledWith("/measures/IDIDID1/edit/details/");
  });

  it("should trigger navigate", async () => {
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
    const actionButtonEdit = screen.getByTestId(
      `measure-action-${measures[0].id}`
    );
    expect(actionButtonEdit).toBeInTheDocument();
    userEvent.click(actionButtonEdit);
    expect(mockPush).toHaveBeenCalledWith("/measures/IDIDID1/edit/details/");
  });

  it("should display View button for non-editable measures", async () => {
    checkUserCanEdit.mockImplementationOnce(() => false);
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
    const actionButton = screen.getByTestId(`measure-action-${measures[3].id}`);

    expect(actionButton).toBeInTheDocument();
    userEvent.click(actionButton);
    expect(mockPush).toHaveBeenCalledWith("/measures/IDIDID4/edit/details/");
  });

  it("should display share dialog on clicking share action button", async () => {
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

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);
    const shareButton = screen.getByTestId("share-action-btn");
    expect(shareButton).toBeInTheDocument();
    userEvent.click(shareButton);
    userEvent.click(screen.getByRole("menuitem", { name: "Share With" }));
    const shareDialog = screen.getByTestId("share-dialog");
    expect(shareDialog).toBeInTheDocument();

    unmount();
  });

  it("should default toastType, toastMessage, and toastOpen on initial render", async () => {
    const { unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          {...baseProps}
          toastType={undefined}
          toastMessage={undefined}
          toastOpen={undefined}
        />
      </ServiceContext.Provider>
    );

    expect(baseProps.toastType).toBe("danger");
    expect(baseProps.toastMessage).toBe("");
    expect(baseProps.toastOpen).toBe(false);
  });

  it("should display transfer dialog on clicking transfer action button and default toast values on cancel", async () => {
    const { unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          retrieveMeasures={retrieveMeasuresMock}
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
    const transferButton = screen.getByTestId("transfer-action-btn");
    expect(transferButton).toBeInTheDocument();
    userEvent.click(transferButton);

    await waitFor(async () => {
      expect(screen.getByTestId("transfer-dialog")).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId("transfer-cancel-button");
    fireEvent.click(cancelButton);

    expect(setToastTypeMock).toHaveBeenCalledWith("danger");
    expect(setToastMessageMock).toHaveBeenCalledWith("");
    expect(setToastOpenMock).toHaveBeenCalledWith(false);

    unmount();
  });
});
