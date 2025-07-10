import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Group } from "@madie/madie-models";
import tw from "twin.macro";
import { Tabs, Tab } from "@madie/madie-design-system";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import "../../../../../../styles/VerticalSideBarNav.scss";
import { useFeatureFlags } from "@madie/madie-util";

const InnerWrapper = tw.div`flex flex-grow flex-col`;

export interface TestCaseListSideBarNavProps {
  allPopulationCriteria: Group[];
  qdm?: Boolean;
}

const TestCaseListSideBarNav = ({
  allPopulationCriteria,
  qdm,
}: TestCaseListSideBarNavProps) => {
  let navigate = useNavigate();
  const { measureId, criteriaId } = useParams<{
    measureId: string;
    criteriaId: string;
  }>();

  let location = useLocation();
  const { pathname } = location;
  const featureFlags = useFeatureFlags();

  const [showConfigTabs, setShowConfigTabs] = useState<boolean>(true);
  const [showPopulationCriteriaTabs, setShowPopulationCriteriaTabs] =
    useState<boolean>(true);
  const handleChange = (e, v) => {
    const newPath = `/measures/${measureId}/edit/test-cases/list-page/${v}`;
    navigate(newPath);
  };
  const endRoute = /[^/]*$/.exec(pathname)[0];
  return (
    <div className="outer-wrapper">
      <InnerWrapper
        className="vertical-side-nav"
        id="edit-measure-details-side-nav"
      >
        <nav data-testid="test-case-pop-criteria-nav" aria-label="Sidebar">
          <>
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
          </>
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
                  {((featureFlags?.QDMIncludeRAVValues && qdm) ||
                    (featureFlags?.QICoreIncludeRAVValues && !qdm)) && (
                    <Tab
                      label="RAV"
                      value="rav"
                      data-testid="nav-link-rav"
                      type="C"
                      orientation="vertical"
                      onChange={handleChange}
                    />
                  )}
                  <Tab
                    label="Expansion"
                    value="expansion"
                    data-testid="nav-link-expansion"
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
