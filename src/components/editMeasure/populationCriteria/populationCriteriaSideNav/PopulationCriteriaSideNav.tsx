import React, { useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { Link as NavLink, useHistory, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import "../../details/EditMeasureSideBarNav.scss";
import "../../../common/madie-link.scss";
import {
  DSLink,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import { useFeatureFlags } from "@madie/madie-util";
import { forEach } from "lodash";

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
  } = props;

  const { pathname } = useLocation();
  const [showPopulationCriteriaTabs, setShowPopulationCriteriaTabs] =
    useState<boolean>(true);
  const history = useHistory();
  const featureFlags = useFeatureFlags();
  const populationCriteriaTabsFeatureFlag =
    !!featureFlags?.populationCriteriaTabs;
  const groupsBaseUrl = "/measures/" + measureId + "/edit/groups";
  // a bool for when discard is open triggered by an initiated state
  const [discardDialogOpen, setDiscardDialogOpen] = useState<boolean>(false);
  // action payload? like a redux operation
  const [initiatedPayload, setInitiatedPayload] = useState<any>(null);

  const initiateBlankMeasureGroupClick = (e) => {
    e.preventDefault();
    if (isFormDirty) {
      setInitiatedPayload({ action: "add", value: null });
      setDiscardDialogOpen(true);
    } else {
      history.push(groupsBaseUrl);
      addNewBlankMeasureGroup();
    }
  };

  const initiateNavigateGroupClick = (e) => {
    e.preventDefault();
    const groupNumber = Number(e.target.id);
    if (groupNumber !== measureGroupNumber) {
      if (isFormDirty) {
        setInitiatedPayload({ action: "navigate", value: groupNumber });
        setDiscardDialogOpen(true);
      } else {
        handleMeasureGroupNavigation(groupNumber);
      }
    } else {
      handleMeasureGroupNavigation(groupNumber);
    }
  };

  const addNewBlankMeasureGroup = () => {
    var measureGroups = sideNavLinks.find((link) => link.groups);
    const index = sideNavLinks.indexOf(measureGroups);
    const newMeasureGroupNumber = measureGroups.groups.length + 1;
    setMeasureGroupNumber(measureGroups.groups.length);
    const newMeasureGroupLink = {
      title: `Criteria ${newMeasureGroupNumber}`,
      href: groupsBaseUrl,
      dataTestId: `leftPanelMeasureInformation-MeasureGroup${newMeasureGroupNumber}`,
    };
    sideNavLinks[index].groups = [
      ...sideNavLinks[index].groups,
      newMeasureGroupLink,
    ];
    setSideNavLinks([...sideNavLinks]);
    onClose();
  };

  // we need to preserve the
  const handleMeasureGroupNavigation = (val: number) => {
    setMeasureGroupNumber(val);
    history.push(groupsBaseUrl);
    onClose();
  };

  // we need to pass a bound function to discard.
  const onContinue = () => {
    if (initiatedPayload.action === "add") {
      addNewBlankMeasureGroup();
    } else if (initiatedPayload.action === "navigate") {
      handleMeasureGroupNavigation(initiatedPayload.value);
    }
  };

  const onClose = () => {
    setDiscardDialogOpen(false);
    setInitiatedPayload(null);
  };

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
      <MadieDiscardDialog
        open={discardDialogOpen}
        onClose={onClose}
        onContinue={onContinue}
      />
    </OuterWrapper>
  );
}
