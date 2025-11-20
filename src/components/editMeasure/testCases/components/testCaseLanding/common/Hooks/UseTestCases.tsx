import { useCallback, useState, useEffect, useRef } from "react";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import { TestCase } from "@madie/madie-models";
import { measureStore } from "@madie/madie-util";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import * as _ from "lodash";
import { SortingState } from "@tanstack/react-table";

export const decorateWithExecutionStatus = (testCases: TestCase[]) => {
  testCases.forEach((testCase: any) => {
    if (!testCase.executionStatus) {
      testCase.executionStatus = testCase.validResource ? "NA" : "Invalid";
    }
  });
  return testCases;
};

export const customSort = (a: string, b: string) => {
  if (a === null || a === undefined || a === "") {
    return 1;
  } else if (b === null || b === undefined || b === "") {
    return -1;
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  const aComp = a.trim().toLocaleLowerCase();
  const bComp = b.trim().toLocaleLowerCase();
  if (aComp < bComp) return -1;
  if (aComp > bComp) return 1;
  return 0;
};

export const sortFilteredTestCases = (
  sorting: SortingState,
  testCases: TestCase[]
) => {
  const sorts = sorting?.[0];
  const testCaseCopy = testCases.slice();
  if (sorts) {
    const { id, desc } = sorts;
    // sort the testCaseList in either descending or ascending order based on the sorts object
    testCaseCopy.sort((a, b) => {
      const aValue = a[id as keyof typeof a] as string;
      const bValue = b[id as keyof typeof b] as string;
      // Use customSort function for comparing values
      const comparison = customSort(aValue, bValue);
      // If desc is true, reverse the order
      return desc ? -comparison : comparison;
    });
  }
  return testCaseCopy;
};

export const buildTestCaseUrl = ({
  filter,
  search,
  page,
  limit,
}: {
  filter?: string | string[];
  search?: string | string[];
  page?: number;
  limit?: string | string[] | number;
}) => {
  const filterStr = Array.isArray(filter) ? filter[0] : filter ?? "";
  const searchStr = Array.isArray(search) ? search[0] : search ?? "";
  const pageValue = page ?? 1;
  const limitValue = Array.isArray(limit) ? limit[0] : limit ?? 10;

  return (
    `?filter=${encodeURIComponent(filterStr)}` +
    `&search=${encodeURIComponent(searchStr)}` +
    `&page=${pageValue}&limit=${limitValue}`
  );
};

function UseFetchTestCases({ measureId, setErrors }) {
  const { search } = useLocation();
  const values = queryString.parse(search);
  const testCaseService = useRef(useTestCaseServiceApi());
  const [testCases, setTestCases] = useState<TestCase[]>(null); // all test cases.. what about
  const [sortedTestCases, setSortedTestCases] = useState<TestCase[]>(null); //An extra copy to remember remember sort order..
  // TO Do: figure out if this should just be sorted against lastModified for better space complexity. Time complexity will suffer. Not sure either will matter.
  const [loadingState, setLoadingState] = useState<any>({
    loading: true,
    message: "",
  });
  // preserve sort order for react table display
  const [sorting, setSorting] = useState<SortingState>([]);

  const handlePageChange = (e, v) => {
    navigate(
      buildTestCaseUrl({
        filter: values.filter,
        search: values.search,
        page: v,
        limit: values.limit,
      })
    );
  };

  const handleLimitChange = (e) => {
    navigate(
      buildTestCaseUrl({
        filter: values.filter,
        search: values.search,
        page: 1,
        limit: e.target.value,
      })
    );
  };

  // Save local storage variable for page, filter, search, clear when navigating to different measure
  const testCasePageOptions = JSON.parse(
    window.localStorage.getItem("testCasesPageOptions")
  );
  useEffect(() => {
    // given we're on the base page and no we're not intentionally using search query params, we want to load them from local state.
    if (testCasePageOptions) {
      if (
        !Object.keys(values).length &&
        Object.keys(testCasePageOptions).length
      ) {
        const { filter, limit, search, page } = testCasePageOptions;
        navigate(buildTestCaseUrl({ filter, search, page, limit }));
      }
    }
  }, [testCasePageOptions, values]);
  const [testCasePage, setTestCasePage] = useState({
    totalItems: null,
    visibleItems: null,
    offset: 0,
    page: 1,
    limit: 10 || "All",
    count: undefined,
    currentSlice: [],
    canGoNext: false,
    canGoPrev: false,
    handlePageChange,
    handleLimitChange,
  });
  const { updateTestCases } = measureStore;
  const filter: string = values?.filter ? values.filter.toString() : "";
  // pull info from some query url
  let searchQuery: string = values?.search ? values.search.toString() : "";
  const curLimit =
    values.limit === "All" && testCases?.length > 0
      ? testCases?.length
      : Number(values.limit) || 10;
  const curPage = (values.page && Number(values.page)) || 1;
  let navigate = useNavigate();

  const getTestCasePage = useCallback(() => {
    // first we want to get all the possible test cases based off of our filter
    if (testCases) {
      const filterMap = {
        Group: "series",
        Status: "executionStatus",
        Title: "title",
        Description: "description",
        "Case #": "caseNumber",
      };
      // edge case that will certainly get hit
      if (
        filterMap[filter] === "executionStatus" &&
        searchQuery.toLowerCase() === "n/a"
      ) {
        searchQuery = "NA";
      }
      const start = (curPage - 1) * curLimit;
      const end = start + curLimit;
      // save for navigation along the same measureId
      localStorage.setItem(
        "testCasesPageOptions",
        JSON.stringify({
          page: curPage,
          limit: (values.limit === "All" && values.limit) || curLimit,
          filter,
          search: searchQuery,
        })
      );
      const canGoPrev = Number(values?.page) > 1;

      // with filter specify filter key, without filter, check status, group, title, description
      if (searchQuery) {
        let filteredTestCases = [...testCases];
        if (filter) {
          filteredTestCases = testCases.filter((tc) =>
            tc[filterMap[filter]]
              ?.toString()
              .toLowerCase()
              .includes(searchQuery?.toLocaleLowerCase())
          );
        } else if (!filter) {
          // check for matches in any of the filter categories
          filteredTestCases = testCases.filter((tc) =>
            Object.values(filterMap).some((key) =>
              tc[key]
                ?.toString()
                ?.toLowerCase()
                .includes(searchQuery?.toLowerCase())
            )
          );
        }
        const sortedTestCases = sortFilteredTestCases(
          sorting,
          filteredTestCases
        );
        const currentSlice = [...sortedTestCases].slice(start, end);
        const count = Math.ceil(filteredTestCases.length / curLimit);
        const canGoNext = (() => {
          return curPage < count;
        })();
        setSortedTestCases(sortedTestCases);
        setTestCasePage({
          totalItems: filteredTestCases.length,
          visibleItems: currentSlice.length,
          offset: start,
          page: curPage,
          limit: (values.limit === "All" && values.limit) || curLimit,
          count: Math.ceil(filteredTestCases.length / curLimit),
          currentSlice,
          handlePageChange,
          handleLimitChange,
          canGoNext,
          canGoPrev,
        });
      } else {
        const sortedTestCases = sortFilteredTestCases(sorting, testCases);
        const currentSlice = [...sortedTestCases].slice(start, end);
        const count = Math.ceil(testCases.length / curLimit);
        const canGoNext = (() => {
          return curPage < count;
        })();
        setSortedTestCases(sortedTestCases);
        setTestCasePage({
          totalItems: testCases.length,
          visibleItems: currentSlice.length,
          offset: start,
          page: curPage,
          limit: (values.limit === "All" && values.limit) || curLimit,
          count,
          currentSlice,
          handlePageChange,
          handleLimitChange,
          canGoNext,
          canGoPrev,
        });
      }
    }
  }, [testCases, curPage, curLimit, filter, searchQuery, sorting]);
  useEffect(() => {
    getTestCasePage();
  }, [getTestCasePage]);

  const retrieveTestCases = useCallback(() => {
    setLoadingState(() => ({
      loading: true,
      message: "Loading Test Cases...",
    }));
    testCaseService.current
      .getTestCasesByMeasureId(measureId)
      .then((testCaseList: TestCase[]) => {
        testCaseList.forEach((testCase: any) => {
          testCase.executionStatus = testCase.validResource ? "NA" : "Invalid";
        });
        testCaseList = _.orderBy(testCaseList, ["lastModifiedAt"], ["desc"]);
        updateTestCases(testCaseList);
        setTestCases(testCaseList); // point of truth centralized state
        setSortedTestCases(
          testCaseList.sort((a, b) => b.caseNumber - a.caseNumber)
        ); // our actual sort
      })
      .catch((err) => {
        setErrors((prevState) => [...prevState, err.message]);
      })
      .finally(() => {
        setLoadingState({ loading: false, message: "" });
      });
  }, [measureId, testCaseService, setErrors]);

  // We want to modify the local state of test cases on successful modifications
  const removeTestCases = (testCaseIds: string[]) => {
    // should show either deleting test casees or deleting test case based on length
    setLoadingState({
      loading: true,
      message: `Deleting test case${testCaseIds.length > 1 ? "s" : ""}`,
    });
    setTestCases((prevTestCases) =>
      prevTestCases.filter((testCase) => !testCaseIds.includes(testCase.id))
    );
    setLoadingState({ loading: false, message: "" });
  };
  const insertTestCases = (newTestCases: TestCase[]) => {
    decorateWithExecutionStatus(newTestCases);
    setLoadingState({ loading: true, message: "Adding Test Case" });
    const updatedTestCases = [...newTestCases, ...testCases];
    setTestCases(updatedTestCases);
    setLoadingState({ loading: false, message: "" });
  };

  useEffect(() => {
    retrieveTestCases();
  }, [retrieveTestCases]);

  return {
    testCaseService,
    testCases: sortedTestCases, //all test cases to run execution against
    testCasePage, //all pagination required values
    removeTestCases,
    insertTestCases,
    setTestCases,
    loadingState,
    setLoadingState,
    retrieveTestCases,
    sorting,
    setSorting,
  };
}

export default UseFetchTestCases;
