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
import { useDocumentTitle } from "@madie/madie-util";
import StatusHandler from "../editMeasure/editor/StatusHandler";

export default function MeasureLanding() {
  useDocumentTitle("MADiE Measures");
  const { search } = useLocation();
  let navigate = useNavigate();
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [measureList, setMeasureList] = useState<Measure[]>([]);

  // utilities for pagination
  const values = queryString.parse(search);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const activeTab: number = values.tab ? Number(values.tab) : 0;
  const [offset, setOffset] = useState<number>(0);
  const [searchCriteria, setSearchCriteria] = useState("");
  const [currentLimit, setCurrentLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [errMsg, setErrMsg] = useState(undefined);
  const abortController = useRef(null);

  // pull info from some query url
  const curLimit = values.limit && Number(values.limit);
  const curPage = (values.page && Number(values.page)) || 1;
  // can we do stuff
  const canGoNext = (() => {
    return curPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handlePageChange = (e, v) => {
    setCurrentPage(v - 1);
    navigate(`?tab=${activeTab}&page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    navigate(`?tab=${activeTab}&page=${0}&limit=${e.target.value}`);
  };

  const retrieveMeasures = useCallback(
    async (tab, limit, page, searchCriteria) => {
      abortController.current = new AbortController();
      if (!searchCriteria) {
        setErrMsg(null);
        measureServiceApi
          .fetchMeasures(tab === 0, limit, page, abortController.current.signal)
          .then((data) => {
            setPageProps(data);
          })
          .catch((error: Error) => {
            if (error.message != "canceled") {
              setErrMsg(error.message);
            }
            setInitialLoad(false);
          });
      } else {
        measureServiceApi
          .searchMeasuresByMeasureNameOrEcqmTitle(
            tab === 0,
            limit,
            page,
            searchCriteria,
            abortController.current.signal
          )
          .then((data) => {
            setPageProps(data);
          })
          .catch((error) => {
            if (error.message != "canceled") {
              setErrMsg(error.message);
            }
            setInitialLoad(false);
          });
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
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    retrieveMeasures(
      activeTab,
      curLimit === undefined ? 10 : curLimit,
      curPage - 1,
      searchCriteria
    );
  }, [retrieveMeasures, activeTab, curLimit, curPage, measureServiceApi]);
  // create is in a different app, so we need to listen for it.
  useEffect(() => {
    const createListener = () => {
      retrieveMeasures(0, curLimit === undefined ? 10 : curLimit, 0, undefined);
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
    navigate(`?tab=${nextTab}&page=0&limit=${limit}`);
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
                label={`My Measures`}
                data-testid="my-measures-tab"
                onClick={() => {
                  setCurrentPage(0);
                }}
              />
              <Tab
                tabIndex={0}
                type="B"
                label="All Measures"
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
          {errMsg && !initialLoad && (
            <StatusHandler
              error={errMsg}
              errorMessage={errMsg}
              success={undefined}
              outboundAnnotations={[]}
              hasSubTitle={true}
            />
          )}

          {/* spin or display */}
          {!initialLoad && (
            <div className="table">
              <MeasureList
                measureList={measureList}
                setMeasureList={setMeasureList}
                setTotalPages={setTotalPages}
                setTotalItems={setTotalItems}
                setVisibleItems={setVisibleItems}
                setOffset={setOffset}
                setInitialLoad={setInitialLoad}
                activeTab={activeTab}
                searchCriteria={searchCriteria}
                setSearchCriteria={setSearchCriteria}
                currentLimit={currentLimit}
                currentPage={currentPage}
                setErrMsg={setErrMsg}
              />
              <div className="pagination-container">
                {totalItems > 0 && (
                  <Pagination
                    totalItems={totalItems}
                    visibleItems={visibleItems}
                    limitOptions={[10, 25, 50]}
                    offset={offset}
                    handlePageChange={handlePageChange}
                    handleLimitChange={handleLimitChange}
                    page={Number(values?.page) || 1}
                    limit={Number(values?.limit) || 10}
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
        {initialLoad && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <MadieSpinner style={{ height: 50, width: 50 }} />
          </div>
        )}
      </div>
    </div>
  );
}
