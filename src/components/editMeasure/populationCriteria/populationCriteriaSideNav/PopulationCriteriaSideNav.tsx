import React, { useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { useLocation, useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import "../../details/EditMeasureSideBarNav.scss";
import "../../../common/madie-link.scss";
import { DSLink, Tabs, Tab } from "@madie/madie-design-system/dist/react";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const InnerWrapper = tw.div`flex-grow flex flex-col`;
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
    isQDM,
  } = props;
  const { pathname } = useLocation();
  const [showPopulationCriteriaTabs, setShowPopulationCriteriaTabs] =
    useState<boolean>(true);
  let navigate = useNavigate();
  const groupsBaseUrl = "/measures/" + measureId + "/edit/popc/groups";
  const QdmReportingBaseUrl = "/measures/" + measureId + "/edit/reporting";

  const initiateBlankMeasureGroupClick = (e) => {
    e.preventDefault();
    addNewBlankMeasureGroup();
  };

  const handleMeasureGroupNavigation = (val: number) => {
    navigate(groupsBaseUrl + "/" + (val + 1));
  };

  const initiateNavigateGroupClick = (e) => {
    e.preventDefault();
    const groupNumber = Number(e.target.id);
    if (groupNumber !== measureGroupNumber) {
      navigate(groupsBaseUrl + "/" + (groupNumber + 1));
    } else {
      handleMeasureGroupNavigation(groupNumber);
      navigate(groupsBaseUrl + "/" + (groupNumber + 1));
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
    navigate(groupsBaseUrl + "/" + newMeasureGroupNumber);
  };

  const handlePopulationCriteriaCollapse = (tabInfo) => {
    if (tabInfo.title === "Population Criteria") {
      setShowPopulationCriteriaTabs(!showPopulationCriteriaTabs);
    } else {
      navigate(tabInfo.href);
    }
  };

  const baseConfigurationUrl =
    "/measures/" + measureId + "/edit/popc/base-configuration";
  const supplementalDataBaseUrl =
    "/measures/" + measureId + "/edit/popc/supplemental-data";
  const riskAdjustmentBaseUrl =
    "/measures/" + measureId + "/edit/popc/risk-adjustment";
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

  return (
    <OuterWrapper>
      <InnerWrapper className="edit-measure-side-nav">
        <Nav aria-label="Sidebar">
          {isQDM && (
            <Tabs
              type="C"
              orientation="vertical"
              value={pathname}
              onChange={(e, v) => {
                navigate(v);
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
                <button
                  onClick={() => {
                    handlePopulationCriteriaCollapse(tab);
                  }}
                  data-testId={tab.dataTestId}
                  className={
                    pathname === tab.href
                      ? "collapsable-button active"
                      : "collapsable-button"
                  }
                  id={tab.title}
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
                {tab.title === "Population Criteria" &&
                  showPopulationCriteriaTabs && (
                    <div className="indented-tabs">
                      <Tabs
                        type="C"
                        size="standard"
                        orientation="vertical"
                        value={
                          pathname.includes("/groups")
                            ? measureGroupNumber
                            : null
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
                        <div className="link-wrapper">
                          <DSLink
                            className="madie-link"
                            style={{ color: "#125496" }}
                            onClick={(e) => initiateBlankMeasureGroupClick(e)}
                            data-testid="add-measure-group-button"
                          >
                            <AddIcon className="add-icon" fontSize="small" />{" "}
                            Add Population Criteria
                          </DSLink>
                        </div>
                      )}
                    </div>
                  )}
              </>
            ))}

          <Tabs
            type="C"
            orientation="vertical"
            value={pathname}
            onChange={(e, v) => {
              navigate(v);
            }}
          >
            {isQDM && (
              <Tab
                type="C"
                label="Reporting"
                value={QdmReportingBaseUrl}
                dataTestId="leftPanelMeasureReportingTab"
                id="sideNavMeasureReporting"
              />
            )}
            {additionalLinks.map((l) => {
              return <Tab {...l} type="B" />;
            })}
          </Tabs>
        </Nav>
      </InnerWrapper>
    </OuterWrapper>
  );
}
