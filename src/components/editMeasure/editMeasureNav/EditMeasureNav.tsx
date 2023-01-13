import React, { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import tw, { styled } from "twin.macro";
import { routeHandlerStore } from "@madie/madie-util";
import useFeature from "../../../utils/useFeatureFlag";
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}
interface PropTypes {
  isActive?: boolean;
}

const MenuItemContainer = tw.ul`bg-transparent flex px-8`;
const MenuItem = styled.li((props: PropTypes) => [
  tw`mr-1 text-white bg-[rgba(0, 32, 64, 0.5)] rounded-t-md hover:bg-[rgba(0,6,13, 0.5)]`,
  props.isActive && tw`bg-slate text-slate-90 font-medium hover:bg-slate`,
]);

const NavLinkCustom = tw(
  NavLink
)`py-3.5 px-8 inline-block no-underline text-inherit text-sm hover:text-inherit focus:text-inherit focus:no-underline`;

const EditMeasureNav = () => {
  const { url } = useRouteMatch();
  // TODO: try activeClassName of NavLink instead of manual path check
  const { pathname } = useLocation();
  let history = useHistory();
  const populationCriteriaTabStructure = useFeature(
    "populationCriteriaTabStructure"
  );

  if (
    pathname !== `${url}/details` &&
    pathname !== `${url}/details/model&measurement-period` &&
    pathname !== `${url}/cql-editor` &&
    pathname !== `${url}/groups` &&
    (pathname !== `${url}/groups/supplemental-data` ||
      !populationCriteriaTabStructure) &&
    (pathname !== `${url}/groups/risk-adjustment` ||
      !populationCriteriaTabStructure) &&
    pathname !== `${url}/details/measure-steward` &&
    pathname !== `${url}/details/measure-description` &&
    pathname !== `${url}/details/measure-copyright` &&
    pathname !== `${url}/details/measure-disclaimer` &&
    pathname !== `${url}/details/measure-rationale` &&
    pathname !== `${url}/details/measure-guidance` &&
    pathname !== `${url}/details/measure-clinical-recommendation` &&
    pathname !== `${url}/details/measure-risk-adjustment` &&
    !pathname.startsWith(`${url}/test-cases`)
  ) {
    history.push("/404");
  }
  const { updateRouteHandlerState } = routeHandlerStore;
  const [routeHandlerState, setRouteHandlerState] = useState<RouteHandlerState>(
    routeHandlerStore.state
  );

  useEffect(() => {
    const subscription = routeHandlerStore.subscribe(setRouteHandlerState);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const unblock = history.block(({ pathname }, action) => {
      if (!routeHandlerState.canTravel) {
        updateRouteHandlerState({ canTravel: false, pendingRoute: pathname });
        return false;
      }
      unblock();
    });
    return unblock;
  }, [
    history.block,
    routeHandlerState.canTravel,
    routeHandlerState.pendingRoute,
  ]);
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
          isActive={pathname.startsWith(`${url}/groups`)}
        >
          <NavLinkCustom to={`${url}/groups`}>
            Population Criteria
          </NavLinkCustom>
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
