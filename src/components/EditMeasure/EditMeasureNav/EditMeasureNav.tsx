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
        <MenuItem isActive={pathname.startsWith(`${url}/details`)}>
          <NavLink to={`${url}/details`}>Details</NavLink>
        </MenuItem>
        <MenuItem isActive={pathname === `${url}/cql-editor`}>
          <NavLink to={`${url}/cql-editor`}>CQL Editor</NavLink>
        </MenuItem>
        <MenuItem isActive={pathname === `${url}/measure-groups`}>
          <NavLink to={`${url}/measure-groups`}>Measure Groups</NavLink>
        </MenuItem>
        <MenuItem isActive={pathname === `${url}/patients`}>
          <NavLink to={`${url}/patients`}>Patients</NavLink>
        </MenuItem>
      </MenuItemContainer>
    </div>
  );
};

export default EditMeasureNav;
