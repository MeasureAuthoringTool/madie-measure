import React, { useState, useEffect } from "react";

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
      className="mm:grid mm:gap-4 mm:mx-8 mm:my-6 mm:shadow-lg mm:rounded-md mm:border mm:border-slate mm:bg-white"
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
      <div className="mm:pl-2 mm:pr-2">{props.children && props.children}</div>
    </div>
  );
};

export default TestCaseLandingWrapper;
