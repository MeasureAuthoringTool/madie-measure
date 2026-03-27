import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useMatch, useParams } from "react-router-dom";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import { measureStore } from "@madie/madie-util";

const EditMeasureNav = ({ isQDM }) => {
  const [testCaseLength, setTestCaseLength] = useState<any>(null);
  const testCaseLabel =
    testCaseLength === null ? `Test Cases` : `Test Cases (${testCaseLength})`;
  let navigate = useNavigate();
  const { measureId } = useParams<{
    measureId: string;
  }>();
  // we grab the matching pattern after edit, then we only get the part before the next slash.
  const fullMatch = useMatch("/measures/:id/edit/*")?.params?.["*"];
  if (fullMatch === "details" && measureId) {
    navigate(`/measures/${measureId}/edit/details/`);
  }
  const match = useMatch("/measures/:id/edit/*")?.params?.["*"].split("/")[0];
  const populationCriteriaRoutes = isQDM
    ? ["groups", "supplemental-data", "risk-adjustment", "reporting"]
    : ["supplemental-data", "risk-adjustment"];
  // update the tab value to make sure correct population criteria tab is active for sub-routes
  const tabValue = populationCriteriaRoutes.includes(match!)
    ? isQDM
      ? "base-configuration"
      : "groups"
    : match;

  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (measureId) {
      const testCases = measure?.testCases;
      if (testCases === null) {
        setTestCaseLength(0);
        // when test cases are null, then we set to 0 since they are absent. Otherwise we display 0 before anything shows up
      } else if (testCases?.length >= 0) {
        setTestCaseLength(testCases?.length);
      }
    }
  }, [measureId, measure?.testCases, measure?.testCases?.length]);

  // hitting spacebar here will scroll down the page. We're going to prevent the default event and simulate a click.
  const handleSpaceSelect = (event) => {
    if (event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  };
  return (
    <div>
      <div style={{ marginLeft: "32px" }} id="edit-measure-nav-a">
        <Tabs value={tabValue} type="A" size="standard">
          <Tab
            value={`details`}
            to="details"
            data-testid="measure-details-tab"
            type="A"
            size="standard"
            label="Details"
            component={NavLink}
            onKeyDown={handleSpaceSelect}
          />
          {!measure?.measureMetaData?.composite && (
            <Tab
              value="cql-editor"
              to={`cql-editor`}
              data-testid="cql-editor-tab"
              type="A"
              size="standard"
              label="CQL Editor"
              component={NavLink}
              onKeyDown={handleSpaceSelect}
            />
          )}
          <Tab
            value={isQDM ? `base-configuration` : `groups`}
            to={isQDM ? `base-configuration` : `groups/1`}
            data-testid="groups-tab"
            type="A"
            size="standard"
            label="Population Criteria"
            component={NavLink}
            onKeyDown={handleSpaceSelect}
          />
          <Tab
            value={`test-cases`}
            to={`test-cases/list-page`}
            data-testid="patients-tab"
            type="A"
            size="standard"
            label={testCaseLabel}
            component={NavLink}
            onKeyDown={handleSpaceSelect}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default EditMeasureNav;
