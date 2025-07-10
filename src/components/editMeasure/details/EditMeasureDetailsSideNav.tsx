import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Tab, Tabs } from "@madie/madie-design-system";
import "../../../styles/VerticalSideBarNav.scss";
import { Link } from "./MeasureDetails";
import CompletionIndicator from "../populationCriteria/groups/CompletionIndicator";
import tw from "twin.macro";

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
        <nav aria-label="Sidebar">
          {links.map((link) => (
            <div className="link-container">
              <span className="link-heading">{link.title}</span>
              <Tabs
                type="C"
                orientation="vertical"
                value={endRoute}
                onChange={handleChange}
              >
                {link.links.map((linkInfo) => {
                  return (
                    <Tab
                      label={getTabLabel(linkInfo)}
                      type="C"
                      value={linkInfo.href}
                      id={linkInfo.id}
                      data-testid={linkInfo.dataTestId}
                    />
                  );
                })}
              </Tabs>
            </div>
          ))}
        </nav>
      </InnerWrapper>
    </div>
  );
}
