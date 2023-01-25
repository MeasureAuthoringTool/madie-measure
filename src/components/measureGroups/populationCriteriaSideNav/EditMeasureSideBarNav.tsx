import React, { useState, useEffect } from "react";
import tw from "twin.macro";
import { Link as NavLink, useLocation, useHistory } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Measure } from "@madie/madie-models";
import useFeature from "../../../utils/useFeatureFlag";
import "../../editMeasure/measureDetails/EditMeasureSideBarNav.scss";
import "../../common/madie-link.scss";
import {
  DSLink,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;

export interface EditMeasureSideBarNavProps {
  canEdit?: Boolean;
  dirty: Boolean;
  links: Array<any>; // needs to be changed since some links are actually measure groups.
  details?: Boolean;
  measureGroupNumber?: number;
  setMeasureGroupNumber?: (value: number) => void;
  measure?: Measure;
  urlPath?: string;
}

export default function EditMeasureSideBarNav(
  props: EditMeasureSideBarNavProps
) {
  const {
    canEdit,
    links,
    measure,
    measureGroupNumber,
    setMeasureGroupNumber,
    dirty,
    urlPath,
  } = props;

  const { pathname } = useLocation();
  const [measureGroups, setMeasureGroups] = useState<any>();
  const [showTabs, setShowTabs] = useState<boolean>(false);
  const history = useHistory();
  const populationCriteriaTabs = useFeature("populationCriteriaTabs");

  const measureGroupSideNavTabs = [
    {
      title: "Population Criteria",
      groups: measureGroups,
      dataTestId: "leftPanelMeasurePopulationCriteriaTab",
      id: "sideNavMeasurePopulationCriteria",
    },
    {
      title: "Supplemental Data",
      href: `${urlPath}/supplemental-data`,
      dataTestId: "leftPanelMeasurePopulationsSupplementalDataTab",
      id: "sideNavMeasurePopulationsSupplementalData",
    },
    {
      title: "Risk Adjustment",
      href: `${urlPath}/risk-adjustment`,
      dataTestId: "leftPanelMeasurePopulationsRiskAdjustmentTab",
      id: "sideNavMeasurePopulationsRiskAdjustment",
    },
  ];

  useEffect(() => {
    if (links) setMeasureGroups(links);
    if (!measure?.groups?.length) {
      const baseURL = "/measures/" + measure?.id + "/edit/measure-groups";
      setMeasureGroups([
        {
          title: "Population Criteria 1",
          href: `${baseURL}`,
          dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
        },
      ]);
    }
  }, [measure?.groups]);
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
      history.push(`${urlPath}`);
      addNewBlankMeasureGroup();
      const element = document.getElementById("title");
      element.focus();
    }
  };

  const initiateNavigateGroupClick = (e) => {
    e.preventDefault();
    const groupNumber = Number(e.target.id);
    // We don't want to trigger a warning if we're navigating to the same group
    if (groupNumber !== measureGroupNumber) {
      if (dirty) {
        setInitiatedPayload({ action: "navigate", value: groupNumber });
        setDiscardDialogOpen(true);
      } else {
        handleMeasureGroupNavigation(groupNumber);
        history.push(`${urlPath}`);
      }
    } else {
      history.push(`${urlPath}`);
    }
  };

  const addNewBlankMeasureGroup = () => {
    setMeasureGroupNumber(measureGroups.length);
    setMeasureGroups([
      ...measureGroups,
      {
        title: `Population Criteria ${measureGroups.length + 1}`,
        href: "/measures/" + measure.id + "/edit/measure-groups",
        dataTestId: `leftPanelMeasureInformation-MeasureGroup${
          measureGroups.length + 1
        }`,
      },
    ]);
    onClose();
  };

  // we need to preserve the
  const handleMeasureGroupNavigation = (val: number) => {
    setMeasureGroupNumber(val);
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

  const handleTabClick = (tabInfo) => {
    if (tabInfo.groups) {
      setShowTabs(!showTabs);
      history.push(`${urlPath}`);
    } else {
      history.push(tabInfo.href);
    }
  };

  return (
    <OuterWrapper>
      <Nav aria-label="Sidebar">
        {measureGroups &&
          measureGroupSideNavTabs?.map((tabRecord) => (
            <>
              {populationCriteriaTabs && (
                <div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleTabClick(tabRecord);
                    }}
                    data-testId={tabRecord.dataTestId}
                    className="tab-title"
                    id={tabRecord.title}
                  >
                    {tabRecord.title}{" "}
                    <span className="tab-dropdown">
                      {tabRecord.groups &&
                        (showTabs ? <ExpandMoreIcon /> : <ExpandLessIcon />)}
                    </span>
                  </button>
                </div>
              )}
              {tabRecord.groups && (showTabs || !populationCriteriaTabs) && (
                <>
                  {tabRecord?.groups?.map((linkInfo, index) => {
                    const isActive =
                      pathname.replace("groups", "measure-groups") ===
                        linkInfo.href && index === measureGroupNumber;
                    const className = isActive ? "nav-link active" : "nav-link";
                    return (
                      <NavLink
                        key={linkInfo.title}
                        onClick={(e) => initiateNavigateGroupClick(e)}
                        to={linkInfo.href}
                        className={className}
                        id={index}
                        data-testid={linkInfo.dataTestId}
                      >
                        <>{linkInfo.title}</>
                      </NavLink>
                    );
                  })}
                  {
                    <div>
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
                    </div>
                  }
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
