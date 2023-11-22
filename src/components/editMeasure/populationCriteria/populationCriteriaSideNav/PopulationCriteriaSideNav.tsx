import React, { useState } from "react";
import tw, { styled } from "twin.macro";
import "styled-components/macro";
import { useHistory, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import "../../details/EditMeasureSideBarNav.scss";
import "../../../common/madie-link.scss";
import { DSLink, Tabs, Tab } from "@madie/madie-design-system/dist/react";
import { useFeatureFlags } from "@madie/madie-util";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;

export interface PopulationCriteriaSideNavProp {
  canEdit?: Boolean;
  sideNavLinks: Array<any>;
  setSideNavLinks: (value: Array<any>) => void;
  measureGroupNumber?: number;
  setMeasureGroupNumber?: (value: number) => void;
  measureId: string;
  isFormDirty: boolean;
  isQDM: boolean;
}

export default function PopulationCriteriaSideNav(
  props: PopulationCriteriaSideNavProp
) {
  const {
    canEdit,
    sideNavLinks,
    setSideNavLinks,
    measureId,
    measureGroupNumber,
    setMeasureGroupNumber,
    isFormDirty = false,
    isQDM,
  } = props;
  const { pathname } = useLocation();
  const [showPopulationCriteriaTabs, setShowPopulationCriteriaTabs] =
    useState<boolean>(true);
  const history = useHistory();
  const featureFlags = useFeatureFlags();
  const populationCriteriaTabsFeatureFlag =
    !!featureFlags?.populationCriteriaTabs;
  const groupsBaseUrl = "/measures/" + measureId + "/edit/groups";
  const QdmReportingBaseUrl = "/measures/" + measureId + "/edit/reporting";

  const initiateBlankMeasureGroupClick = (e) => {
    e.preventDefault();
    addNewBlankMeasureGroup();
  };

  const handleMeasureGroupNavigation = (val: number) => {
    history.push(groupsBaseUrl + "/" + (val + 1));
  };

  const initiateNavigateGroupClick = (e) => {
    e.preventDefault();
    const groupNumber = Number(e.target.id);
    if (groupNumber !== measureGroupNumber) {
      history.push(groupsBaseUrl + "/" + (groupNumber + 1));
    } else {
      handleMeasureGroupNavigation(groupNumber);
      history.push(groupsBaseUrl + "/" + (groupNumber + 1));
    }
  };

  const addNewBlankMeasureGroup = () => {
    var measureGroups = sideNavLinks.find((link) => link.groups);
    const index = sideNavLinks.indexOf(measureGroups);
    const newMeasureGroupNumber = measureGroups.groups.length + 1;
    const newMeasureGroupLink = {
      title: `Criteria ${newMeasureGroupNumber}`,
      href: groupsBaseUrl + "/" + newMeasureGroupNumber,
      dataTestId: `leftPanelMeasureInformation-MeasureGroup${newMeasureGroupNumber}`,
    };
    sideNavLinks[index].groups = [
      ...sideNavLinks[index].groups,
      newMeasureGroupLink,
    ];
    setSideNavLinks([...sideNavLinks]);
    history.push(groupsBaseUrl + "/" + newMeasureGroupNumber);
  };

  const handlePopulationCriteriaCollapse = (tabInfo) => {
    if (tabInfo.title === "Population Criteria") {
      setShowPopulationCriteriaTabs(!showPopulationCriteriaTabs);
    } else {
      history.push(tabInfo.href);
    }
  };

  const baseConfigurationUrl =
    "/measures/" + measureId + "/edit/base-configuration";
  const supplementalDataBaseUrl =
    "/measures/" + measureId + "/edit/supplemental-data";
  const riskAdjustmentBaseUrl =
    "/measures/" + measureId + "/edit/risk-adjustment";
  const additionalLinks = [
    {
      label: "Supplemental Data",
      value: supplementalDataBaseUrl,
      dataTestId: "leftPanelMeasurePopulationsSupplementalDataTab",
      id: "sideNavMeasurePopulationsSupplementalData",
    },
    {
      label: "Risk Adjustment",
      value: riskAdjustmentBaseUrl,
      dataTestId: "leftPanelMeasurePopulationsRiskAdjustmentTab",
      id: "sideNavMeasurePopulationsRiskAdjustment",
    },
  ];

  // for tracking active secondary link

  return (
    <OuterWrapper>
      <Nav aria-label="Sidebar">
        {isQDM && (
          <Tabs
            type="C"
            orientation="vertical"
            value={pathname}
            onChange={(e, v) => {
              history.push(v);
            }}
          >
            <Tab
              type="C"
              label="Base Configuration"
              value={baseConfigurationUrl}
              data-testId="leftPanelMeasureBaseConfigurationTab"
              id="sideNavMeasureBaseConfiguration"
            />
          </Tabs>
        )}
        {sideNavLinks &&
          sideNavLinks?.map((tab) => (
            <>
              {populationCriteriaTabsFeatureFlag && (
                <button
                  onClick={() => {
                    handlePopulationCriteriaCollapse(tab);
                  }}
                  data-testId={tab.dataTestId}
                  className={
                    pathname === tab.href ? "tab-title active" : "tab-title "
                  }
                  id={tab.title}
                  tw="px-2"
                >
                  {tab.title}
                  <span className="tab-dropdown">
                    {tab.title === "Population Criteria" &&
                      (showPopulationCriteriaTabs ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      ))}
                  </span>
                </button>
              )}
              {tab.title === "Population Criteria" &&
                (showPopulationCriteriaTabs ||
                  !populationCriteriaTabsFeatureFlag) && (
                  <>
                    <Tabs
                      type="C"
                      size="standard"
                      orientation="vertical"
                      value={
                        pathname.includes("/groups") ? measureGroupNumber : null
                      }
                    >
                      {tab?.groups?.map((linkInfo, index) => {
                        return (
                          <Tab
                            value={index}
                            key={linkInfo.title}
                            onClick={(e) => initiateNavigateGroupClick(e)}
                            type="C"
                            orientation="vertical"
                            id={index}
                            label={linkInfo.title}
                            data-testid={linkInfo.dataTestId}
                          />
                        );
                      })}
                    </Tabs>
                    {canEdit && (
                      <DSLink
                        className="madie-link"
                        style={{ color: "#125496" }}
                        onClick={(e) => initiateBlankMeasureGroupClick(e)}
                        data-testid="add-measure-group-button"
                      >
                        <AddIcon className="add-icon" fontSize="small" /> Add
                        Population Criteria
                      </DSLink>
                    )}
                  </>
                )}
            </>
          ))}
        {isQDM && (
          <Tabs
            type="C"
            orientation="vertical"
            value={pathname}
            onChange={(e, v) => {
              history.push(v);
            }}
          >
            <Tab
              type="C"
              label="Reporting"
              value={QdmReportingBaseUrl}
              dataTestId="leftPanelMeasureReportingTab"
              id="sideNavMeasureReporting"
            />
          </Tabs>
        )}
        {populationCriteriaTabsFeatureFlag && (
          <Tabs
            type="C"
            orientation="vertical"
            value={pathname}
            onChange={(e, v) => {
              history.push(v);
            }}
          >
            {additionalLinks.map((l) => {
              return <Tab {...l} type="B" />;
            })}
          </Tabs>
        )}
      </Nav>
    </OuterWrapper>
  );
}
