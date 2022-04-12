import * as React from "react";
import tw from "twin.macro";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import MeasureDetailsSidebar from "./MeasureDetailsSidebar";

const Grid = tw.div`grid grid-cols-4 gap-4 ml-6`;
const Content = tw.div`col-span-3`;

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
      title: "Measure Information",
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

  return (
    <>
      <Grid>
        <MeasureDetailsSidebar header="Edit Measure" links={links} />
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
