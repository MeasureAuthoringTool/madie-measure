import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { Route, Switch, useLocation, useRouteMatch } from "react-router-dom";
import SupplementalElements from "../measureGroups/SupplementalElements";
import EditMeasureSideBarNav from "../measureGroups/populationCriteriaSideNav/EditMeasureSideBarNav";
import MeasureGroups from "../measureGroups/MeasureGroups";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";

export function PopulationCriteria() {
  const { path } = useRouteMatch();

  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit: boolean = checkUserCanEdit(measure?.createdBy, measure?.acls);
  const [measureGroupNumber, setMeasureGroupNumber] = useState<number>(0);
  const [sideNavLinks, setSideNavLinks] = useState<Array<any>>();

  // Local state to later populate the left nav and and govern routes based on group ids
  const groupsBaseUrl = "/measures/" + measure?.id + "/edit/groups";
  const supplementalDataBaseUrl =
    "/measures/" + measure?.id + "/edit/supplemental-data";
  const riskAdjustmentBaseUrl =
    "/measures/" + measure?.id + "/edit/risk-adjustment";

  /* This useEffect generates information required for left side nav bar
   * If a measure doesn't have any groups, then a new one is added. */
  useEffect(() => {
    const measureGroups = measure?.groups
      ? measure.groups?.map((_group, id) => ({
          title: `Criteria ${id + 1}`,
          href: groupsBaseUrl,
          dataTestId: `leftPanelMeasureInformation-MeasureGroup${id + 1}`,
        }))
      : [
          {
            title: "Population Criteria 1",
            href: groupsBaseUrl,
            dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
          },
        ];
    setSideNavLinks([
      {
        title: "Population Criteria",
        groups: measureGroups,
        dataTestId: "leftPanelMeasurePopulationCriteriaTab",
        id: "sideNavMeasurePopulationCriteria",
      },
      {
        title: "Supplemental Data",
        href: supplementalDataBaseUrl,
        dataTestId: "leftPanelMeasurePopulationsSupplementalDataTab",
        id: "sideNavMeasurePopulationsSupplementalData",
      },
      {
        title: "Risk Adjustment",
        href: riskAdjustmentBaseUrl,
        dataTestId: "leftPanelMeasurePopulationsRiskAdjustmentTab",
        id: "sideNavMeasurePopulationsRiskAdjustment",
      },
    ]);
  }, [
    groupsBaseUrl,
    measure?.groups,
    riskAdjustmentBaseUrl,
    supplementalDataBaseUrl,
  ]);

  return (
    <>
      <div tw="grid lg:grid-cols-6 gap-4 mx-8 shadow-lg rounded-md border border-slate bg-white">
        <EditMeasureSideBarNav
          canEdit={canEdit}
          urlPath={path}
          sideNavLinks={sideNavLinks}
          setSideNavLinks={setSideNavLinks}
          measureGroupNumber={measureGroupNumber}
          setMeasureGroupNumber={setMeasureGroupNumber}
          measureId={measure?.id}
        />
        {path.includes("/groups") && (
          <MeasureGroups
            measureGroupNumber={measureGroupNumber}
            setMeasureGroupNumber={setMeasureGroupNumber}
          />
        )}
        {path.includes("/supplemental-data") && (
          <SupplementalElements
            title="Supplemental Data"
            dataTestId="supplemental-data"
          />
        )}
        {path.includes("/risk-adjustment") && (
          <SupplementalElements
            title="Risk Adjustment"
            dataTestId="risk-adjustment"
          />
        )}
      </div>
    </>
  );
}

export default PopulationCriteria;
