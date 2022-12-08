import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Measure, Model } from "@madie/madie-models";
import MeasureList from "./MeasureList";
import { MeasureServiceApi } from "../../api/useMeasureServiceApi";
import { oneItemResponse } from "../measureRoutes/mockMeasureResponses";
import userEvent from "@testing-library/user-event";
import { getFeatureFlag } from "../../utils/featureFlag";

import { v4 as uuid } from "uuid";

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: jest.fn(() => ({
    getUserName: jest.fn(() => "TestUser@example.com"), //#nosec
    getAccessToken: () => "test.jwt",
  })),
}));
const mockMeasureServiceApi = {
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
} as unknown as MeasureServiceApi;

jest.mock("../../api/useMeasureServiceApi", () =>
  jest.fn(() => mockMeasureServiceApi)
);

jest.mock("../../utils/featureFlag", () => ({
  getFeatureFlag: jest.fn(),
}));

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec

const measures: Measure[] = [
  {
    id: "IDIDID1",
    measureHumanReadableId: null,
    measureSetId: "1",
    version: 0,
    revisionNumber: 0,
    state: "NEW",
    measureName: "new measure - A",
    cql: null,
    createdAt: null,
    createdBy: MEASURE_CREATEDBY,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "QDM",
    active: true,
  },
  {
    id: "IDIDID2",
    measureHumanReadableId: null,
    measureSetId: "2",
    version: 0,
    revisionNumber: 999999,
    state: "DRAFT",
    measureName: "draft measure - B",
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: "FHIR",
    active: false,
  },
  {
    id: "IDIDID3",
    measureHumanReadableId: null,
    measureSetId: "3",
    version: 1.3,
    revisionNumber: 0,
    state: "VERSIONED",
    measureName: "versioned measure - C",
    cql: null,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    model: Model.QICORE.valueOf(),
    active: false,
  },
];

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
    measures.forEach((m) => {
      m.measureHumanReadableId = uuid();
    });
  });

  it("should display a list of measures", () => {
    const { getByText } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria="test"
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );
    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });
  });

  it("should navigate to the edit measure screen on click of edit/view button", () => {
    (getFeatureFlag as jest.Mock).mockImplementation(() => {
      return false;
    });

    const { getByTestId } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria="test"
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );

    const editButton = getByTestId(`edit-measure-${measures[0].id}`);
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent("View");
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should display the popover with options of export and view when feature flag is set to true", () => {
    (getFeatureFlag as jest.Mock).mockImplementation(() => {
      return true;
    });

    const { getByTestId } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria="test"
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );

    const actionButton = getByTestId(`measure-action-${measures[0].id}`);
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("Select");
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(actionButton);
    expect(getByTestId(`edit-measure-${measures[0].id}`)).toBeInTheDocument();
    expect(getByTestId(`export-measure-${measures[0].id}`)).toBeInTheDocument();
    expect(window.location.href).toBe("http://localhost/");
    fireEvent.click(getByTestId(`edit-measure-${measures[0].id}`));
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("Search measure should display returned measures", () => {
    const { getByTestId, getByText } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria="test"
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );

    const searchFieldInput = getByTestId("searchMeasure-input");
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).toHaveBeenCalledWith(true, 10, 0, "test");
  });

  it("Clear search criteria should clear input field", () => {
    const { getByTestId, getByText } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria="test"
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );

    const searchFieldInput = getByTestId("searchMeasure-input");
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);
    setTimeout(() => {
      expect(searchFieldInput.value).toBe("");
    }, 500);

    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0
    );
  });

  it("empty search criteria won't trigger search", () => {
    const { getByTestId } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria=""
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );

    const searchFieldInput = getByTestId("searchMeasure-input");
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "");
    expect(searchFieldInput.value).toBe("");

    fireEvent.submit(searchFieldInput);

    expect(
      mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle
    ).not.toHaveBeenCalledWith(true, 10, 0, "");
  });

  it("Clear search with error should still do the push", () => {
    (mockMeasureServiceApi.fetchMeasures as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));
    (mockMeasureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle as jest.Mock)
      .mockClear()
      .mockRejectedValueOnce(new Error("Unable to fetch measures"));

    const { getByTestId, getByText } = render(
      <MeasureList
        measureList={measures}
        setMeasureList={setMeasureListMock}
        setTotalPages={setTotalPagesMock}
        setTotalItems={setTotalItemsMock}
        setVisibleItems={setVisibleItemsMock}
        setOffset={setOffsetMock}
        setInitialLoad={setInitialLoadMock}
        activeTab={0}
        searchCriteria="test"
        setSearchCriteria={setSearchCriteriaMock}
        currentLimit={10}
        currentPage={0}
        setErrMsg={setErrMsgMock}
      />
    );

    const searchFieldInput = getByTestId("searchMeasure-input");
    expect(searchFieldInput).toBeInTheDocument();
    userEvent.type(searchFieldInput, "test");
    expect(searchFieldInput.value).toBe("test");

    fireEvent.submit(searchFieldInput);

    measures.forEach((m) => {
      expect(getByText(m.measureName)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole("button", {
      name: /Clear-Search/i,
    });
    userEvent.click(clearButton);
    setTimeout(() => {
      expect(searchFieldInput.value).toBe("");
    }, 500);

    expect(mockMeasureServiceApi.fetchMeasures).toHaveBeenCalledWith(
      true,
      10,
      0
    );
    expect(mockPush).toHaveBeenCalledWith("/example");
  });
});
