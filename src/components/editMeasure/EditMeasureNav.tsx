import React, { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
  useMatch,
  useParams,
} from "react-router-dom";
import tw, { styled } from "twin.macro";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import { measureStore } from "@madie/madie-util";
interface PropTypes {
  isActive?: boolean;
}

const MenuItemContainer = tw.ul`bg-transparent flex px-8`;

const MenuItem = styled.li((props: PropTypes) => [
  tw`mr-1 text-white bg-[rgba(0, 32, 64, 0.5)] rounded-t-md hover:bg-[rgba(0,6,13, 0.5)]`,
  props.isActive && tw`bg-slate text-slate-90 font-medium hover:bg-slate`,
]);

const EditMeasureNav = ({ isQDM }) => {
  const [testCaseLength, setTestCaseLength] = useState<any>(null);
  const testCaseLabel =
    testCaseLength === null ? `Test Cases` : `Test Cases (${testCaseLength})`;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { measureId } = useParams<{
    measureId: string;
  }>();
  const qdmNavTo = () => {
    isQDM ? `${pathname}/base-configuration` : `${pathname}/groups/1`;
  };
  // we grab the matching pattern after edit, then we only get the part before the next slash.
  const fullMatch = useMatch("/measures/:id/edit/*")?.params?.["*"];
  if (fullMatch === "details" && measureId) {
    navigate(`/measures/${measureId}/edit/details/`);
  }
  const match = useMatch("/measures/:id/edit/*")?.params?.["*"].split("/")[0];

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
        <Tabs value={match} type="A" size="standard">
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
