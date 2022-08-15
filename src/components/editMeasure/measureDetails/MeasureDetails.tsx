import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import { Route, Switch, useRouteMatch, useHistory } from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import EditMeasureSideBarNav from "./EditMeasureSideBarNav";
import { routeHandlerStore } from "@madie/madie-util";

const Grid = tw.div`grid grid-cols-6 auto-cols-max gap-4 mx-8 my-6 shadow-lg rounded-md border border-slate overflow-hidden bg-white`;
const Content = tw.div`col-span-5 py-6`;
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}
export default function EditMeasure() {
  const { path } = useRouteMatch();
  const stewardLink = `${path}/measure-steward`;
  const descriptionLink = `${path}/measure-description`;
  const copyrightLink = `${path}/measure-copyright`;
  const disclaimerLink = `${path}/measure-disclaimer`;
  const rationaleLink = `${path}/measure-rationale`;
  const authorLink = `${path}/measure-author`;
  const guidanceLink = `${path}/measure-guidance`;

  const links = [
    {
      title: "Information",
      href: path,
      dataTestId: "leftPanelMeasureInformation",
    },
    {
      title: "Steward/Author",
      href: stewardLink,
      dataTestId: "leftPanelMeasureSteward",
    },
    {
      title: "Description",
      href: descriptionLink,
      dataTestId: "leftPanelMeasureDescription",
    },
    {
      title: "Copyright",
      href: copyrightLink,
      dataTestId: "leftPanelMeasureCopyright",
    },
    {
      title: "Disclaimer",
      href: disclaimerLink,
      dataTestId: "leftPanelMeasureDisclaimer",
    },
    {
      title: "Rationale",
      href: rationaleLink,
      dataTestId: "leftPanelMeasureRationale",
    },
    {
      title: "Author",
      href: authorLink,
      dataTestId: "leftPanelMeasureAuthor",
    },
    {
      title: "Guidance",
      href: guidanceLink,
      dataTestId: "leftPanelMeasureGuidance",
    },
  ];
  const history = useHistory();
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
        return false;
      }
      unblock();
    });
    return unblock;
  }, []);

  return (
    <>
      <Grid>
        <EditMeasureSideBarNav header="Edit Measure" links={links} />
        <Content>
          <Switch>
            <Route exact path={path}>
              <MeasureInformation />
            </Route>
            <Route path={stewardLink}>
              <MeasureMetadata measureMetadataType="Steward" />
            </Route>
            <Route path={descriptionLink}>
              <MeasureMetadata measureMetadataType="Description" />
            </Route>
            <Route path={copyrightLink}>
              <MeasureMetadata measureMetadataType="Copyright" />
            </Route>
            <Route path={disclaimerLink}>
              <MeasureMetadata measureMetadataType="Disclaimer" />
            </Route>
            <Route path={rationaleLink}>
              <MeasureMetadata measureMetadataType="Rationale" />
            </Route>
            <Route path={authorLink}>
              <MeasureMetadata measureMetadataType="Author" />
            </Route>
            <Route path={guidanceLink}>
              <MeasureMetadata measureMetadataType="Guidance" />
            </Route>
          </Switch>
        </Content>
      </Grid>
    </>
  );
}
