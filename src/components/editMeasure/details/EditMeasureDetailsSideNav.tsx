import React from "react";
import tw from "twin.macro";

import {
  useLocation,
  useNavigate,
  useParams,
  useMatch,
} from "react-router-dom";
import { Tab, Tabs } from "@madie/madie-design-system/dist/react";
import "./EditMeasureSideBarNav.scss";
import "../../common/madie-link.scss";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const InnerWrapper = tw.div`flex-grow flex flex-col`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;

export interface EditMeasureDetailsSideNavProps {
  links: Array<any>;
}

export default function EditMeasureDetailsSideNav(
  props: EditMeasureDetailsSideNavProps
) {
  const { links } = props;
  const { pathname } = useLocation();
  const endRoute = /[^/]*$/.exec(pathname)[0];
  const { id } = useParams<{
    id: string;
  }>();
  let navigate = useNavigate();
  const handleChange = (e, v) => {
    const newPath = `/measures/${id}/edit/details/${v}`;
    navigate(newPath, { replace: true });
  };
  return (
    <OuterWrapper>
      <InnerWrapper id="edit-measure-details-side-nav">
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
                      label={linkInfo.title}
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
