import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Group } from "@madie/madie-models";
import tw from "twin.macro";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpansionIcon from "@mui/icons-material/KeyboardTabOutlined";
import IconButton from "@mui/material/IconButton";
import "../../../../../../styles/VerticalSideBarNav.scss";

const InnerWrapper = tw.div`flex flex-grow flex-col`;

export interface TestCaseListSideBarNavProps {
  allPopulationCriteria: Group[];
  qdm?: Boolean;
  isCollapsed: boolean;
  setIsCollapsed: Function;
}

const TestCaseListSideBarNav = ({
  allPopulationCriteria,
  qdm,
  isCollapsed,
  setIsCollapsed,
}: TestCaseListSideBarNavProps) => {
  let navigate = useNavigate();
  const { measureId, criteriaId } = useParams<{
    measureId: string;
    criteriaId: string;
  }>();

  let location = useLocation();
  const { pathname } = location;

  const [showConfigTabs, setShowConfigTabs] = useState<boolean>(true);
  const [showPopulationCriteriaTabs, setShowPopulationCriteriaTabs] =
    useState<boolean>(true);

  const handleChange = (e, v) => {
    const newPath = `/measures/${measureId}/edit/test-cases/list-page/${v}`;
    navigate(newPath);
  };

  const endRoute = /[^/]*$/.exec(pathname)[0];

  if (isCollapsed) {
    // Show only the "expand" icon when collapsed
    return (
      <button
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          cursor: "pointer",
          paddingTop: 16,
          backgroundColor: "#ededed",
        }}
        data-testid="test-case-sidebar-collapsed-button"
        aria-label="Expand Test Case Sidebar"
        onClick={() => setIsCollapsed(false)}
      >
        <IconButton
          aria-label="Expand Test Case Sidebar"
          data-testid="test-case-sidebar-expand-icon"
        >
          <ExpansionIcon
            style={{
              color: "#0073C8",
            }}
            titleAccess="Expand Test Case Sidebar"
          />
        </IconButton>
      </button>
    );
  }

  return (
    <div className="outer-wrapper">
      <InnerWrapper
        className="vertical-side-nav"
        id="edit-measure-details-side-nav"
      >
        <nav
          data-testid="test-case-sidebar"
          aria-label="Test Case Sidebar Navigation"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              height: 48,
              padding: 16,
            }}
          >
            <IconButton
              onClick={() => setIsCollapsed(true)}
              aria-label="Collapse Test Case Sidebar"
              data-testid="test-case-sidebar-collapse-icon"
            >
              <ExpansionIcon
                style={{
                  color: "#0073C8",
                  transform: "rotate(180deg)",
                }}
                titleAccess="Collapse Test Case Sidebar"
              />
            </IconButton>
          </div>
          <button
            onClick={() => {
              setShowPopulationCriteriaTabs(!showPopulationCriteriaTabs);
            }}
            data-testid="test-case-pop-criteria-nav-collapser"
            className={"collapsable-button"}
          >
            Population Criteria
            <span className="tab-dropdown">
              {showPopulationCriteriaTabs ? (
                <ExpandLessIcon />
              ) : (
                <ExpandMoreIcon />
              )}
            </span>
          </button>
          {showPopulationCriteriaTabs && (
            <div className="indented-tabs">
              <Tabs
                type="C"
                size="standard"
                orientation="vertical"
                value={criteriaId}
                onChange={handleChange}
              >
                {allPopulationCriteria && allPopulationCriteria.length > 0 ? (
                  allPopulationCriteria.map((populationCriteria, idx) => {
                    return (
                      <Tab
                        label={`Population Criteria ${idx + 1}`}
                        key={populationCriteria.id}
                        data-testid={`pop-criteria-nav-link-${populationCriteria.id}`}
                        value={populationCriteria.id}
                        type="C"
                        orientation="vertical"
                      />
                    );
                  })
                ) : (
                  <Tab
                    label="No Population Criteria Exist"
                    disabled
                    type="C"
                    orientation="vertical"
                  />
                )}
              </Tabs>
            </div>
          )}
          <>
            <button
              onClick={() => {
                setShowConfigTabs(!showConfigTabs);
              }}
              data-testid="test-case-configuration-nav-collapser"
              className={"collapsable-button"}
            >
              Configuration
              <span className="tab-dropdown">
                {showConfigTabs ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </span>
            </button>
            {showConfigTabs && (
              <div className="indented-tabs">
                <Tabs
                  type="C"
                  size="standard"
                  orientation="vertical"
                  onChange={handleChange}
                  value={endRoute}
                >
                  <Tab
                    label="SDE"
                    value="sde"
                    data-testid="nav-link-sde"
                    type="C"
                    orientation="vertical"
                    onChange={handleChange}
                  />
                  <Tab
                    label="RAV"
                    value="rav"
                    data-testid="nav-link-rav"
                    type="C"
                    orientation="vertical"
                    onChange={handleChange}
                  />
                  <Tab
                    label="Expansion"
                    value="expansion"
                    data-testid="nav-link-expansion"
                    type="C"
                    orientation="vertical"
                    onChange={handleChange}
                  />
                  <Tab
                    label="Execution Options"
                    value="execution-options"
                    data-testid="nav-link-execution-options"
                    type="C"
                    orientation="vertical"
                    onChange={handleChange}
                  />

                  <Tab
                    label="Test Case Data"
                    value="test-case-data"
                    data-testid="test-case-data"
                    type="C"
                    orientation="vertical"
                    onChange={handleChange}
                  />
                </Tabs>
              </div>
            )}
          </>
        </nav>
      </InnerWrapper>
    </div>
  );
};

export default TestCaseListSideBarNav;
