import React, { useState, useEffect } from "react";
import "twin.macro";
import "styled-components/macro";
import { Group } from "@madie/madie-models";
import * as _ from "lodash";
import TestCaseListSideBarNav from "./TestCaseListSideBarNav";
import { measureStore, useFeatureFlags } from "@madie/madie-util";

const COLLAPSED_WIDTH = 48;
const EXPANDED_WIDTH = 260;

const testCaseSidebarCollapsedKey = "testCaseSidebarCollapsed";

const TestCaseLandingWrapper = (props) => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem(testCaseSidebarCollapsedKey) === "true"
  );

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      testCaseSidebarCollapsedKey,
      isCollapsed ? "true" : "false"
    );
  }, [isCollapsed]);

  useEffect(() => {
    if (measure?.testCases && !measure?.testCases?.length) {
      setIsCollapsed(true);
    }
  }, [measure]);

  return (
    <div
      tw="grid gap-4 mx-8 my-6 shadow-lg rounded-md border border-slate bg-white"
      data-testid="test-case-landing-wrapper"
      style={{
        marginTop: 16,
        gridTemplateColumns: `${
          isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
        }px 1fr`,
      }}
    >
      <TestCaseListSideBarNav
        allPopulationCriteria={measure?.groups}
        qdm={props.qdm}
        isComposite={measure?.measureMetaData?.composite}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div tw="pl-2 pr-2">{props.children && props.children}</div>
    </div>
  );
};

export default TestCaseLandingWrapper;
