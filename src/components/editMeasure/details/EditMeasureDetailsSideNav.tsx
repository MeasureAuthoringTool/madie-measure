import React from "react";
import tw from "twin.macro";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";
import "../../../styles/VerticalSideBarNav.scss";
import { Link } from "./MeasureDetails";
import CompletionIndicator from "../populationCriteria/groups/CompletionIndicator";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const InnerWrapper = tw.div`flex-grow flex flex-col`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;

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
    <OuterWrapper>
      <InnerWrapper
        className="vertical-side-nav"
        id="edit-measure-details-side-nav"
      >
        <Nav aria-label="Sidebar">
          {links.map((link) => (
            <div className="link-container">
              <h4 className="link-heading">{link.title}</h4>
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
        </Nav>
      </InnerWrapper>
    </OuterWrapper>
  );
}
