import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { useRouteMatch } from "react-router-dom";
import SupplementalElements from "./supplementalData/SupplementalElements";
import PopulationCriteriaSideNav from "./populationCriteriaSideNav/PopulationCriteriaSideNav";
import MeasureGroups from "./groups/MeasureGroups";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import { Measure, Model } from "@madie/madie-models";
import RiskAdjustment from "./riskAdjustment/RiskAdjustment";
import BaseConfiguration from "./baseConfiguration/BaseConfiguration";

export function PopulationCriteriaHome() {
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
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);

  const baseConfigurationUrl =
    "/measures/" + measure?.id + "/edit/base-configuration";
  const groupsBaseUrl = "/measures/" + measure?.id + "/edit/groups";

  const isQDM = (): boolean => {
    return measure?.model === Model.QDM_5_6;
  };

  /* This useEffect generates information required for left side nav bar
   * If a measure doesn't have any groups, then a new one is added. */
  useEffect(() => {
    const measureGroups =
      measure?.groups && measure.groups.length > 0
        ? measure.groups?.map((_group, id) => ({
            title: `Criteria ${id + 1}`,
            href: groupsBaseUrl,
            dataTestId: `leftPanelMeasureInformation-MeasureGroup${id + 1}`,
          }))
        : [
            {
              title: "Criteria 1",
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
    ]);
  }, [groupsBaseUrl, measure?.groups]);

  return (
    <>
      <div tw="grid lg:grid-cols-6 gap-4 mx-8 shadow-lg rounded-md border border-slate bg-white">
        <PopulationCriteriaSideNav
          canEdit={canEdit}
          sideNavLinks={sideNavLinks}
          setSideNavLinks={setSideNavLinks}
          measureGroupNumber={measureGroupNumber}
          setMeasureGroupNumber={setMeasureGroupNumber}
          measureId={measure?.id}
          isFormDirty={isFormDirty}
        />
        {path.includes("/base-configuration") && <BaseConfiguration />}

        {path.includes("/groups") && (
          <MeasureGroups
            setIsFormDirty={setIsFormDirty}
            measureGroupNumber={measureGroupNumber}
            setMeasureGroupNumber={setMeasureGroupNumber}
          />
        )}
        {path.includes("/supplemental-data") && <SupplementalElements />}

        {path.includes("/risk-adjustment") && <RiskAdjustment />}
      </div>
    </>
  );
}

export default PopulationCriteriaHome;
