import React, { useState } from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import SupplementalElements from "../measureGroups/SupplementalElements";
import EditMeasureSideBarNav from "../measureGroups/populationCriteriaSideNav/EditMeasureSideBarNav";
import MeasureGroups from "../measureGroups/MeasureGroups";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";

export function PopulationCriteria() {
  // const { path } = useRouteMatch();
  //
  // const measure: Measure = measureStore.state;
  // const canEdit: boolean = checkUserCanEdit(measure?.createdBy, measure?.acls);

  return (
    <>
      {/*<Switch>*/}
      {/*  <Route exact path={`${path}/supplemental-data`}>*/}
      {/*    <SupplementalElements*/}
      {/*      title="Supplemental Data"*/}
      {/*      dataTestId="supplemental-data"*/}
      {/*    />*/}
      {/*  </Route>*/}
      {/*  <Route exact path={`${path}/supplemental-data`}>*/}
      {/*    <SupplementalElements*/}
      {/*      title="Risk Adjustment"*/}
      {/*      dataTestId="risk-adjustment"*/}
      {/*    />*/}
      {/*  </Route>*/}
      {/*</Switch>*/}

      {/*<div tw="grid lg:grid-cols-6 gap-4 mx-8 shadow-lg rounded-md border border-slate bg-white">*/}
      {/*<EditMeasureSideBarNav*/}
      {/*  canEdit={canEdit}*/}
      {/*  urlPath={path}*/}
      {/*  dirty={formik.dirty}*/}
      {/*  links={measureGroups}*/}
      {/*  measureGroupNumber={measureGroupNumber}*/}
      {/*  setMeasureGroupNumber={setMeasureGroupNumber}*/}
      {/*  measure={measure}*/}
      {/*/>*/}
      {/*<MeasureGroups></MeasureGroups>*/}
      {/*</div>*/}
    </>
  );
}

export default PopulationCriteria;
