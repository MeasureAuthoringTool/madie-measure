import React from "react";
import { NavLink, useLocation, useRouteMatch } from "react-router-dom";
import tw, { styled } from "twin.macro";

interface PropTypes {
  isActive?: boolean;
}

const MenuItemContainer = tw.ul`bg-current flex border-b`;
const MenuItem = styled.li((props: PropTypes) => [
  tw`mr-1 text-white inline-block py-2 px-4 font-semibold focus:outline-none`,
  props.isActive && tw`bg-white text-black`,
]);

const EditMeasureNav = () => {
  const { url } = useRouteMatch();
  // TODO: try activeClassName of NavLink instead of manual path check
  const { pathname } = useLocation();

  return (
    <div>
      <MenuItemContainer>
        <MenuItem
          data-testid="measure-details-tab"
          isActive={pathname.startsWith(`${url}/details`)}
        >
          <NavLink to={`${url}/details`}>Details</NavLink>
        </MenuItem>
        <MenuItem
          data-testid="cql-editor-tab"
          isActive={pathname === `${url}/cql-editor`}
        >
          <NavLink to={`${url}/cql-editor`}>CQL Editor</NavLink>
        </MenuItem>
        <MenuItem
          data-testid="measure-groups-tab"
          isActive={pathname === `${url}/measure-groups`}
        >
          <NavLink to={`${url}/measure-groups`}>Measure Groups</NavLink>
        </MenuItem>
        <MenuItem
          data-testid="patients-tab"
          isActive={pathname.startsWith(`${url}/test-cases`)}
        >
          <NavLink to={`${url}/test-cases`}>Test Cases</NavLink>
        </MenuItem>
      </MenuItemContainer>
    </div>
  );
};

export default EditMeasureNav;
