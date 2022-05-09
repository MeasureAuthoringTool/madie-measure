import React from "react";
import {
  NavLink,
  useLocation,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import tw, { styled } from "twin.macro";

interface PropTypes {
  isActive?: boolean;
}

const MenuItemContainer = tw.ul`bg-transparent flex px-8`;
const MenuItem = styled.li((props: PropTypes) => [
  tw`mr-1 text-white bg-blue-950 rounded-t-md hover:bg-blue-975`,
  props.isActive && tw`bg-slate text-slate-90 font-medium hover:bg-slate`,
]);

const NavLinkCustom = tw(
  NavLink
)`py-3.5 px-8 inline-block no-underline text-inherit text-sm hover:text-inherit focus:outline-none focus:text-inherit focus:no-underline`;

const EditMeasureNav = () => {
  const { url } = useRouteMatch();
  // TODO: try activeClassName of NavLink instead of manual path check
  const { pathname } = useLocation();
  let history = useHistory();

  if (
    pathname !== `${url}/details` &&
    pathname !== `${url}/cql-editor` &&
    pathname !== `${url}/groups` &&
    pathname !== `${url}/details/measure-steward` &&
    pathname !== `${url}/details/measure-description` &&
    pathname !== `${url}/details/measure-copyright` &&
    pathname !== `${url}/details/measure-disclaimer` &&
    pathname !== `${url}/details/measure-rationale` &&
    pathname !== `${url}/details/measure-author` &&
    pathname !== `${url}/details/measure-guidance` &&
    !pathname.startsWith(`${url}/test-cases`)
  ) {
    history.push("/404");
  }

  return (
    <div>
      <MenuItemContainer>
        <MenuItem
          data-testid="measure-details-tab"
          isActive={pathname.startsWith(`${url}/details`)}
        >
          <NavLinkCustom to={`${url}/details`}>Details</NavLinkCustom>
        </MenuItem>
        <MenuItem
          data-testid="cql-editor-tab"
          isActive={pathname === `${url}/cql-editor`}
        >
          <NavLinkCustom to={`${url}/cql-editor`}>CQL Editor</NavLinkCustom>
        </MenuItem>
        <MenuItem
          data-testid="groups-tab"
          isActive={pathname === `${url}/groups`}
        >
          <NavLinkCustom to={`${url}/groups`}>Groups</NavLinkCustom>
        </MenuItem>
        <MenuItem
          data-testid="patients-tab"
          isActive={pathname.startsWith(`${url}/test-cases`)}
        >
          <NavLinkCustom to={`${url}/test-cases`}>Test Cases</NavLinkCustom>
        </MenuItem>
      </MenuItemContainer>
    </div>
  );
};

export default EditMeasureNav;
