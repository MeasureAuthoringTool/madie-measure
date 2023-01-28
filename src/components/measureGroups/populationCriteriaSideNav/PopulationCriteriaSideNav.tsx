import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { Link as NavLink, useHistory, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import useFeature from "../../../utils/useFeatureFlag";
import "../../editMeasure/measureDetails/EditMeasureSideBarNav.scss";
import "../../common/madie-link.scss";
import { DSLink } from "@madie/madie-design-system/dist/react";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;

export interface PopulationCriteriaSideNavProp {
  canEdit?: Boolean;
  dirty?: Boolean;
  sideNavLinks: Array<any>;
  setSideNavLinks: (value: Array<any>) => void;
  measureGroupNumber?: number;
  setMeasureGroupNumber?: (value: number) => void;
  measureId: string;
}

// todo discard button is refreshing the page also its not stopping from navigation
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
  } = props;

  const dirty = false;
  const { pathname } = useLocation();
  const [showPopulationCriteriaTabs, setShowPopulationCriteriaTabs] =
    useState<boolean>(false);
  const history = useHistory();
  const populationCriteriaTabsFeatureFlag = useFeature(
    "populationCriteriaTabs"
  );
  const groupsBaseUrl = "/measures/" + measureId + "/edit/groups";

  // If no groups are available, then create link information for new group
  // side nav links has to be update with new group
  // useEffect(() => {
  //   if (sideNavLinks) {
  //     if (!sideNavLinks[0]?.groups) {
  //       sideNavLinks[0].groups = [
  //         {
  //           title: "Population Criteria 1",
  //           href: `${groupsBaseUrl}`,
  //           dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
  //         },
  //       ];
  //       setSideNavLinks([...sideNavLinks]);
  //     }
  //   }
  // }, [groupsBaseUrl, setSideNavLinks, sideNavLinks]);
  // a bool for when discard is open triggered by an initiated state
  const [discardDialogOpen, setDiscardDialogOpen] = useState<boolean>(false);
  // action payload? like a redux operation
  const [initiatedPayload, setInitiatedPayload] = useState<any>(null);

  const initiateBlankMeasureGroupClick = (e) => {
    e.preventDefault();
    if (dirty) {
      setInitiatedPayload({ action: "add", value: null });
      setDiscardDialogOpen(true);
    } else {
      history.push(groupsBaseUrl);
      addNewBlankMeasureGroup();
      const element = document.getElementById("title");
      element.focus();
    }
  };

  // const initiateNavigateGroupClick = (e) => {
  //   e.preventDefault();
  //   const groupNumber = Number(e.target.id);
  //   // We don't want to trigger a warning if we're navigating to the same group
  //   if (groupNumber !== measureGroupNumber) {
  //     if (dirty) {
  //       setInitiatedPayload({ action: "navigate", value: groupNumber });
  //       setDiscardDialogOpen(true);
  //     } else {
  //       handleMeasureGroupNavigation(groupNumber);
  //       history.push(`/measures/${measure.id}/edit/groups`);
  //     }
  //   } else {
  //     // this navigates to the same group
  //     history.push(`${urlPath}`);
  //   }
  // };

  const initiateNavigateGroupClick = (e) => {
    e.preventDefault();
    const groupNumber = Number(e.target.id);
    setMeasureGroupNumber(groupNumber);
    history.push(groupsBaseUrl);
  };

  const addNewBlankMeasureGroup = () => {
    const newMeasureGroupNumber = sideNavLinks[0].groups.length + 1;
    setMeasureGroupNumber(sideNavLinks[0].groups.length);
    const newMeasureGroupLink = {
      title: `Criteria ${newMeasureGroupNumber}`,
      href: groupsBaseUrl,
      dataTestId: `leftPanelMeasureInformation-MeasureGroup${newMeasureGroupNumber}`,
    };
    sideNavLinks[0].groups = [...sideNavLinks[0].groups, newMeasureGroupLink];
    setSideNavLinks([...sideNavLinks]);
  };

  // we need to preserve the
  // const handleMeasureGroupNavigation = (val: number) => {
  //   setMeasureGroupNumber(val);
  //   onClose();
  // };

  // we need to pass a bound function to discard.
  // const onContinue = () => {
  //   if (initiatedPayload.action === "add") {
  //     addNewBlankMeasureGroup();
  //   } else if (initiatedPayload.action === "navigate") {
  //     handleMeasureGroupNavigation(initiatedPayload.value);
  //   }
  // };

  // const onClose = () => {
  //   setDiscardDialogOpen(false);
  //   setInitiatedPayload(null);
  // };

  const handlePopulationCriteriaCollapse = (tabInfo) => {
    if (tabInfo.title === "Population Criteria") {
      setShowPopulationCriteriaTabs(!showPopulationCriteriaTabs);
    } else {
      history.push(tabInfo.href);
    }
  };

  return (
    <OuterWrapper>
      <Nav aria-label="Sidebar">
        {sideNavLinks &&
          sideNavLinks?.map((tab) => (
            <>
              {populationCriteriaTabsFeatureFlag && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
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
                    {tab?.groups?.map((linkInfo, index) => {
                      const isActive =
                        pathname === linkInfo.href &&
                        index === measureGroupNumber;
                      const className = isActive
                        ? "nav-link active"
                        : "nav-link";
                      return (
                        <NavLink
                          key={linkInfo.title}
                          onClick={(e) => initiateNavigateGroupClick(e)}
                          to={linkInfo.href}
                          className={className}
                          id={index}
                          data-testid={linkInfo.dataTestId}
                        >
                          {linkInfo.title}
                        </NavLink>
                      );
                    })}
                    {canEdit && (
                      <DSLink
                        className="madie-link"
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
      </Nav>
    </OuterWrapper>
  );
}
