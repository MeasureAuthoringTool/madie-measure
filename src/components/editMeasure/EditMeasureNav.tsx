import React, { useEffect, useState, useCallback } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
  Navigate,
  useMatch,
  useParams,
} from "react-router-dom";
import tw, { styled } from "twin.macro";
import { routeHandlerStore } from "@madie/madie-util";
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

const EditMeasureNav = ({ isQDM }) => {
  const { pathname } = useLocation();
  let navigate = useNavigate();
  const { id } = useParams<{
    id: string;
  }>();
  const handleChange = (e, v) => {
    const newPath = `/measures/${id}/edit/${v}`;
    navigate(newPath, { replace: true });
  };
  const qdmNavTo = () => {
    isQDM ? `${pathname}/base-configuration` : `${pathname}/groups/1`;
  };
  // we grab the matching pattern after edit, then we only get the part before the next slash.
  const fullMatch = useMatch("/measures/:id/edit/*")?.params?.["*"];
  if (fullMatch === "details" && id) {
    navigate(`/measures/${id}/edit/details/`, { replace: true });
  }
  const match = useMatch("/measures/:id/edit/*")?.params?.["*"].split("/")[0];
  return (
    <div>
      <div style={{ marginLeft: "32px" }} id="edit-measure-nav-a">
        <Tabs value={match} onChange={handleChange} type="A" size="large">
          <Tab
            value={`details`}
            to="details"
            data-testid="measure-details-tab"
            type="A"
            size="large"
            label="Details"
            component={NavLink}
          />
          <Tab
            value="cql-editor"
            to={`cql-editor`}
            data-testid="cql-editor-tab"
            type="A"
            size="large"
            label="CQL Editor"
            component={NavLink}
          />
          <Tab
            value={`groups`}
            to={isQDM ? `base-configuration` : `groups/1`}
            data-testid="groups-tab"
            type="A"
            size="large"
            label="Population Criteria"
            component={NavLink}
          />
          <Tab
            value={`test-cases`}
            to={`test-cases`}
            data-testid="patients-tab"
            type="A"
            size="large"
            label="Test Cases"
            component={NavLink}
          />
        </Tabs>
      </div>
    </div>
  );
};

export default EditMeasureNav;
