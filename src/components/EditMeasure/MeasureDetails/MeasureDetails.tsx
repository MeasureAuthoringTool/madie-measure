import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import MeasureInformation from "./MeasureInformation";
import MeasureSteward from "./MeasureSteward";
import MeasureDetailsSidebar from "./MeasureDetailsSidebar";
import useCurrentMeasure from "../useCurrentMeasure";

interface MeasureParam {
  id: string;
}

const Grid = tw.div`grid grid-cols-4 gap-4 ml-6`;
const Content = tw.div`col-span-3`;

export default function EditMeasure(params: MeasureParam) {
  const { url } = useRouteMatch();
  const stewardLink = `${url}/measure-steward`;
  const measure = useCurrentMeasure();

  const links = [
    {
      title: "Measure Information",
      href: url,
    },
    {
      title: "Steward/Author",
      href: stewardLink,
    },
  ];

  return (
    <>
      <Grid>
        <MeasureDetailsSidebar links={links} />
        <Content>
          <Switch>
            <Route exact path={url}>
              <MeasureInformation measure={measure} />
            </Route>
            <Route path={stewardLink}>
              <MeasureSteward measure={measure} />
            </Route>
          </Switch>
        </Content>
      </Grid>
    </>
  );
}
