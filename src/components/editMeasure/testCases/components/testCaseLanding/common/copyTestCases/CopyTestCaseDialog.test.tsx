import CopyTestCaseDialog from "./CopyTestCaseDialog";
import { render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { Measure, MeasureSet, Model, TestCase } from "@madie/madie-models";
import * as _ from "lodash";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../../../../api/useMeasureServiceApi";
import userEvent from "@testing-library/user-event";

const MEASURE_OWNER = "test.user";

const testCases = [
  {
    id: "1",
    description: "Test IPP",
    title: "WhenAllGood",
    series: "IPP_Pass",
    lastModifiedAt: "2024-09-10T09:56:14.382Z",
    validResource: true,
  },
  {
    id: "2",
    description: "Test IPP Fail when something is wrong",
    title: "WhenSomethingIsWrong",
    series: "IPP_Fail",
    lastModifiedAt: "2024-09-10T09:57:14.382Z",
    validResource: true,
  },
  {
    id: "3",
    description: "Invalid test case",
    title: "WhenJsonIsInvalid",
    series: "IPP_Fail",
    lastModifiedAt: "2024-09-10T09:58:14.382Z",
    validResource: false,
  },
] as TestCase[];

const mockCurrentMeasure = {
  id: "1",
  measureName: "QDM Measure Name",
  groups: [],
  model: Model.QDM_5_6,
  measureSet: {
    cmsId: 844,
    measureSetId: "test-measureSetId1",
    owner: MEASURE_OWNER,
    acls: [],
  } as MeasureSet,
  measureMetaData: {
    draft: false,
  },
  testCases: testCases,
} as Measure;

const otherMeasuresOwnedByUser = [
  {
    id: "2",
    measureName: "QDM Measure Name 2",
    groups: [],
    model: Model.QDM_5_6,
    version: "0.0.001",
    measureSet: {
      cmsId: 845,
      measureSetId: "test-measureSetId2",
      owner: MEASURE_OWNER,
      acls: [],
    } as MeasureSet,
    measureMetaData: {
      draft: true,
    },
    testCases: testCases,
  },
  {
    id: "3",
    measureName: "QDM Measure Name 3",
    groups: [],
    model: Model.QDM_5_6,
    version: "0.0.001",
    measureSet: {
      cmsId: null,
      measureSetId: "test-measureSetId3",
      owner: MEASURE_OWNER,
      acls: [],
    } as MeasureSet,
    measureMetaData: {
      draft: true,
    },
    testCases: testCases,
  },
  {
    id: "4",
    measureName: "QDM Measure Name 4",
    groups: [],
    model: Model.QDM_5_6,
    version: "0.0.001",
    measureSet: {
      cmsId: 844,
      measureSetId: "test-measureSetId4",
      owner: MEASURE_OWNER,
      acls: [],
    } as MeasureSet,
    measureMetaData: {
      draft: true,
    },
    testCases: testCases,
  },
  {
    id: "5",
    measureName: "QDM Measure Name 5",
    groups: [],
    model: Model.QDM_5_6,
    version: "0.0.001",
    measureSet: {
      cmsId: null,
      measureSetId: "test-measureSetId5",
      owner: MEASURE_OWNER,
      acls: [],
    } as MeasureSet,
    measureMetaData: {
      draft: true,
    },
    testCases: testCases,
  },
  {
    id: "6",
    measureName: "QDM Measure Name 6",
    groups: [],
    model: Model.QDM_5_6,
    version: "0.0.001",
    measureSet: {
      cmsId: null,
      measureSetId: "test-measureSetId6",
      owner: MEASURE_OWNER,
      acls: [],
    } as MeasureSet,
    measureMetaData: {
      draft: true,
    },
    testCases: testCases,
  },
] as Measure[];

const mockMeasureSearchResponse = {
  content: otherMeasuresOwnedByUser,
  totalPages: 2,
  totalElements: 6,
  numberOfElements: 5,
  pageable: {
    offset: 0,
  },
};

const mockMeasureSearchResponseWithNoMeasures = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  numberOfElements: 0,
  pageable: {
    offset: 0,
  },
};

// Mocks
jest.mock("../../../../../../../api/useMeasureServiceApi");
const useMeasureServiceMock =
  useMeasureServiceApi as jest.Mock<MeasureServiceApi>;
const useMeasureServiceMockResolved = {
  searchMeasuresByCriteria: jest
    .fn()
    .mockResolvedValueOnce(mockMeasureSearchResponse),
} as unknown as MeasureServiceApi;
// No measures
const useMeasureServiceMockResolvedWithNoMeasure = {
  searchMeasuresByCriteria: jest
    .fn()
    .mockResolvedValueOnce(mockMeasureSearchResponseWithNoMeasures),
} as unknown as MeasureServiceApi;

describe("Copy Test Case Dialog Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display list of qdm measures that current user owns", async () => {
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolved;
    });
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={() => jest.fn()}
        onSubmit={() => jest.fn()}
        measure={mockCurrentMeasure}
      />
    );

    const table = await screen.findByTestId("measure-list-tbl");

    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[1]).toHaveTextContent("Measure Name");
    expect(tableHeaders[2]).toHaveTextContent("Version");
    expect(tableHeaders[3]).toHaveTextContent("CMS ID");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(
      otherMeasuresOwnedByUser[0].measureName
    );
    expect(tableRows[0]).toHaveTextContent(otherMeasuresOwnedByUser[0].version);
    expect(tableRows[0]).toHaveTextContent(
      _.toString(otherMeasuresOwnedByUser[0].measureSet.cmsId)
    );

    // test sorting
    const measureNameColumnHeader = await screen.findByRole("button", {
      name: "Measure Name",
    });
    expect(measureNameColumnHeader).toHaveAttribute("title", "Sort ascending");

    userEvent.click(measureNameColumnHeader);

    await waitFor(() => {
      expect(measureNameColumnHeader).toHaveAttribute(
        "title",
        "Sort descending"
      );
    });
  });

  it("should display a text when user doesn't have any other measures from same model", async () => {
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolvedWithNoMeasure;
    });
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={() => jest.fn()}
        onSubmit={() => jest.fn()}
        measure={mockCurrentMeasure}
      />
    );

    const table = await screen.findByTestId("measure-list-tbl");

    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[1]).toHaveTextContent("Measure Name");
    expect(tableHeaders[2]).toHaveTextContent("Version");
    expect(tableHeaders[3]).toHaveTextContent("CMS ID");

    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(1);
    expect(tableRows[0]).toHaveTextContent(
      "You don't have any other measures that you own or are shared with you, belonging to the same model."
    );
  });
});
