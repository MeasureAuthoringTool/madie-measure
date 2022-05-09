import React from "react";
import tw from "twin.macro";
import { NavLink, useLocation } from "react-router-dom";

const OuterWrapper = tw.div`flex flex-col flex-grow py-6 bg-slate overflow-y-auto border-r border-slate`;
const Title = tw.div`flex items-center flex-shrink-0 px-4 space-y-5 font-display`;
const InnerWrapper = tw.div`mt-5 flex-grow flex flex-col`;
const Nav = tw.nav`flex-1 space-y-1 bg-slate`;
const StyledNavLink = tw(
  NavLink
)`flex items-center px-3 py-2 text-sm text-slate-80 border-l-8 no-underline hover:text-slate-90 hover:font-medium`;
const ActiveNavLink = tw(StyledNavLink)`
    bg-white
    font-medium
    border-teal-650
    text-slate-90`;
const InactiveNavLink = tw(StyledNavLink)` border-transparent`;

interface SidebarLink {
  title: string;
  href: string;
  dataTestId: string;
}

export interface MeasureDetailsSidebarProps {
  links: Array<SidebarLink>;
  header?: String;
}

export default function MeasureDetailsSidebar(
  props: MeasureDetailsSidebarProps
) {
  const { links, header = "" } = props;
  const { pathname } = useLocation();

  // if no header, we don't need an outer wrapper
  if (header) {
    return (
      <OuterWrapper>
        {header && <Title>{header}</Title>}
        <InnerWrapper>
          <Nav aria-label="Sidebar">
            {links.map((linkInfo) => {
              let LinkEl = InactiveNavLink;
              if (pathname === linkInfo.href) {
                LinkEl = ActiveNavLink;
              }
              return (
                <LinkEl
                  key={linkInfo.title}
                  to={linkInfo.href}
                  data-testid={linkInfo.dataTestId}
                >
                  {linkInfo.title}
                </LinkEl>
              );
            })}
          </Nav>
        </InnerWrapper>
      </OuterWrapper>
    );
  }
  return (
    <OuterWrapper>
      <Nav aria-label="Sidebar">
        {links.map((linkInfo) => {
          let LinkEl = InactiveNavLink;
          if (pathname === linkInfo.href) {
            LinkEl = ActiveNavLink;
          }
          return (
            <LinkEl key={linkInfo.title} to={linkInfo.href}>
              {linkInfo.title}
            </LinkEl>
          );
        })}
      </Nav>
    </OuterWrapper>
  );
}
