import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import "twin.macro";
import "styled-components/macro";
import MeasureList from "./measureList/MeasureList";
import { Measure } from "@madie/madie-models";

import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import {
  Pagination,
  MadieSpinner,
  Tabs,
  Tab,
  Toast,
} from "@madie/madie-design-system/dist/react";
import "./MeasureLanding.scss";
import { useDocumentTitle, useFeatureFlags } from "@madie/madie-util";
import StatusHandler from "../editMeasure/editor/StatusHandler";
import _ from "lodash";

export interface MeasureSearchCriteria {
  searchField?: string;
  optionalSearchProperties?: string[]; // can be ["measureName", "version", "cmsId"] ..etc
  model?: string;
  draft?: boolean;
  excludeByMeasureIds?: string[];
}
export default function MeasureLanding() {
  useDocumentTitle("MADiE Measures");
  const { search } = useLocation();
  let navigate = useNavigate();
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [measureList, setMeasureList] = useState<Measure[]>([]);
  const [myMeasuresCount, setMyMeasuresCount] = useState<number>(0);
  const [allMeasuresCount, setAllMeasuresCount] = useState<number>(0);

  // utilities for pagination
  const values = queryString.parse(search);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [activeTab, setActiveTab] = useState(
    Number(localStorage.getItem("measurePageTab")) || 0
  );
  const [offset, setOffset] = useState<number>(0);
  const [searchCriteria, setSearchCriteria] = useState<MeasureSearchCriteria>({
    searchField: "",
    optionalSearchProperties: [],
  });
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [errMsg, setErrMsg] = useState(undefined);
  const [currentSort, setCurrentSort] = useState("");
  const [currentDirection, setCurrentDirection] = useState("");
  const abortController = useRef(null);
  const featureFlags = useFeatureFlags();

  // Toast state and handlers
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };

  const getStorageKey = (tab) =>
    tab === 0 ? "myMeasurePageOptions" : "allMeasurePageOptions";

  const measurePageOptions = JSON.parse(
    window.localStorage.getItem(getStorageKey(activeTab))
  );

  const curLimit = measurePageOptions?.limit
    ? measurePageOptions.limit
    : values.limit
    ? values.limit
    : 10;

  const curPage = measurePageOptions?.page
    ? measurePageOptions.page
    : values.page
    ? Number(values.page)
    : 1;

  // can we do stuff
  const canGoNext = (() => {
    return curPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handlePageChange = (e, v) => {
    const updatedLimit =
      curLimit !== undefined ? (curLimit === "All" ? 50 : curLimit) : 10;

    setCurrentPage(v - 1);
    navigate(`?tab=${activeTab}&page=${v}&limit=${updatedLimit}`);
  };
  const handleLimitChange = (e) => {
    const newLimit = e.target.value;
    setCurrentLimit(newLimit);
    navigate(`?tab=${activeTab}&page=1&limit=${newLimit}`);
  };

  const searchCriteriaRef = useRef(searchCriteria);
  const currentSortRef = useRef(currentSort);
  const currentDirectionRef = useRef(currentDirection);
  const curLimitRef = useRef(curLimit);
  useEffect(() => {
    searchCriteriaRef.current = searchCriteria;
  }, [searchCriteria]);
  useEffect(() => {
    currentSortRef.current = currentSort;
  }, [currentSort]);
  useEffect(() => {
    currentDirectionRef.current = currentDirection;
  }, [currentDirection]);
  useEffect(() => {
    curLimitRef.current = curLimit;
  }, [curLimit]);

  const setMeasureCounts = useCallback(() => {
    if (featureFlags.MeasureSearch) {
      measureServiceApi
        .getMeasureCounts()
        .then((data) => {
          setMyMeasuresCount(data.myMeasures);
          setAllMeasuresCount(data.allMeasures);
        })
        .catch(() => console.error("Unable to retrieve measure counts"));
    }
  }, [featureFlags.MeasureSearch, measureServiceApi]);

  // Get the count when component mounts or when featureFlag changes
  useEffect(() => {
    setMeasureCounts();
  }, [setMeasureCounts]);

  const retrieveMeasures = useCallback(
    async (
      tab,
      limit,
      page,
      searchCriteria: MeasureSearchCriteria,
      sort,
      direction,
      doUpdateMeasureCount
    ) => {
      abortController.current = new AbortController();
      setLoading(true);
      try {
        const optionalParams = searchCriteria?.optionalSearchProperties ?? [];
        const firstParam = _.trim(optionalParams[0]);

        const modifiedSearchCriteria = {
          ...searchCriteria,
          optionalSearchProperties:
            firstParam && firstParam !== "-" ? [_.camelCase(firstParam)] : [],
        };
        const data = await measureServiceApi.searchMeasuresByCriteria(
          tab === 0,
          limit,
          page,
          sort,
          direction,
          modifiedSearchCriteria,
          abortController.current.signal
        );
        setPageProps(data);
        if (doUpdateMeasureCount) {
          setMeasureCounts();
        }
      } catch (error) {
        if (error.message !== "canceled") {
          setErrMsg(error.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [measureServiceApi, setMeasureCounts]
  );
  const setPageProps = (data) => {
    if (data) {
      const { content, totalPages, totalElements, numberOfElements, pageable } =
        data;
      setTotalPages(totalPages);
      setTotalItems(totalElements);
      setVisibleItems(numberOfElements);
      setMeasureList(content);
      setOffset(pageable.offset);
      setLoading(false);
    }
  };

  useEffect(() => {
    const values = queryString.parse(search);
    const tabFromUrl =
      values.tab !== undefined ? Number(values.tab) : activeTab;

    // Update activeTab and localStorage if the tab in the URL differs
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
      localStorage.setItem("measurePageTab", tabFromUrl.toString());
    }

    const tabStorageKey =
      tabFromUrl === 0 ? "myMeasurePageOptions" : "allMeasurePageOptions";
    const tabPageOptions = JSON.parse(localStorage.getItem(tabStorageKey)) || {
      page: 1,
      limit: 10,
    };

    const updatedPage = values.page ? Number(values.page) : tabPageOptions.page;
    const updatedLimit = values.limit || tabPageOptions.limit;

    // If query parameters are missing, update the URL
    if (!values.page || !values.limit) {
      navigate(`?tab=${tabFromUrl}&page=${updatedPage}&limit=${updatedLimit}`, {
        replace: true,
      });
    }

    localStorage.setItem(
      tabStorageKey,
      JSON.stringify({
        page: updatedPage,
        limit: updatedLimit,
      })
    );

    retrieveMeasures(
      tabFromUrl,
      updatedLimit,
      updatedPage - 1,
      searchCriteria,
      currentSort,
      currentDirection,
      false
    );
  }, [
    search,
    retrieveMeasures,
    activeTab,
    curLimit,
    curPage,
    measureServiceApi,
    searchCriteria,
    currentSort,
    currentDirection,
  ]);

  // Create Event will be dispatched from madie-layout, so we need to listen for it.
  // Should only render once, hence no deps, but the values need to make API call has to be the most latest
  useEffect(() => {
    const createListener = () => {
      retrieveMeasures(
        0,
        curLimitRef.current ?? 10,
        0,
        searchCriteriaRef.current,
        currentSortRef.current,
        currentDirectionRef.current,
        true
      );
    };
    window.addEventListener("create", createListener, false);
    return () => {
      window.removeEventListener("create", createListener, false);
    };
  }, []);

  const handleTabChange = (event, nextTab) => {
    abortController.current.abort();
    setMeasureList(null);

    const tabStorageKey =
      nextTab === 0 ? "myMeasurePageOptions" : "allMeasurePageOptions";
    const tabPageOptions = JSON.parse(localStorage.getItem(tabStorageKey)) || {
      page: 1,
      limit: 10,
    };

    const updatedLimit =
      tabPageOptions.limit !== undefined
        ? nextTab === 1 && tabPageOptions.limit === "All"
          ? 50
          : tabPageOptions.limit
        : 10;
    localStorage.setItem("measurePageTab", nextTab);

    // Save updated page and limit to local storage
    localStorage.setItem(
      tabStorageKey,
      JSON.stringify({
        page: tabPageOptions.page,
        limit: updatedLimit,
      })
    );

    setActiveTab(nextTab);
    navigate(
      `?tab=${nextTab}&page=${tabPageOptions.page}&limit=${updatedLimit}`
    );
  };

  // we need to tell our layout page that we've loaded to prevent strange tab order
  useLayoutEffect(() => {
    const event = new Event("measures-mount");
    window.dispatchEvent(event);
  }, []);

  return (
    <div id="measure-landing" data-testid="measure-landing">
      <div className="measure-table">
        <section
          tw="flex flex-row"
          style={{ borderBottom: "1px solid #b0b0b0" }}
        >
          <div>
            <Tabs value={activeTab} onChange={handleTabChange} type="B">
              <Tab
                type="B"
                label={
                  featureFlags?.MeasureSearch
                    ? "My Measures (" + myMeasuresCount + ")"
                    : "My Measures"
                }
                data-testid="my-measures-tab"
                onClick={() => {
                  setCurrentPage(0);
                }}
              />
              <Tab
                tabIndex={0}
                type="B"
                label={
                  featureFlags?.MeasureSearch
                    ? "All Measures (" + allMeasuresCount + ")"
                    : "All Measures"
                }
                data-testid="all-measures-tab"
                onClick={() => {
                  setCurrentPage(0);
                }}
              />
            </Tabs>
          </div>
          <span tw="flex-grow" />
        </section>
        <div>
          {errMsg && !loading && (
            <StatusHandler
              error={errMsg}
              errorMessage={errMsg}
              success={undefined}
              outboundAnnotations={[]}
              hasSubTitle={true}
            />
          )}

          {/* spin or display */}
          {!loading && (
            <div className="table">
              <MeasureList
                retrieveMeasures={retrieveMeasures}
                measureList={measureList}
                setMeasureList={setMeasureList}
                setTotalPages={setTotalPages}
                setTotalItems={setTotalItems}
                setVisibleItems={setVisibleItems}
                setOffset={setOffset}
                setLoading={setLoading}
                activeTab={activeTab}
                searchCriteria={searchCriteria}
                setSearchCriteria={setSearchCriteria}
                currentLimit={currentLimit}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                handlePageChange={handlePageChange}
                currentSort={currentSort}
                setCurrentSort={setCurrentSort}
                currentDirection={currentDirection}
                setCurrentDirection={setCurrentDirection}
                setErrMsg={setErrMsg}
                search={search}
                // Toast props
                toastOpen={toastOpen}
                toastMessage={toastMessage}
                toastType={toastType}
                setToastOpen={setToastOpen}
                setToastMessage={setToastMessage}
                setToastType={setToastType}
                onToastClose={onToastClose}
              />
              <div className="pagination-container">
                {totalItems > 0 && (
                  <Pagination
                    totalItems={totalItems}
                    visibleItems={visibleItems}
                    limitOptions={[
                      10,
                      25,
                      50,
                      ...(totalItems > 50 && activeTab === 0 ? ["All"] : []),
                    ]}
                    offset={offset}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    page={curPage}
                    limit={
                      curLimit === "All" && totalItems <= 50 ? 50 : curLimit
                    }
                    count={totalPages}
                    shape="rounded"
                    hideNextButton={!canGoNext}
                    hidePrevButton={!canGoPrev}
                  />
                )}
              </div>
            </div>
          )}
        </div>
        {loading && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MadieSpinner style={{ height: 50, width: 50 }} />
          </div>
        )}
      </div>

      {/* Toast component with proper testing attributes */}
      <Toast
        toastKey="measure-action-toast"
        aria-live="polite"
        role="alert"
        toastType={toastType}
        testId={`toast-${toastType}`} // Use a consistent testId pattern
        closeButtonProps={{
          "data-testid": "close-toast-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </div>
  );
}
