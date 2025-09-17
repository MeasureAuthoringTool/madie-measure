import * as React from "react";
import {
  cleanup,
  findByTestId,
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
} from "@madie/madie-models";
import MeasureList from "./MeasureList";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";
import { oneItemResponse } from "../../__mocks__/mockMeasureResponses";
import userEvent from "@testing-library/user-event";
import { v4 as uuid } from "uuid";
import ServiceContext, {
  ApiContextProvider,
  ServiceConfig,
} from "../../../api/ServiceContext";
import { Simulate } from "react-dom/test-utils";
// @ts-ignore
import { useFeatureFlags, checkUserCanEdit } from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";

const EXPORT_FAILURE_MESSAGE =
  "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";

// CSSStyleDeclaration
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
}));

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  checkUserCanDelete: jest.fn().mockImplementation(() => true),
  useFeatureFlags: jest.fn(() => ({
    enableQdmRepeatTransfer: false,
    TransferMeasure: false,
  })),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => null),
    initialState: jest.fn().mockImplementation(() => null),
    subscribe: () => {
      return { unsubscribe: () => null };
    },
  },
}));

jest.mock("../../../api/useMeasureServiceApi");
const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const mockMeasureServiceApi = {
  searchMeasuresByCriteria: jest.fn().mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
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
  getSharedMeasures: jest.fn().mockResolvedValue({
    measureId1: ["userId1"],
    measureId2: ["userId1", "userId2"],
  }),
  getMeasuresByMeasureSetId: jest
    .fn()
    .mockResolvedValue([{ model: Model.QICORE }, { model: Model.QICORE }]),
  transferMeasures: jest.fn().mockResolvedValue({
    data: true,
  }),
} as unknown as MeasureServiceApi;

jest.mock("../../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

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

describe("Measure List component", () => {
  beforeEach(() => {
    jest.resetModules();
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });

    useMeasureServiceMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApi;
    });

    // Reset all mocks before each test
    jest.clearAllMocks();
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

    const searchField = (await screen.findByTestId(
      "measure-search-input"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();
    userEvent.type(searchField, "test");
    expect(searchField.value).toBe("test");

    fireEvent.submit(searchField);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(setSearchCriteriaMock).toHaveBeenCalledWith({
        searchField: "test",
        optionalSearchProperties: [undefined],
      });
    });
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
      "measure-search-input"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();
    userEvent.type(searchField, "test");
    expect(searchField.value).toBe("test");

    fireEvent.submit(searchField);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);

    await waitFor(() => {
      expect(setSearchCriteriaMock).toHaveBeenCalledWith({
        searchField: "test",
        optionalSearchProperties: [undefined],
      });
    });
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
    const searchField = (await screen.findByTestId(
      "measure-search-input"
    )) as HTMLInputElement;
    expect(searchField).toBeInTheDocument();
    expect(searchField.value).toBe("");

    fireEvent.submit(searchField);

    expect(setSearchCriteriaMock).not.toHaveBeenCalled();
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
    const useMeasureServiceMockRejected = {
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      fetchMeasure: jest.fn().mockResolvedValueOnce(badCqlLibraryName),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");
    expect(getByTestId("create-version-continue-button")).toBeEnabled();
    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));
      expect(getByTestId("invalid-cancel")).toBeInTheDocument();
    });
    userEvent.click(getByTestId("invalid-cancel"));
    await waitForElementToBeRemoved(() =>
      queryByText("Measure CQL Library Name is invalid")
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

    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(axiosError),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "User is unauthorized to create a version"
      );

      expect(screen.getByTestId("version-helper-text")).toHaveTextContent(
        "An unexpected error has occurred. Please contact the help desk."
      );
    });
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
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "Requested measure cannot be versioned"
      );

      expect(screen.getByTestId("version-helper-text")).toHaveTextContent(
        "Please ensure the measure is first in draft state before versioning this measure."
      );
    });
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

    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(axiosError),
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "Requested measure cannot be versioned"
      );

      expect(screen.getByTestId("version-helper-text")).toHaveTextContent(
        "Please include valid CQL in the CQL editor to version before versioning this measure."
      );
    });
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

    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(axiosError),
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "Requested measure cannot be versioned"
      );

      expect(screen.getByTestId("version-helper-text")).toHaveTextContent(
        "Please include valid CQL in the CQL editor to version before versioning this measure."
      );
    });
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

    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(axiosError),
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "Requested measure cannot be versioned"
      );

      expect(screen.getByTestId("version-helper-text")).toHaveTextContent(
        "Please set up at least one Population Criteria before versioning this measure."
      );
    });
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

    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(axiosError),
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      checkValidVersion: jest.fn().mockRejectedValue(axiosError),
      fetchMeasure: jest.fn().mockResolvedValueOnce(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      // For 500 errors, we should show a generic error message
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "An unexpected error has occurred. Please contact the help desk."
      );

      expect(screen.getByTestId("version-helper-text")).toHaveTextContent(
        "An unexpected error has occurred. Please contact the help desk."
      );
    });
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
    const useMeasureServiceMockResolved = {
      createVersion: jest.fn().mockResolvedValue(success),
      checkValidVersion: jest.fn().mockResolvedValue(checkValidSuccess),
      checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
      fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
      fetchMeasure: jest.fn().mockResolvedValue(measures[0]),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolved;
    });
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

    const typeInput = screen.getByTestId(
      "version-type-input"
    ) as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId(
      "confirm-version-input"
    ) as HTMLInputElement;
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");
    await waitFor(() => {
      userEvent.click(getByTestId("create-version-continue-button"));

      // Verify toast props were called with correct values
      expect(setToastOpenMock).toHaveBeenCalledWith(true);
      expect(setToastTypeMock).toHaveBeenCalledWith("success");
      expect(setToastMessageMock).toHaveBeenCalledWith(
        "New version of measure is Successfully created"
      );
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
    userEvent.click(selectButton0);
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
    userEvent.click(selectButton2);
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    userEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measures[2].measureName);
    // close dialog
    userEvent.click(getByText(/Cancel/i));
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
    userEvent.click(selectButton2);
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    userEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    userEvent.click(getByText(/Continue/i));
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
    userEvent.click(selectButton2);
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

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[0]),
      } as unknown as MeasureServiceApi;
    });

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
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.Missing CQLMissing Population CriteriaMissing Measure DevelopersMissing StewardMissing DescriptionMeasure Type is required"
      );
    });
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

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[0]),
      } as unknown as MeasureServiceApi;
    });

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
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        EXPORT_FAILURE_MESSAGE
      );
    });
    unmount();
  });

  it("should cancel export with canceled message ", async () => {
    const error = {
      response: {
        status: 409,
      },
      message: "canceled",
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[2]),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[2]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    await waitFor(() => {
      expect(queryByTestId("error-message")).not.toBeInTheDocument();
    });
    unmount();
  });

  it("should display the error when cqlErrors is true while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[2]),
      } as unknown as MeasureServiceApi;
    });

    measures[2].cqlErrors = true;

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
    userEvent.click(checkBoxes[2]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.CQL Contains ErrorsMissing Measure DevelopersMissing StewardMissing DescriptionAt least one Population Criteria is missing Type"
      );
    });
    unmount();
  });

  it("should display the error when errors is not null while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[2]),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[2]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.CQL Contains ErrorsCQL Populations Return Types are invalidMissing Measure DevelopersMissing StewardMissing DescriptionAt least one Population Criteria is missing Type"
      );
    });
    unmount();
  });

  it("should display the error when measure type is not present", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[3]),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[3]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.CQL Contains ErrorsMissing Measure DevelopersMissing StewardMissing DescriptionMeasure Type is required"
      );
    });
    unmount();
  });

  it("should display the error when there are no associated population criteria while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[1]),
      } as unknown as MeasureServiceApi;
    });

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
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.Measure CQL Library Name is invalidMissing Population CriteriaMissing Measure DevelopersMissing StewardMissing Description"
      );
    });
    unmount();
  });

  it("should display the error when at least one Population Criteria is missing Improvement Notation", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[4]),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[4]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.CQL Contains ErrorsMissing Measure DevelopersMissing StewardMissing DescriptionAt least one Population Criteria is missing Improvement Notation"
      );
    });
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

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(copiedMeasure),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[1]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.CQL Contains ErrorsMissing Measure DevelopersMissing StewardMissing Description"
      );
    });
    unmount();
  });

  it("should display the error when there are no associated libraries in hapi fhir or if the server is down while exporting the measure", async () => {
    const error = {
      response: {
        status: 500,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[2]),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[2]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        EXPORT_FAILURE_MESSAGE
      );
    });
    unmount();
  });

  it("should display general error when exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
        fetchMeasure: jest.fn().mockResolvedValue(measures[2]),
      } as unknown as MeasureServiceApi;
    });

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
    userEvent.click(checkBoxes[2]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        EXPORT_FAILURE_MESSAGE
      );
    });
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
    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(success),
        fetchMeasure: jest.fn().mockResolvedValueOnce(measures[2]),
      } as unknown as MeasureServiceApi;
    });

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

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeInTheDocument();
    userEvent.click(cancelButton);
    expect(cancelButton).not.toBeInTheDocument();
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
    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockResolvedValueOnce(success),
        fetchMeasure: jest.fn().mockResolvedValueOnce(measures[2]),
      } as unknown as MeasureServiceApi;
    });

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

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    const cancelButton = await screen.findByRole("button", {
      name: "Cancel",
    });
    expect(cancelButton).toBeInTheDocument();
    userEvent.click(cancelButton);
    expect(cancelButton).not.toBeInTheDocument();
  });

  it("should call the export api to generate the measure zip file but the response does not contain any data displays error message to the user", async () => {
    const errorPayload = {
      timestamp: "2025-04-07T00:30:16.103+00:00",
      message:
        'Measure cannot be exported for publishing because it was versioned prior to MADiE version 2.2.0. Please use a newer version or select "Export" for this measure.',
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
    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        fetchMeasure: jest.fn().mockResolvedValueOnce(measures[2]),
        getMeasureExport: jest.fn().mockRejectedValueOnce(exportNotFound),
      } as unknown as MeasureServiceApi;
    });

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

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(6);
    userEvent.click(checkBoxes[1]);
    const exportButton = screen.getByTestId("export-action-btn");
    expect(exportButton).toBeInTheDocument();
    userEvent.click(exportButton);

    const exportForPublishingButton = await screen.findByRole("menuitem", {
      name: "Export for Publishing",
    });
    userEvent.click(exportForPublishingButton);

    const errorMessage = await screen.findByTestId("error-message");
    expect(errorMessage).toHaveTextContent(errorPayload?.message);
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
    userEvent.click(checkBoxes[1]);

    const createVersionButton = getByTestId("version-action-btn");
    expect(createVersionButton).toBeInTheDocument();
    userEvent.click(createVersionButton);
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
    userEvent.click(checkBoxes[1]);

    // Click the delete button to open the dialog
    const deleteButton = screen.getByTestId("delete-action-btn");
    expect(deleteButton).toBeInTheDocument();
    userEvent.click(deleteButton);

    // The dialog should appear with Delete Measure title
    const dialogTitle = await findByText("Delete Measure");
    expect(dialogTitle).toBeInTheDocument();

    // Find and click the confirm delete button - use the correct test ID
    const confirmDeleteButton = screen.getByTestId("delete-measure-button-2");
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
    const confirmDeleteButton = screen.getByTestId("delete-measure-button-2");
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

describe("Action Center Tests", () => {
  beforeEach(() => {
    jest.resetModules();
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

  it("should trigger navigate when featureFlags?.MeasureSearch is true", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureSearch: true,
    }));
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
    const cancelButton = screen.getByTestId("share-cancel-button");
    userEvent.click(cancelButton);

    await waitFor(() => {
      expect(shareDialog).not.toBeVisible();
    });

    unmount();
  });

  it("should display transfer dialog on clicking transfer action button, and submit the form values", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TransferMeasure: true,
    }));
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

    const newHarpIdInput = screen.getByTestId("harp-id-input");
    expect(newHarpIdInput).toBeInTheDocument();
    expect(newHarpIdInput.value).toBe("");
    const transferBtn = screen.getByTestId("transfer-save-button");
    expect(transferBtn).toBeInTheDocument();
    expect(transferBtn).toBeDisabled();

    fireEvent.change(newHarpIdInput, {
      target: { value: "newUser" },
    });
    expect(newHarpIdInput.value).toBe("newUser");
    expect(transferBtn).toBeEnabled();

    act(() => {
      fireEvent.click(transferBtn);
    });

    await waitFor(async () => {
      expect(retrieveMeasuresMock).toHaveBeenCalled();
      expect(screen.queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });

    unmount();
  });

  it("should display transfer dialog but not update list if there is error transferring measures", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TransferMeasure: true,
    }));
    const useMeasureServiceMockRejected = {
      transferMeasures: jest
        .fn()
        .mockRejectedValue(new Error("Transfer failed")),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
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

    const newHarpIdInput = screen.getByTestId("harp-id-input");
    expect(newHarpIdInput).toBeInTheDocument();
    expect(newHarpIdInput.value).toBe("");
    const transferBtn = screen.getByTestId("transfer-save-button");
    expect(transferBtn).toBeInTheDocument();
    expect(transferBtn).toBeDisabled();

    fireEvent.change(newHarpIdInput, {
      target: { value: "newUser" },
    });
    expect(newHarpIdInput.value).toBe("newUser");
    expect(transferBtn).toBeEnabled();

    act(() => {
      fireEvent.click(transferBtn);
    });

    await waitFor(async () => {
      expect(screen.queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });

    unmount();
  });

  it("should default toastType, toastMessage, and toastOpen on initial render", async () => {
    render(
      <MeasureList
        {...baseProps}
        toastType={undefined}
        toastMessage={undefined}
        toastOpen={undefined}
      />
    );
    expect(baseProps.toastType).toBe("danger");
    expect(baseProps.toastMessage).toBe("");
    expect(baseProps.toastOpen).toBe(false);
  });

  it("should display transfer dialog on clicking transfer action button and default toast values on cancel", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      TransferMeasure: true,
    }));

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

describe("Measure List with MeasureSearch enabled", () => {
  beforeEach(() => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      MeasureSearch: true,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display all columns when MeasureSearch is enabled on Owned Measures tab", async () => {
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

  it("should display all columns (except Shared column) when MeasureSearch is enabled on Shared Measures tab", async () => {
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

  it("should display all columns when MeasureSearch is enabled on All Measures tab", async () => {
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

  it("should enable sortable columns when MeasureSearch is enabled", async () => {
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
