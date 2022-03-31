import React, { useCallback, useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";
import "twin.macro";
import "styled-components/macro";
import MeasureList from "../measureList/MeasureList";
import Measure from "../../models/Measure";
import * as _ from "lodash";

import { Divider, Tab, Tabs } from "@mui/material";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import { Button } from "@madie/madie-components";
import {
  Pagination,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import CreateNewMeasureDialog from "./CreateNewMeasureDialog";

export default function NewMeasure() {
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
  const curPage = (values.page && Number(values?.page)) || 1;
  // can we do stuff
  const canGoNext = (() => {
    return curPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handlePageChange = (e, v) => {
    history.push(`?page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    history.push(`?page=${0}&limit=${e.target.value}`);
  };
  //dialog utilities
  const [createOpen, setCreateOpen] = useState(false);
  // bool, if we close on success, we want to retrieve measures again
  const handleClose = (status = false) => {
    if (status) {
      // retrieive
      retrieveMeasures(activeTab, curLimit, curPage - 1);
    }
    setCreateOpen(false);
  };
  // retrieve measures needs to be a callback to avoid dependency depth fail checks
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

  const handleTabChange = (event, nextTab) => {
    const limit = values?.limit || 10;
    history.push(`?tab=${nextTab}&page=0&limit=${limit}`);
  };
  return (
    <div tw="mx-12 mt-5">
      <CreateNewMeasureDialog open={createOpen} onClose={handleClose} />
      <section tw="flex flex-row my-2">
        <h1 tw="text-4xl font-light">Measures</h1>
        <span tw="flex-grow" />
        <Button
          buttonTitle="New Measure"
          tw="h-10"
          onClick={() => {
            setCreateOpen(true);
          }}
          data-testid="create-new-measure-button"
        />
      </section>
      <section tw="flex flex-row">
        <div>
          <Tabs value={activeTab} onChange={handleTabChange} tw="flex flex-row">
            <Tab label={`My Measures`} data-testid="my-measures-tab" />
            <Tab label="All Measures" data-testid="all-measures-tab" />
          </Tabs>
          <Divider />
        </div>
        <span tw="flex-grow" />
      </section>
      <div tw="my-4">
        {/* spin or display */}
        {!initialLoad && (
          <div
            tw="overflow-hidden border-b border-gray-200 sm:rounded-lg"
            style={{ boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)" }}
          >
            <MeasureList measureList={measureList} />
            <div
              style={{
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                border: "1px solid rgba(151, 151, 151, 0.17)",
                borderWidth: "0 1px 1px 1px",
              }}
            >
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
  );
}
