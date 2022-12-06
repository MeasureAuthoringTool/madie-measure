import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";
import "twin.macro";
import "styled-components/macro";
import MeasureList from "../measureList/MeasureList";
import { Measure } from "@madie/madie-models";

import { Tab, Tabs } from "@mui/material";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import {
  Pagination,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import "./MeasureLanding.scss";
import { useDocumentTitle } from "@madie/madie-util";
import StatusHandler from "../measureEditor/StatusHandler";

export default function MeasureLanding() {
  useDocumentTitle("MADiE Measures");
  const { search } = useLocation();
  const history = useHistory();
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
    history.push(`?tab=${activeTab}&page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    history.push(`?tab=${activeTab}&page=${0}&limit=${e.target.value}`);
  };

  const retrieveMeasures = useCallback(
    async (tab, limit, page, searchCriteria) => {
      if (!searchCriteria) {
        // const data = await measureServiceApi.fetchMeasures(
        //   tab === 0,
        //   limit,
        //   page
        // );
        // setPageProps(data);
        measureServiceApi
          .fetchMeasures(tab === 0, limit, page)
          .then((data) => {
            setPageProps(data);
          })
          .catch((error: Error) => {
            setErrMsg(error.message);
            setInitialLoad(false);
          });
      } else {
        // const data =
        //   await measureServiceApi.searchMeasuresByMeasureNameOrEcqmTitle(
        //     tab === 0,
        //     limit,
        //     page,
        //     searchCriteria
        //   );
        // setPageProps(data);
        measureServiceApi
          .searchMeasuresByMeasureNameOrEcqmTitle(
            tab === 0,
            limit,
            page,
            searchCriteria
          )
          .then((data) => {
            setPageProps(data);
          })
          .catch((error) => {
            setErrMsg(error.message);
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
    const limit = values?.limit || 10;
    history.push(`?tab=${nextTab}&page=0&limit=${limit}`);
  };

  return (
    <div id="measure-landing" data-testid="measure-landing">
      {/* {errMsg && (
        <StatusHandler
          error={errMsg}
          errorMessage={errMsg}
          success={undefined}
          outboundAnnotations={[]}
        />
      )} */}

      <div className="measure-table">
        <section tw="flex flex-row">
          <div>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                fontWeight: 700,
                color: "#003366",
                "& .MuiTabs-indicator": {
                  height: "6px",
                  backgroundColor: "#209FA6",
                },
                "& .Mui-selected": {
                  fontWeight: 500,
                  color: "#003366 !important",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontSize: "16px",
                },
              }}
            >
              <Tab
                sx={{
                  padding: "24px 21px",
                  fontFamily: "Rubik, sans serif",
                  borderRadius: "6px 0 0 0",
                  fontWeight: 400,
                  color: "#003366",
                }}
                label={`My Measures`}
                data-testid="my-measures-tab"
                onClick={() => {
                  setCurrentPage(0);
                }}
              />
              <Tab
                tabIndex={0}
                sx={{
                  padding: "24px 21px",
                  fontFamily: "Rubik, sans serif",
                  borderRadius: "0 6px 0 0",
                  fontWeight: 400,
                  color: "#003366",
                }}
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
