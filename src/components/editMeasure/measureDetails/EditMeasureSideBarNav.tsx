import React, { useState, useEffect } from "react";
import tw from "twin.macro";
import { NavLink, useLocation } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import { Measure } from "@madie/madie-models";
import "./EditMeasureSideBarNav.scss";
import { DSLink } from "@madie/madie-design-system/dist/react";

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

export interface EditMeasureSideBarNavProps {
  links: Array<SidebarLink>;
  header?: String;
  measureGroupNumber?: number;
  setMeasureGroupNumber?: (value: number) => void;
  setSuccessMessage?: (value: string) => void;
  measure?: Measure;
}

export default function EditMeasureSideBarNav(
  props: EditMeasureSideBarNavProps
) {
  const {
    links,
    header = "",
    measure,
    measureGroupNumber,
    setMeasureGroupNumber,
    setSuccessMessage,
  } = props;
  const { pathname } = useLocation();
  const [measureGroups, setMeasureGroups] = useState<any>();

  useEffect(() => {
    if (links) setMeasureGroups(links);

    if (!measure?.groups?.length) {
      const baseURL = "/measures/" + measure?.id + "/edit/measure-groups";
      setMeasureGroups([
        {
          title: "MEASURE GROUP 1",
          href: `${baseURL}`,
          dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
        },
      ]);
    }
  }, [measure?.groups]);

  const addNewBlankMeasureGroup = (e) => {
    e.preventDefault();
    setMeasureGroupNumber(measureGroups.length);
    setMeasureGroups([
      ...measureGroups,
      {
        title: `MEASURE GROUP ${measureGroups.length + 1}`,
        href: "/measures/" + measure.id + "/edit/measure-groups",
        dataTestId: `leftPanelMeasureInformation-MeasureGroup${
          measureGroups.length + 1
        }`,
      },
    ]);
    setSuccessMessage(undefined);
  };

  const handleMeasureGroupClick = (e) => {
    e.preventDefault();
    setMeasureGroupNumber(parseInt(e.target.id));
    setSuccessMessage(undefined);
  };

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
        {measureGroups &&
          measureGroups.map((linkInfo, index) => {
            let LinkEl = InactiveNavLink;
            if (
              pathname.replace("groups", "measure-groups") === linkInfo.href &&
              index === measureGroupNumber
            ) {
              LinkEl = ActiveNavLink;
            }
            return (
              <LinkEl
                key={linkInfo.title}
                onClick={(e) => handleMeasureGroupClick(e)}
                to={linkInfo.href}
                id={index}
                data-testid={linkInfo.dataTestId}
              >
                <>{linkInfo.title}</>
              </LinkEl>
            );
          })}
        <div className="right-col">
          <DSLink
            className="new-measure-group"
            onClick={(e) => addNewBlankMeasureGroup(e)}
            data-testid="add-measure-group-button"
          >
            <AddIcon className="add-icon" fontSize="small" />
            &nbsp; Add Measure Group
          </DSLink>
        </div>
      </Nav>
    </OuterWrapper>
  );
}
