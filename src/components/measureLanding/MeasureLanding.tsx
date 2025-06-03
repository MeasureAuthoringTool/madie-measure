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
} from "@madie/madie-design-system/dist/react";
import "./MeasureLanding.scss";
import { useDocumentTitle, useFeatureFlags } from "@madie/madie-util";
import StatusHandler from "../editMeasure/editor/StatusHandler";

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
  const activeTab: number = values.tab ? Number(values.tab) : 0;
  const [offset, setOffset] = useState<number>(0);
  const [searchCriteria, setSearchCriteria] = useState("");
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [errMsg, setErrMsg] = useState(undefined);
  const [currentSort, setCurrentSort] = useState("");
  const [currentDirection, setCurrentDirection] = useState("");
  const abortController = useRef(null);
  const featureFlags = useFeatureFlags();

  // pull info from some query url
  const measurePageOptions = JSON.parse(
    window.localStorage.getItem("measurePageOptions")
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
    const updatedPage = v;
    const updatedLimit = values?.limit || curLimit;
    // Save to local storage
    localStorage.setItem(
      "measurePageOptions",
      JSON.stringify({
        page: updatedPage,
        limit: updatedLimit,
      })
    );

    setCurrentPage(updatedPage - 1);
    navigate(`?tab=${activeTab}&page=${updatedPage}&limit=${updatedLimit}`);
  };
  const handleLimitChange = (e) => {
    const updatedLimit = e.target.value;
    // Save to local storage
    localStorage.setItem(
      "measurePageOptions",
      JSON.stringify({
        page: 1, // Reset to the first page when limit changes
        limit: updatedLimit,
      })
    );

    setCurrentLimit(updatedLimit);
    navigate(`?tab=${activeTab}&page=1&limit=${updatedLimit}`);
  };

  useEffect(() => {
    if (measurePageOptions) {
      if (
        !Object.keys(values).length &&
        Object.keys(measurePageOptions).length
      ) {
        const { page, limit } = measurePageOptions;
        navigate(`?tab=${activeTab}&page=${page}&limit=${limit}`);
      }
    }
  }, [measurePageOptions, values]);

  const retrieveMeasures = useCallback(
    async (tab, limit, page, searchCriteria, sort, direction) => {
      abortController.current = new AbortController();
      setLoading(true);
      try {
        if (!searchCriteria) {
          setErrMsg(null);
          const data = await measureServiceApi.fetchMeasures(
            tab === 0,
            limit,
            page,
            sort,
            direction,
            abortController.current.signal
          );
          setPageProps(data);
        } else {
          const data = await measureServiceApi.searchMeasuresByCriteria(
            tab === 0,
            limit,
            page,
            { searchField: searchCriteria },
            abortController.current.signal
          );
          setPageProps(data);
        }
      } catch (error) {
        if (error.message !== "canceled") {
          setErrMsg(error.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [measureServiceApi]
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

  const setMeasureCounts = () => {
    if (featureFlags?.MeasureSearch) {
      measureServiceApi
        .getMeasureCounts()
        .then((data) => {
          setMyMeasuresCount(data.myMeasures);
          setAllMeasuresCount(data.allMeasures);
        })
        .catch(() => console.error("Unable to retrieve measure counts"));
    }
  };

  useEffect(() => {
    if (featureFlags?.MeasureSearch) {
      setMeasureCounts();
    }
  }, [
    activeTab,
    featureFlags?.MeasureSearch,
    measureServiceApi.getMeasureCounts,
  ]);

  useEffect(() => {
    retrieveMeasures(
      activeTab,
      curLimit === undefined ? 10 : curLimit,
      curPage - 1,
      searchCriteria,
      currentSort,
      currentDirection
    );
  }, [retrieveMeasures, activeTab, curLimit, curPage, measureServiceApi]);
  // create is in a different app, so we need to listen for it.
  useEffect(() => {
    const createListener = () => {
      retrieveMeasures(
        0,
        curLimit === undefined ? 10 : curLimit,
        0,
        undefined,
        currentSort,
        currentDirection
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
    const limit = values?.limit || 10;
    navigate(`?tab=${nextTab}&page=1&limit=${limit}`);
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
                setMeasureCounts={setMeasureCounts}
                currentSort={currentSort}
                setCurrentSort={setCurrentSort}
                currentDirection={currentDirection}
                setCurrentDirection={setCurrentDirection}
                setErrMsg={setErrMsg}
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
                      ...(totalItems > 50 ? ["All"] : []),
                    ]}
                    offset={offset}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    page={curPage}
                    limit={curLimit}
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
    </div>
  );
}
