import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";
import "../../../styles/VerticalSideBarNav.scss";
import { Link } from "./MeasureDetails";
import CompletionIndicator from "../populationCriteria/groups/CompletionIndicator";
import tw from "twin.macro";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const InnerWrapper = tw.div`flex flex-grow flex-col`;
export interface EditMeasureDetailsSideNavProps {
  links: Array<Link>;
}

export default function EditMeasureDetailsSideNav(
  props: EditMeasureDetailsSideNavProps
) {
  const { links } = props;
  const { pathname } = useLocation();
  const endRoute = /[^/]*$/.exec(pathname)[0];
  const { measureId } = useParams<{
    measureId: string;
  }>();
  let navigate = useNavigate();
  const handleChange = (e, v) => {
    const newPath = `/measures/${measureId}/edit/details/${v}`;
    navigate(newPath);
  };

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >(() =>
    links.reduce((acc, link) => {
      acc[link.title] = true;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  function getTabLabel(linkInfo) {
    if (linkInfo.displayCompletedIcon) {
      return (
        <CompletionIndicator
          data-testid={`measure-details-completed-icon-${linkInfo.id}`}
          label={`${linkInfo.title}`}
          hasErrors={false}
          displayIcon={true}
        />
      );
    }

    if (linkInfo.displayIncompletedIcon) {
      return (
        <CompletionIndicator
          data-testid={`measure-details-incompleted-icon-${linkInfo.id}`}
          label={`${linkInfo.title}`}
          hasErrors={true}
          displayIcon={true}
        />
      );
    }

    return (
      <CompletionIndicator
        label={`${linkInfo.title}`}
        hasErrors={false}
        displayIcon={false}
      />
    );
  }

  return (
    <div className="outer-wrapper">
      <InnerWrapper
        className="vertical-side-nav"
        id="edit-measure-details-side-nav"
      >
        <nav
          aria-label="Measure Details Sidebar Navigation"
          data-testid="measure-details-sidebar"
        >
          {links.map((link) => {
            const sectionId = link.title.toLowerCase().replace(/\s+/g, "-");
            const isExpanded = expandedSections[link.title];
            return (
              <div className="link-container" key={link.title}>
                <button
                  type="button"
                  className="collapsable-button"
                  onClick={() => toggleSection(link.title)}
                  aria-expanded={isExpanded}
                  aria-controls={`${sectionId}-tabs`}
                  data-testid={`measure-details-${sectionId}-toggle`}
                >
                  <span>{link.title}</span>
                  <span className="tab-dropdown">
                    {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </span>
                </button>
                {isExpanded && (
                  <Tabs
                    id={`${sectionId}-tabs`}
                    type="C"
                    size="standard"
                    orientation="vertical"
                    value={endRoute}
                    onChange={handleChange}
                  >
                    {link.links.map((linkInfo) => {
                      return (
                        <Tab
                          key={linkInfo.id}
                          label={getTabLabel(linkInfo)}
                          type="C"
                          value={linkInfo.href}
                          id={linkInfo.id}
                          data-testid={linkInfo.dataTestId}
                        />
                      );
                    })}
                  </Tabs>
                )}
              </div>
            );
          })}
        </nav>
      </InnerWrapper>
    </div>
  );
}
