import React from "react";
import tw from "twin.macro";
import { NavLink, useLocation } from "react-router-dom";

const OuterWrapper = tw.div`flex flex-col flex-grow border-r border-gray-200 pt-5 pb-4 bg-white overflow-y-auto`;
const Title = tw.div`flex items-center flex-shrink-0 px-4 space-y-5 font-display`;
const InnerWrapper = tw.div`mt-5 flex-grow flex flex-col`;
const Nav = tw.nav`flex-1 bg-white space-y-1`;
const StyledNavLink = tw(
  NavLink
)`flex items-center px-3 py-2 text-sm font-medium border-l-4`;
const ActiveNavLink = tw(StyledNavLink)`
    bg-primary-50
    border-primary-600
    text-primary-600`;
const InactiveNavLink = tw(StyledNavLink)`
    border-transparent
    text-gray-600
    hover:bg-gray-50
    hover:text-gray-900`;

interface SidebarLink {
  title: string;
  href: string;
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
                <LinkEl key={linkInfo.title} to={linkInfo.href}>
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
