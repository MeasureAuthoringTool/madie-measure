import React, { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import tw, { styled } from "twin.macro";
import { routeHandlerStore, useFeatureFlags } from "@madie/madie-util";
import { Tabs, Tab } from "@madie/madie-design-system/dist/react";
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

const EditMeasureNav = () => {
  const { url } = useRouteMatch();
  // TODO: try activeClassName of NavLink instead of manual path check
  const { pathname } = useLocation();
  let history = useHistory();
  const featureFlags = useFeatureFlags();
  const populationCriteriaTabs = !!featureFlags?.populationCriteriaTabs;

  if (
    pathname !== `${url}/details` &&
    pathname !== `${url}/details/model&measurement-period` &&
    pathname !== `${url}/cql-editor` &&
    pathname !== `${url}/groups` &&
    (pathname !== `${url}/supplemental-data` || !populationCriteriaTabs) &&
    (pathname !== `${url}/risk-adjustment` || !populationCriteriaTabs) &&
    pathname !== `${url}/base-configuration` &&
    pathname !== `${url}/reporting` &&
    pathname !== `${url}/details/measure-steward` &&
    pathname !== `${url}/details/measure-description` &&
    pathname !== `${url}/details/measure-copyright` &&
    pathname !== `${url}/details/measure-disclaimer` &&
    pathname !== `${url}/details/measure-rationale` &&
    pathname !== `${url}/details/measure-guidance` &&
    pathname !== `${url}/details/measure-clinical-recommendation` &&
    pathname !== `${url}/review-info` &&
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
  const [selected, setSelected] = useState<string>("");
  useEffect(() => {
    // groups
    if (
      pathname.startsWith(`${url}/groups`) ||
      pathname.startsWith(`${url}/supplemental-data`) ||
      pathname.startsWith(`${url}/risk-adjustment`) ||
      pathname.startsWith(`${url}/base-configuration`)
    ) {
      setSelected(`${url}/groups`);
    } else if (pathname.startsWith(`${url}/details`)) {
      setSelected(`${url}/details`);
    } else if (pathname === `${url}/cql-editor`) {
      setSelected(`${url}/cql-editor`);
    } else if (pathname.startsWith(`${url}/test-cases`)) {
      setSelected(`${url}/test-cases`);
    } else if (pathname.startsWith(`${url}/review-info`)) {
      setSelected(`${url}/review-info`);
    }
  }, [pathname]);
  const handleChange = (e, v) => {
    setSelected(v);
  };
  return (
    <div>
      <div style={{ marginLeft: "32px" }}>
        <Tabs value={selected} onChange={handleChange} type="A" size="large">
          <Tab
            value={`${url}/details`}
            to={`${url}/details`}
            data-testid="measure-details-tab"
            type="A"
            size="large"
            label="Details"
            component={NavLink}
          />
          <Tab
            value={`${url}/cql-editor`}
            to={`${url}/cql-editor`}
            data-testid="cql-editor-tab"
            type="A"
            size="large"
            label="CQL Editor"
            component={NavLink}
          />
          <Tab
            value={`${url}/groups`}
            to={`${url}/groups`}
            data-testid="groups-tab"
            type="A"
            size="large"
            label="Population Criteria"
            component={NavLink}
          />
          <Tab
            value={`${url}/test-cases`}
            to={`${url}/test-cases`}
            data-testid="patients-tab"
            type="A"
            size="large"
            label="Test Cases"
            component={NavLink}
          />
          <Tab
            value={`${url}/review-info`}
            to={`${url}/review-info`}
            data-testid="review-tab"
            type="A"
            size="large"
            label="Review Info"
            component={NavLink}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default EditMeasureNav;
