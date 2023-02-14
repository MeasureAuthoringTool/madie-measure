import React from "react";
import tw from "twin.macro";
import { Link as NavLink, useLocation } from "react-router-dom";
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

  return (
    <OuterWrapper>
      <InnerWrapper>
        <Nav aria-label="Sidebar">
          {links.map((link) => (
            <div className="link-container">
              <h4 className="link-heading">{link.title}</h4>
              {link.links.map((linkInfo) => {
                const isActive = pathname === linkInfo.href;
                const className = isActive ? "nav-link active" : "nav-link";
                return (
                  <NavLink
                    key={linkInfo.title}
                    onClick={(e) => {
                      if (isActive) {
                        e.preventDefault();
                      }
                    }}
                    to={linkInfo.href}
                    data-testid={linkInfo.dataTestId}
                    className={className}
                    id={linkInfo.id}
                  >
                    {linkInfo.title}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </Nav>
      </InnerWrapper>
    </OuterWrapper>
  );
}
