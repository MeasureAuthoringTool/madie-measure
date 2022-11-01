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
  // pull info from some query url
  const curLimit = values.limit && Number(values.limit);
  const curPage = (values.page && Number(values.page)) || 1;
  // can we do stuff
  const canGoNext = (() => {
    return curPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handlePageChange = (e, v) => {
    history.push(`?tab=${activeTab}&page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    history.push(`?tab=${activeTab}&page=${0}&limit=${e.target.value}`);
  };

  const retrieveMeasures = useCallback(
    async (tab = 0, limit = 10, page = 0) => {
      const data = await measureServiceApi.fetchMeasures(
        tab === 0,
        limit,
        page
      );
      if (data) {
        const {
          content,
          totalPages,
          totalElements,
          numberOfElements,
          pageable,
        } = data;
        setTotalPages(totalPages);
        setVisibleItems(numberOfElements);
        setTotalItems(totalElements);
        setMeasureList(content);
        setOffset(pageable.offset);
        setInitialLoad(false);
      }
    },
    [measureServiceApi]
  );

  useEffect(() => {
    retrieveMeasures(activeTab, curLimit, curPage - 1);
  }, [retrieveMeasures, activeTab, curLimit, curPage, measureServiceApi]);
  // create is in a different app, so we need to listen for it.
  useEffect(() => {
    const createListener = () => {
      retrieveMeasures();
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
              />
            </Tabs>
          </div>
          <span tw="flex-grow" />
        </section>
        <div>
          {/* spin or display */}
          {!initialLoad && (
            <div className="table">
              <MeasureList measureList={measureList} />
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
