import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import Measure from "../../../models/Measure";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import MeasureInformation from "./MeasureInformation";
import MeasureSteward from "./MeasureSteward";
import MeasureDetailsSidebar from "./MeasureDetailsSidebar";

interface MeasureParam {
  id: string;
}

export default function EditMeasure(params: MeasureParam) {
  const { id } = params;
  const [measure, setMeasure] = useState<Measure>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const measureServiceApi = useMeasureServiceApi();
  const { url } = useRouteMatch();
  const stewardLink = `${url}/measure-steward`;

  useEffect(() => {
    measureServiceApi.fetchMeasure(id).then((value: Measure) => {
      setMeasure(value);
      setLoading(false);
    });
  }, [measureServiceApi, id]);

  const loadingDiv = <div>Loading...</div>;

  const Grid = tw.div`grid grid-cols-4 gap-4 ml-6`;
  const Content = tw.div`col-span-3`;

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

  const contentDiv = (
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

  return loading ? loadingDiv : contentDiv;
}
