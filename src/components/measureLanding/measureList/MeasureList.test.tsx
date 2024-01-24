import * as React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
  findByTestId,
} from "@testing-library/react";
import { Measure, Model } from "@madie/madie-models";
import MeasureList from "./MeasureList";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../api/useMeasureServiceApi";
import { oneItemResponse } from "../../__mocks__/mockMeasureResponses";
import userEvent from "@testing-library/user-event";
import { v4 as uuid } from "uuid";
import ServiceContext, { ServiceConfig } from "../../../api/ServiceContext";
import { act } from "react-dom/test-utils";
import { useFeatureFlags } from "@madie/madie-util";

// CSSStyleDeclaration
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  checkUserCanEdit: jest.fn().mockImplementation(() => true),
  useFeatureFlags: () => ({
    qdmExport: true,
  }),
}));

jest.mock("../../../api/useMeasureServiceApi");
const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const mockMeasureServiceApi = {
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
  createVersion: jest.fn().mockResolvedValue({}),
  checkValidVersion: jest.fn().mockResolvedValue({}),
  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({
    "1": true,
    "2": true,
    "3": true,
  }),
  getMeasureExport: jest
    .fn()
    .mockResolvedValue({ size: 635581, type: "application/octet-stream" }),
} as unknown as MeasureServiceApi;

jest.mock("../../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
const testGroup = [
  {
    id: "test",
    scoring: "Cohort",
    measureGroupTypes: ["OUTCOME"],
  },
];
const measures: Measure[] = [
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    ecqmTitle: "ecqmTitleeee",
    measureSetId: "1",
    version: "0.0.000",
    state: "NEW",
    measureName: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: MEASURE_CREATEDBY,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "QDM",
    active: true,
    measureMetaData: {
      draft: true,
    },
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    measureSetId: "2",
    version: "0.0.000",
    state: "DRAFT",
    measureName: "draft measure - B",
    cql: "Sample Cql",
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "FHIR",
    active: false,
    measureMetaData: {
      draft: true,
    },
  },
  {
    id: "IDIDID3",
    measureHumanReadableId: null,
    measureSetId: "3",
    version: "1.3",
    state: "VERSIONED",
    measureName: "versioned measure - C",
    cql: "Sample Cql",
    cqlErrors: true,
    groups: [testGroup],
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE.valueOf(),
    active: false,
    measureMetaData: {
      draft: false,
    },
  },
  {
    id: "IDIDID4",
    measureHumanReadableId: null,
    measureSetId: "4",
    version: "1.3",
    state: "DRAFT",
    measureName: "versioned measure - D",
    cql: "Sample Cql",
    cqlErrors: true,
    groups: [testGroup],
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QDM_5_6,
    active: false,
    measureMetaData: {
      draft: false,
    },
  },
];
const checkValidSuccess = {
  status: 200,
  response: {
    data: {},
  },
};
const serviceConfig: ServiceConfig = {
  elmTranslationService: { baseUrl: "" },
  measureService: { baseUrl: "" },
  terminologyService: { baseUrl: "" },
};
const abortController = new AbortController();

const setMeasureListMock = jest.fn();
const setTotalPagesMock = jest.fn();
const setTotalItemsMock = jest.fn();
const setVisibleItemsMock = jest.fn();
const setOffsetMock = jest.fn();
const setInitialLoadMock = jest.fn();
const setSearchCriteriaMock = jest.fn();
const setErrMsgMock = jest.fn();

describe("Measure List component", () => {
  beforeEach(() => {
    jest.resetModules();
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });

    useMeasureServiceMock.mockReset().mockImplementation(() => {
      return mockMeasureServiceApi;
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("should display a list of measures", () => {
    const { getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });
    unmount();
  });

  it("should navigate to the edit measure screen on click of edit/view button", async () => {
    const { findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const selectButton1 = await findByRole("button", {
      name: "Measure draft measure - B version 0.0.000 draft status true Select",
    });
    act(() => {
      fireEvent.click(selectButton1);
    });
    const editButton = await findByRole("button", {
      name: "View",
    });
    expect(editButton).toBeInTheDocument();
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
    unmount();
  });

  it("should display the popover with options of export and view when feature flag is set to true", () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[0].id}`);
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("Select");
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(actionButton);
    expect(getByTestId(`view-measure-${measures[0].id}`)).toBeInTheDocument();
    expect(getByTestId(`export-measure-${measures[0].id}`)).toBeInTheDocument();
    expect(
      getByTestId(`create-version-measure-${measures[0].id}`)
    ).toBeInTheDocument();
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(getByTestId(`view-measure-${measures[0].id}`));
    expect(mockPush).toHaveBeenCalledWith("/example");
    unmount();
  });

  it("Search measure should display returned measures", () => {
    const { getByTestId, getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={"test"}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );

    const searchFieldInput = getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).toHaveBeenCalledWith(true, 10, 0, "test", abortController.signal);
    unmount();
  });

  it("Clear search criteria should clear input field", async () => {
    const { getByTestId, getByText, getByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={"test"}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const searchFieldInput = getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);
    setTimeout(() => {
      expect(searchFieldInput.value).toBe("");
    }, 25000);

    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0,
      abortController.signal
    );
    unmount();
  });

  it("empty search criteria won't trigger search", () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const searchFieldInput = getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    userEvent.type(searchFieldInput, "");
    expect(searchFieldInput.value).toBe("");

    fireEvent.submit(searchFieldInput);

    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).not.toHaveBeenCalledWith(true, 10, 0, "");
    unmount();
  });

  it("Clear search with error should still do the push", async () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    (mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    const { getByTestId, getByRole, getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={"test"}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );

    const searchFieldInput = getByTestId(
      "searchMeasure-input"
    ) as HTMLInputElement;
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);
    setTimeout(() => {
      expect(searchFieldInput.value).toBe("");
    }, 25000);
    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0,
      abortController.signal
    );
    expect(mockPush).toHaveBeenCalledWith("/example");
    unmount();
  });

  it("should display create version dialog on click of version button", () => {
    const { getByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[0].id}`);
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("Select");
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(actionButton);
    expect(getByTestId(`view-measure-${measures[0].id}`)).toBeInTheDocument();
    expect(getByTestId(`export-measure-${measures[0].id}`)).toBeInTheDocument();

    const createVersionButton = getByTestId(
      `create-version-measure-${measures[0].id}`
    );
    expect(createVersionButton).toBeInTheDocument();
    expect(createVersionButton).toHaveTextContent("Version");
    fireEvent.click(createVersionButton);

    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    unmount();
  });

  it("should display unauthorized error while creating a version of a measure", async () => {
    const error = {
      response: {
        status: 403,
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
      checkValidVersion: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    const { getByTestId, getByLabelText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    fireEvent.click(getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(getByTestId(`create-version-measure-${measures[0].id}`));
    fireEvent.click(getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(getByTestId("create-version-continue-button"));
      expect(getByTestId("error-toast")).toHaveTextContent(
        "User is unauthorized to create a version"
      );
    });
    unmount();
  });

  it("should display bad request while creating a version of a measure", async () => {
    const error = {
      response: {
        status: 400,
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
      checkValidVersion: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    const { getByTestId, getByLabelText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    fireEvent.click(getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(
      screen.getByTestId(`create-version-measure-${measures[0].id}`)
    );
    fireEvent.click(getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(getByTestId("create-version-continue-button"));
      expect(getByTestId("error-toast")).toHaveTextContent(
        "Requested measure cannot be versioned"
      );
    });
    unmount();
  });

  it("should display other error while creating a version of a measure", async () => {
    const error = {
      response: {
        status: 500,
        message: "server error",
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockRejectedValue(error),
      checkValidVersion: jest.fn().mockRejectedValue(error),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    const { getByTestId, getByLabelText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    fireEvent.click(getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(getByTestId(`create-version-measure-${measures[0].id}`));
    fireEvent.click(getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(getByTestId("create-version-continue-button"));
      expect(getByTestId("error-toast")).toHaveTextContent("server error");
    });
    unmount();
  });

  it("should display success message while creating a version of a measure and message can be closed", async () => {
    const success = {
      response: {
        data: {},
      },
    };
    const useMeasureServiceMockRejected = {
      createVersion: jest.fn().mockResolvedValue(success),
      checkValidVersion: jest.fn().mockResolvedValue(checkValidSuccess),
      fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    const { getByTestId, getByLabelText, queryByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    fireEvent.click(getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(getByTestId(`create-version-measure-${measures[0].id}`));
    fireEvent.click(getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(getByTestId("create-version-continue-button"));
      expect(getByTestId("success-toast")).toHaveTextContent(
        "New version of measure is Successfully created"
      );

      const closeButton = getByTestId("close-toast-button");
      fireEvent.click(closeButton);
      setTimeout(() => {
        expect(
          queryByTestId("create-version-success-text")
        ).not.toBeInTheDocument();
      }, 500);
    });
    unmount();
  });

  it("should handle invalid test cases dialog", async () => {
    const invalidTestCaseResponse = {
      response: {},
      status: 202,
    };
    const success = {
      response: {
        data: {},
      },
    };
    const useMeasureServiceMockRejected = {
      checkValidVersion: jest.fn().mockResolvedValue(invalidTestCaseResponse),
      createVersion: jest.fn().mockResolvedValue(success),
      fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    const { getByTestId, getByLabelText, queryByTestId, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    fireEvent.click(getByTestId(`measure-action-${measures[0].id}`));
    fireEvent.click(getByTestId(`create-version-measure-${measures[0].id}`));
    fireEvent.click(getByLabelText("Major"));
    await waitFor(() => {
      fireEvent.click(getByTestId("create-version-continue-button"));
      expect(
        screen.getByTestId("invalid-test-case-dialog")
      ).toBeInTheDocument();
      act(() => {
        fireEvent.click(
          screen.getByTestId("invalid-test-dialog-continue-button")
        );
      });
    });
    await waitFor(() => {
      expect(getByTestId("success-toast")).toHaveTextContent(
        "New version of measure is Successfully created"
      );
      const closeButton = getByTestId("close-toast-button");
      fireEvent.click(closeButton);
      setTimeout(() => {
        expect(
          queryByTestId("create-version-success-text")
        ).not.toBeInTheDocument();
      }, 500);
    });
    unmount();
  });

  it("should display draft/version actions based on whether measure is draft or versioned", async () => {
    const { findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const selectButton0 = await findByRole("button", {
      name: "Measure new measure - A version 0.0.000 draft status true Select",
    });

    // first measure should have Version action as this is a draft measure
    fireEvent.click(selectButton0);
    const versionButton = await findByRole("button", {
      name: "Version",
    });
    expect(versionButton).toBeInTheDocument();
  });

  it("should display draft dialog on clicking Draft action", async () => {
    const { findByRole, getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    fireEvent.click(selectButton2);
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measures[2].measureName);
    // close dialog
    fireEvent.click(getByText(/Cancel/i));
    unmount();
  });

  it("should create a measure draft successfully", async () => {
    const success = {
      response: {
        data: {},
      },
    };
    const useMeasureServiceMockResolved = {
      draftMeasure: jest.fn().mockResolvedValue(success),
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1": true, "2": true, "3": true }),
    } as unknown as MeasureServiceApi;
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolved;
    });
    const { getByTestId, getByText, findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );

    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    fireEvent.click(selectButton2);
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    fireEvent.click(getByText(/Continue/i));
    await waitFor(() => {
      expect(getByTestId("success-toast")).toHaveTextContent(
        "New draft created successfully."
      );
    });
    unmount();
  });

  it("should display errors if draft creation fails with validation", async () => {
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
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1": true, "2": true, "3": true }),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });
    const { getByTestId, getByText, findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );

    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    fireEvent.click(selectButton2);
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    fireEvent.click(getByText(/Continue/i));
    await waitFor(() => {
      expect(getByTestId("error-toast")).toHaveTextContent(
        error.response.data.message
      );
    });
    unmount();
  });

  it("should display errors if service down or internal server errors", async () => {
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
      fetchMeasureDraftStatuses: jest
        .fn()
        .mockResolvedValue({ "1": true, "2": true, "3": true }),
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockRejected;
    });

    const { getByTestId, getByText, findByRole, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const selectButton2 = await findByRole("button", {
      name: "Measure versioned measure - C version 1.3 draft status false Select",
    });
    fireEvent.click(selectButton2);
    const draftButton = await findByRole("button", {
      name: "Draft",
    });
    fireEvent.click(draftButton);
    expect(getByText("Create Draft")).toBeInTheDocument();
    fireEvent.click(getByText(/Continue/i));
    await waitFor(() => {
      expect(getByTestId("error-toast")).toHaveTextContent(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    });
    unmount();
  });

  it("should display the error when cql is empty while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
      };
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
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[0].id}`);
    fireEvent.click(actionButton);
    expect(getByTestId(`export-measure-${measures[0].id}`)).toBeInTheDocument();
    fireEvent.click(getByTestId(`export-measure-${measures[0].id}`));
    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.Missing CQLMissing Population CriteriaMissing Measure DevelopersMissing StewardMissing Description"
      );
    });
    unmount();
  });

  it("should display the error when there are return type mismatch or errors in cql while exporting the measure", async () => {
    const error = {
      response: {
        status: 409,
      },
    };

    useMeasureServiceMock.mockImplementation(() => {
      return {
        ...mockMeasureServiceApi,
        getMeasureExport: jest.fn().mockRejectedValue(error),
      };
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
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[2].id}`);
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`export-measure-${measures[2].id}`)
    ).toBeInTheDocument();
    fireEvent.click(getByTestId(`export-measure-${measures[2].id}`));
    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.CQL Contains ErrorsMissing Measure DevelopersMissing StewardMissing DescriptionAt least one Population Criteria is missing Type"
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
      };
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
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[3].id}`);
    fireEvent.click(actionButton);
    expect(
      screen.getByTestId(`export-measure-${measures[3].id}`)
    ).toBeInTheDocument();
    fireEvent.click(getByTestId(`export-measure-${measures[3].id}`));
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
      };
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
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    const actionButton = getByTestId(`measure-action-${measures[1].id}`);
    fireEvent.click(actionButton);
    expect(getByTestId(`export-measure-${measures[1].id}`)).toBeInTheDocument();
    fireEvent.click(getByTestId(`export-measure-${measures[1].id}`));
    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure.Missing Population CriteriaMissing Measure DevelopersMissing StewardMissing Description"
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
      };
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
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );
    fireEvent.click(getByTestId(`measure-action-${measures[2].id}`));
    expect(getByTestId(`export-measure-${measures[2].id}`)).toBeInTheDocument();
    fireEvent.click(getByTestId(`export-measure-${measures[2].id}`));
    await waitFor(() => {
      expect(getByTestId("error-message")).toHaveTextContent(
        "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists."
      );
    });
    unmount();
  });
  // this test has been passing based on side effects. changing the order that it works in breaks all other tests.
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
        getMeasureExport: jest.fn().mockResolvedValue(success),
      };
    });

    const { getByTestId, getByText, unmount } = render(
      <ServiceContext.Provider value={serviceConfig}>
        <MeasureList
          measureList={measures}
          setMeasureList={setMeasureListMock}
          setTotalPages={setTotalPagesMock}
          setTotalItems={setTotalItemsMock}
          setVisibleItems={setVisibleItemsMock}
          setOffset={setOffsetMock}
          setInitialLoad={setInitialLoadMock}
          activeTab={0}
          searchCriteria={""}
          setSearchCriteria={setSearchCriteriaMock}
          currentLimit={10}
          currentPage={0}
          setErrMsg={setErrMsgMock}
        />
      </ServiceContext.Provider>
    );

    const actionButton = getByTestId(`measure-action-${measures[0].id}`);
    act(() => {
      fireEvent.click(actionButton);
    });
    window.URL.createObjectURL = jest
      .fn()
      .mockReturnValueOnce("http://fileurl");
    const exportButton = getByTestId(`export-measure-${measures[0].id}`);
    expect(exportButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(exportButton);
    });
    await waitFor(() => {
      expect(getByText("Measure exported successfully")).toBeInTheDocument();
    });
    unmount();
  });
});
