import React from "react";
import tw from "twin.macro";
import { useLocation, useHistory } from "react-router-dom";
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
  const history = useHistory();

  const handleChange = (e, v) => {
    history.push(v);
  };
  return (
    <OuterWrapper>
      <InnerWrapper>
        <Nav aria-label="Sidebar">
          {links.map((link) => (
            <div className="link-container">
              <h4 className="link-heading">{link.title}</h4>
              <Tabs
                type="C"
                orientation="vertical"
                value={pathname}
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
