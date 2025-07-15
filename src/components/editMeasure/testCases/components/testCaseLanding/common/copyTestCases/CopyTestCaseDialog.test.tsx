import CopyTestCaseDialog from "./CopyTestCaseDialog";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";
import {
  Measure,
  MeasureSet,
  Model,
  TestCase,
  ValidationStatus,
} from "@madie/madie-models";
import * as _ from "lodash";
import useMeasureServiceApi, {
  MeasureServiceApi,
} from "../../../../../../../api/useMeasureServiceApi";
import userEvent from "@testing-library/user-event";
import useTestCaseServiceApi, {
  TestCaseServiceApi,
} from "../../../../api/useTestCaseServiceApi";
import { useFeatureFlags } from "@madie/madie-util";
const { getByTestId, getByRole, findByTestId, findByRole } = screen;

const MEASURE_OWNER = "test.user";

jest.mock("@madie/madie-util", () => ({
  useFeatureFlags: jest.fn().mockReturnValue({
    EditTestsOnVersionedMeasures: false,
  }),
}));

const testCases = [
  {
    id: "1",
    description: "Test IPP",
    title: "WhenAllGood",
    series: "IPP_Pass",
    lastModifiedAt: "2024-09-10T09:56:14.382Z",
    validResource: true,
    validationStatus: ValidationStatus.VALID,
  } as unknown as TestCase,
  {
    id: "2",
    description: "Test IPP Fail when something is wrong",
    title: "WhenSomethingIsWrong",
    series: "IPP_Fail",
    lastModifiedAt: "2024-09-10T09:57:14.382Z",
    validResource: true,
    validationStatus: ValidationStatus.PENDING,
  },
  {
    id: "3",
    description: "Invalid test case",
    title: "WhenJsonIsInvalid",
    series: "IPP_Fail",
    lastModifiedAt: "2024-09-10T09:58:14.382Z",
    validResource: false,
    validationStatus: ValidationStatus.VALIDATING,
  },
] as TestCase[];

const mockCurrentMeasure = {
  id: "1",
  measureName: "QDM Measure Name",
  hasAssociatedMeasures: true,
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
    hasAssociatedMeasures: true,
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
    hasAssociatedMeasures: true,
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
    hasAssociatedMeasures: true,
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
    hasAssociatedMeasures: true,
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
    hasAssociatedMeasures: true,
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
  getTestCasesByMeasureId: jest.fn().mockResolvedValue(testCases),
} as unknown as MeasureServiceApi;

jest.mock("../../../../api/useTestCaseServiceApi");
const useTestCaseServiceMock =
  useTestCaseServiceApi as jest.Mock<TestCaseServiceApi>;

const searchMeasuresByCriteriaFn = jest
  .fn()
  .mockResolvedValue(mockMeasureSearchResponse);
const getAllTestCasesFn = jest.fn().mockResolvedValue(testCases);
const closeFn = jest.fn().mockName("close");

describe("Copy Test Case Dialog Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should display list of qdm measures that current user owns", async () => {
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolved;
    });
    useTestCaseServiceMock.mockImplementation(() => {
      return {
        copyTestCasesToMeasure: jest.fn().mockResolvedValueOnce(["1", "2"]),
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: true,
    }));
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={() => jest.fn()}
        measure={mockCurrentMeasure}
        selectedTestCases={testCases.map((tc) => tc.id)}
      />
    );

    const table = await findByTestId("measure-list-tbl");

    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[1]).toHaveTextContent("Measure Name");
    expect(tableHeaders[2]).toHaveTextContent("Version");
    expect(tableHeaders[3]).toHaveTextContent("Status");
    expect(tableHeaders[4]).toHaveTextContent("CMS ID");
    expect(tableHeaders[5]).toHaveTextContent("");

    const tableRows = table.querySelectorAll("tbody tr");

    expect(tableRows[0]).toHaveTextContent(
      otherMeasuresOwnedByUser[0].measureName
    );
    expect(tableRows[0]).toHaveTextContent(otherMeasuresOwnedByUser[0].version);
    expect(tableRows[0]).toHaveTextContent(
      _.toString(otherMeasuresOwnedByUser[0]?.measureSet.cmsId)
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

  it("Filter and Search, changes, fire, clear", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      EditTestsOnVersionedMeasures: false,
    }));
    const useMeasureServiceMockResolvedMultiple = {
      searchMeasuresByCriteria: searchMeasuresByCriteriaFn,
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolvedMultiple;
    });

    useTestCaseServiceMock.mockImplementation(() => {
      return {
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });

    const test = new AbortController();
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={() => jest.fn()}
        measure={mockCurrentMeasure}
        selectedTestCases={testCases.map((tc) => tc.id)}
      />
    );

    await waitFor(() =>
      expect(searchMeasuresByCriteriaFn).toHaveBeenCalledTimes(1)
    );
    const table = await findByTestId("measure-list-tbl");
    const tableHeaders = table.querySelectorAll("thead th");
    expect(tableHeaders[1]).toHaveTextContent("Measure Name");
    expect(tableHeaders[2]).toHaveTextContent("Version");
    expect(tableHeaders[3]).toHaveTextContent("Status");
    expect(tableHeaders[4]).toHaveTextContent("CMS ID");
    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows[0]).toHaveTextContent(
      otherMeasuresOwnedByUser[0].measureName
    );
    expect(tableRows[0]).toHaveTextContent(otherMeasuresOwnedByUser[0].version);
    expect(tableRows[0]).toHaveTextContent(
      _.toString(otherMeasuresOwnedByUser[0].measureSet.cmsId)
    );
    //changes
    const filterInput = getByTestId(
      "filter-by-select-input"
    ) as HTMLInputElement;
    expect(filterInput).toBeInTheDocument();
    expect(filterInput.value).toBe("");
    fireEvent.change(filterInput, {
      target: { value: "Measure" },
    });
    expect(filterInput.value).toBe("Measure");

    // fire condition 1
    const searchFieldInput = getByTestId(
      "test-case-list-search-input"
    ) as HTMLInputElement;
    expect(searchFieldInput.value).toBe("");

    userEvent.type(searchFieldInput, "test{enter}");

    await waitFor(() =>
      expect(searchMeasuresByCriteriaFn).toHaveBeenCalledTimes(2)
    );
    expect(searchMeasuresByCriteriaFn).toHaveBeenNthCalledWith(
      2, // Second call
      true,
      5,
      0,
      "lastModifiedAt",
      "DESC",
      {
        draft: true,
        excludeByMeasureIds: ["1"],
        model: "QDM v5.6",
        optionalSearchProperties: ["measureName"],
        searchField: "test",
      },
      test,
      "testCase"
    );
    // Finally, check the second call for the correct values
    const clearIcon = getByTestId("ClearIcon");
    userEvent.click(clearIcon);
    await waitFor(() =>
      expect(searchMeasuresByCriteriaFn).toHaveBeenCalledTimes(3)
    );
    expect(searchMeasuresByCriteriaFn).toHaveBeenNthCalledWith(
      3,
      true,
      5,
      0,
      "lastModifiedAt",
      "DESC",
      {
        draft: true,
        excludeByMeasureIds: ["1"],
        model: "QDM v5.6",
        optionalSearchProperties: [],
        searchField: "",
      },
      test,
      "testCase"
    );

    userEvent.type(searchFieldInput, "test{enter}");
    await waitFor(() =>
      expect(searchMeasuresByCriteriaFn).toHaveBeenCalledTimes(4)
    );
    expect(searchMeasuresByCriteriaFn).toHaveBeenNthCalledWith(
      4,
      true,
      5,
      0,
      "lastModifiedAt",
      "DESC",
      {
        draft: true,
        excludeByMeasureIds: ["1"],
        model: "QDM v5.6",
        optionalSearchProperties: ["measureName", "version", "cmsId"],
        searchField: "test",
      },
      test,
      "testCase"
    );
  });

  it("should display a text when user doesn't have any other measures from same model", async () => {
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolvedWithNoMeasure;
    });
    useTestCaseServiceMock.mockImplementation(() => {
      return {
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={() => jest.fn()}
        measure={mockCurrentMeasure}
        selectedTestCases={testCases.map((tc) => tc.id)}
      />
    );

    const table = await screen.findByTestId("measure-list-tbl");

    const tableHeaders = table.querySelectorAll("thead th");

    expect(tableHeaders[1]).toHaveTextContent("Measure Name");
    expect(tableHeaders[2]).toHaveTextContent("Version");
    expect(tableHeaders[3]).toHaveTextContent("Status");
    expect(tableHeaders[4]).toHaveTextContent("CMS ID");

    const tableRows = table.querySelectorAll("tbody tr");
    expect(tableRows.length).toBe(1);
    expect(tableRows[0]).toHaveTextContent(
      "You don't have any other measures that you own or are shared with you, belonging to the same model."
    );
  });

  it("should display a spinner while copying", async () => {
    const useMeasureServiceMockResolvedMultiple = {
      searchMeasuresByCriteria: searchMeasuresByCriteriaFn,
    } as unknown as MeasureServiceApi;

    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolvedMultiple;
    });

    useTestCaseServiceMock.mockImplementation(() => {
      return {
        copyTestCasesToMeasure: jest.fn().mockResolvedValue({
          copiedTestCases: testCases,
          didClearExpectedValues: false,
        }),
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });
    const test = new AbortController();
    await prepCopy(closeFn, searchMeasuresByCriteriaFn);
    await runCopy();
    expect(closeFn).toHaveBeenCalledTimes(1);
    expect(closeFn).toHaveBeenCalledWith(
      "Test Cases have been successfully copied.",
      "success"
    );
  });

  it("should return toast message indicating cleared expected values", async () => {
    useTestCaseServiceMock.mockImplementation(() => {
      return {
        copyTestCasesToMeasure: jest.fn().mockResolvedValue({
          copiedTestCases: testCases,
          didClearExpectedValues: true,
        }),
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });
    const test = new AbortController();
    await prepCopy(closeFn, searchMeasuresByCriteriaFn);
    await runCopy();
    expect(closeFn).toHaveBeenCalledTimes(1);
    expect(closeFn).toHaveBeenCalledWith(
      "Test Cases successfully copied without expected values due to differing Population Criteria on target Measure.",
      "success"
    );
  });

  it("should return toast message indicating partial copy", async () => {
    useTestCaseServiceMock.mockImplementation(() => {
      return {
        copyTestCasesToMeasure: jest.fn().mockResolvedValue({
          copiedTestCases: [...testCases].pop(),
          didClearExpectedValues: true,
        }),
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });
    const test = new AbortController();
    await prepCopy(closeFn, searchMeasuresByCriteriaFn);
    await runCopy();
    expect(closeFn).toHaveBeenCalledTimes(1);
    expect(closeFn).toHaveBeenCalledWith(
      "Test Cases could not copied.",
      "danger"
    );
  });

  it("should display cannot copy message on CopyTestCaseDialog when test cases have validationStatus Pending or Validating", async () => {
    const useMeasureServiceMockResolvedMultiple = {
      searchMeasuresByCriteria: searchMeasuresByCriteriaFn,
    } as unknown as MeasureServiceApi;
    useMeasureServiceMock.mockImplementation(() => {
      return useMeasureServiceMockResolvedMultiple;
    });
    useTestCaseServiceMock.mockImplementation(() => {
      return {
        getTestCasesByMeasureId: getAllTestCasesFn,
      } as unknown as TestCaseServiceApi;
    });
    const currenMeasure = { ...mockCurrentMeasure, model: Model.QICORE_6_0_0 };
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={closeFn}
        measure={currenMeasure}
        selectedTestCases={testCases}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("copy-test-cases-cannot-copy-message")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("copy-test-cases-cannot-copy-message")
      ).toHaveTextContent(
        "Some of the selected test cases are pending validation. Test cases cannot be copied at this time. Once validations are complete, please try again."
      );
    });
  });

  it("does not show cannot copy message when all selected test cases are valid", () => {
    useTestCaseServiceMock.mockImplementation(() => {
      return {
        getTestCasesByMeasureId: jest.fn().mockResolvedValue(testCases),
      } as unknown as TestCaseServiceApi;
    });
    render(
      <CopyTestCaseDialog
        open={true}
        onClose={closeFn}
        measure={{ id: "m1", model: "QI-Core" }}
        selectedTestCases={[testCases[0]]}
      />
    );
    expect(
      screen.queryByTestId("copy-test-cases-cannot-copy-message")
    ).not.toBeInTheDocument();
  });
});

const prepCopy = async (closeFn, testFn) => {
  render(
    <CopyTestCaseDialog
      open={true}
      onClose={closeFn}
      measure={mockCurrentMeasure}
      selectedTestCases={testCases.map((tc) => tc.id)}
    />
  );
  await waitFor(() => expect(testFn).toHaveBeenCalledTimes(1));
  const table = await findByTestId("measure-list-tbl");
  const tableRows = table.querySelectorAll("tbody tr");
  expect(tableRows[0]).toHaveTextContent(
    otherMeasuresOwnedByUser[0].measureName
  );
  const radioButtons = await screen.findAllByRole("radio");
  radioButtons.forEach((radioButton) => {
    expect(radioButton).not.toBeChecked();
  });
  // Requires double click. Not sure why.
  userEvent.click(radioButtons[0]);
  userEvent.click(radioButtons[0]);
  await waitFor(() => {
    expect(radioButtons.at(0)).toBeChecked();
  });
};

const runCopy = async () => {
  expect(getByTestId("copy-test-cases-continue-button")).toBeEnabled();
  userEvent.click(getByTestId("copy-test-cases-continue-button"));
  await findByRole("progressbar");
};
