import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import {
  Route,
  Switch,
  useRouteMatch,
  useHistory,
  Link,
} from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import EditMeasureSideBarNav from "./EditMeasureSideBarNav";
import { routeHandlerStore, useDocumentTitle } from "@madie/madie-util";
import StewardAndDevelopers from "./stewardAndDevelopers/StewardAndDevelopers";
import { LinkSharp } from "@mui/icons-material";

const Grid = tw.div`grid grid-cols-6 auto-cols-max gap-4 mx-8 my-6 shadow-lg rounded-md border border-slate overflow-hidden bg-white`;
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}
export default function MeasureDetails() {
  useDocumentTitle("MADiE Edit Measure Details");
  const { path } = useRouteMatch();
  const stewardLink = `${path}/measure-steward`;
  const descriptionLink = `${path}/measure-description`;
  const copyrightLink = `${path}/measure-copyright`;
  const disclaimerLink = `${path}/measure-disclaimer`;
  const rationaleLink = `${path}/measure-rationale`;
  const guidanceLink = `${path}/measure-guidance`;
  const clinicalLink = `${path}/measure-clinical-recommendation`;

  const links = [
    {
      title: "Information",
      href: path,
      dataTestId: "leftPanelMeasureInformation",
      id: "sideNavMeasureInformation",
    },
    {
      title: "Steward & Developers",
      href: stewardLink,
      dataTestId: "leftPanelMeasureSteward",
      id: "sideNavMeasureSteward",
    },
    {
      title: "Description",
      href: descriptionLink,
      dataTestId: "leftPanelMeasureDescription",
      id: "sideNavMeasureDescription",
    },
    {
      title: "Copyright",
      href: copyrightLink,
      dataTestId: "leftPanelMeasureCopyright",
      id: "sideNavMeasureCopyright",
    },
    {
      title: "Disclaimer",
      href: disclaimerLink,
      dataTestId: "leftPanelMeasureDisclaimer",
      id: "sideNavMeasureDisclaimer",
    },
    {
      title: "Rationale",
      href: rationaleLink,
      dataTestId: "leftPanelMeasureRationale",
      id: "sideNavMeasureRationale",
    },
    {
      title: "Guidance",
      href: guidanceLink,
      dataTestId: "leftPanelMeasureGuidance",
      id: "sideNavMeasureGuidance",
    },
    {
      title: "Clinical Recommendation",
      href: clinicalLink,
      dataTestId: "leftPanelMeasureClinicalGuidance",
      id: "sideNavMeasureClinicalRecommendation",
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
        <EditMeasureSideBarNav
          header="Edit Measure"
          links={links}
          dirty={true}
        />
        <Switch>
          <Route exact path={path}>
            <MeasureInformation />
          </Route>
          <Route path={stewardLink}>
            <StewardAndDevelopers />
          </Route>
          <Route path={descriptionLink}>
            <MeasureMetadata
              measureMetadataId="Description"
              measureMetadataType="Description"
              header="Description"
            />
          </Route>
          <Route path={copyrightLink}>
            <MeasureMetadata
              measureMetadataId="Copyright"
              measureMetadataType="Copyright"
              header="Copyright"
            />
          </Route>
          <Route path={disclaimerLink}>
            <MeasureMetadata
              measureMetadataId="Disclaimer"
              measureMetadataType="Disclaimer"
              header="Disclaimer"
            />
          </Route>
          <Route path={rationaleLink}>
            <MeasureMetadata
              measureMetadataId="Rationale"
              measureMetadataType="Rationale"
              header="Rationale"
            />
          </Route>
          <Route path={guidanceLink}>
            <MeasureMetadata
              measureMetadataId="Guidance"
              measureMetadataType="Guidance"
              header="Guidance"
            />
          </Route>
          <Route path={clinicalLink}>
            <MeasureMetadata
              measureMetadataId="ClinicalRecommendation"
              measureMetadataType="Clinical Recommendation Statement"
              header="Clinical Recommendation"
            />
          </Route>
        </Switch>
      </Grid>
    </>
  );
}
