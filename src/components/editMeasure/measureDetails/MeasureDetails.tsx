import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import {
  Route,
  Switch,
  useRouteMatch,
  useHistory,
  useLocation,
} from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import { routeHandlerStore, useDocumentTitle } from "@madie/madie-util";
import StewardAndDevelopers from "./stewardAndDevelopers/StewardAndDevelopers";
import ModelAndMeasurementPeriod from "./modelAndMeasurementPeriod/ModelAndMeasurementPeriod";
import "./MeasureDetails.scss";
import EditMeasureDetailsSideNav from "./EditMeasureDetailsSideNav";
const Grid = tw.div`grid grid-cols-6 auto-cols-max gap-4 mx-8 shadow-lg rounded-md border border-slate overflow-hidden bg-white`;
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}

export interface MeasureDetailsProps {
  setErrorMessage: Function;
}

export default function MeasureDetails(props: MeasureDetailsProps) {
  const { setErrorMessage } = props;
  useDocumentTitle("MADiE Edit Measure Details");
  const { path } = useRouteMatch();
  const modelPeriodLink = `${path}/model&measurement-period`;
  const stewardLink = `${path}/measure-steward`;
  const descriptionLink = `${path}/measure-description`;
  const copyrightLink = `${path}/measure-copyright`;
  const disclaimerLink = `${path}/measure-disclaimer`;
  const rationaleLink = `${path}/measure-rationale`;
  const guidanceLink = `${path}/measure-guidance`;
  const clinicalLink = `${path}/measure-clinical-recommendation`;
  // const riskAdjustmentLink = `${path}/measure-risk-adjustment`;

  const links = [
    // General Information
    {
      title: "General Information",
      links: [
        {
          title: "Name, Version & ID",
          href: path,
          dataTestId: "leftPanelMeasureInformation",
          id: "sideNavMeasureInformation",
        },
        {
          title: "Model & Measurement Period",
          href: modelPeriodLink,
          dataTestId: "leftPanelModelAndMeasurementPeriod",
          id: "sideNavMeasureModelAndMeasurementPeriod",
        },
        {
          title: "Steward & Developers",
          href: stewardLink,
          dataTestId: "leftPanelMeasureSteward",
          id: "sideNavMeasureSteward",
        },
      ],
    },
    // measure overview
    {
      title: "Measure Overview",
      links: [
        {
          title: "Description",
          href: descriptionLink,
          dataTestId: "leftPanelMeasureDescription",
          id: "sideNavMeasureDescription",
        },
        {
          title: "Rationale",
          href: rationaleLink,
          dataTestId: "leftPanelMeasureRationale",
          id: "sideNavMeasureRationale",
        },
        {
          title: "Guidance (Usage)",
          href: guidanceLink,
          dataTestId: "leftPanelMeasureGuidance",
          id: "sideNavMeasureGuidance",
        },
        {
          title: "Clinical Recommendation",
          href: clinicalLink,
          dataTestId: "leftPanelMeasureClinicalRecommendation",
          id: "sideNavMeasureClinicalRecommendation",
        },
        // {
        //   title: "Risk Adjustment",
        //   href: riskAdjustmentLink,
        //   dataTestId: "leftPanelMeasureRiskAdjustment",
        //   id: "sideNavMeasureRiskAdjustment",
        // },
      ],
    },
    // legal
    {
      title: "Legal",
      links: [
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
      ],
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

  // blank our error message on navigation since we blank forms.
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    setErrorMessage("");
  }, [pathname, setErrorMessage]);

  return (
    <>
      <Grid>
        <EditMeasureDetailsSideNav links={links} />
        <Switch>
          <Route exact path={path}>
            <MeasureInformation setErrorMessage={setErrorMessage} />
          </Route>
          <Route exact path={modelPeriodLink}>
            <ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />
          </Route>
          <Route path={stewardLink}>
            <StewardAndDevelopers setErrorMessage={setErrorMessage} />
          </Route>
          <Route path={descriptionLink}>
            <MeasureMetadata
              measureMetadataId="Description"
              measureMetadataType="Description"
              header="Description"
              setErrorMessage={setErrorMessage}
            />
          </Route>
          <Route path={copyrightLink}>
            <MeasureMetadata
              measureMetadataId="Copyright"
              measureMetadataType="Copyright"
              header="Copyright"
              setErrorMessage={setErrorMessage}
            />
          </Route>
          <Route path={disclaimerLink}>
            <MeasureMetadata
              measureMetadataId="Disclaimer"
              measureMetadataType="Disclaimer"
              header="Disclaimer"
              setErrorMessage={setErrorMessage}
            />
          </Route>
          <Route path={rationaleLink}>
            <MeasureMetadata
              measureMetadataId="Rationale"
              measureMetadataType="Rationale"
              header="Rationale"
              setErrorMessage={setErrorMessage}
            />
          </Route>
          <Route path={guidanceLink}>
            <MeasureMetadata
              measureMetadataId="Guidance"
              measureMetadataType="Guidance (Usage)"
              header="Guidance (Usage)"
              setErrorMessage={setErrorMessage}
            />
          </Route>
          <Route path={clinicalLink}>
            <MeasureMetadata
              measureMetadataId="ClinicalRecommendation"
              measureMetadataType="Clinical Recommendation Statement"
              header="Clinical Recommendation"
              setErrorMessage={setErrorMessage}
            />
          </Route>
          {/* <Route path={riskAdjustmentLink}>
            <MeasureMetadata
              measureMetadataId="RiskAdjustment"
              measureMetadataType="Risk Adjustment"
              header="Risk Adjustment"
              setErrorMessage={setErrorMessage}
            />
          </Route> */}
        </Switch>
      </Grid>
    </>
  );
}
