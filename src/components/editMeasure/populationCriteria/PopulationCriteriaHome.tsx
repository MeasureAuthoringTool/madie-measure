import React, { useEffect, useState, useMemo, lazy, Suspense } from "react";
import "twin.macro";
import "styled-components/macro";
import { useRouteMatch } from "react-router-dom";
import SupplementalElements from "./supplementalData/SupplementalElements";
import PopulationCriteriaSideNav from "./populationCriteriaSideNav/PopulationCriteriaSideNav";
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
  // const [model, setModel] = useState("");
  // useEffect(() => {
  //   setModel(measure?.model);
  // }, [measure?.model]);
  const canEdit: boolean = checkUserCanEdit(measure?.createdBy, measure?.acls);
  const [measureGroupNumber, setMeasureGroupNumber] = useState<number>(0);
  const [sideNavLinks, setSideNavLinks] = useState<Array<any>>();
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);

  const baseConfigurationUrl =
    "/measures/" + measure?.id + "/edit/base-configuration";
  const groupsBaseUrl = "/measures/" + measure?.id + "/edit/groups";

  // this works for a specific QDM version
  // If we specify weather the string contains QDM, we can have a more flexible check. All QDM versions will trigger that render, then we can handle differently
  const isQDM = ((): boolean => {
    // return measure?.model === Model.QDM_5_6;
    return measure?.model.includes("QDM");
  })();

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

  // lets dynamically load our measureGroups component based on weather it's QDM or QICore
  // this needs to be memoized as it loses state otherwise and refreshes on change

  // console.log('what is model?????;', model)
  const MeasureGroupsComponent = useMemo(
    () =>
      lazy(() => {
        if (measure?.model.includes("QDM")) {
          return import("./groups/QDM/QDMMeasureGroups");
        } else {
          return import("./groups/QICore/QICoreMeasureGroups");
        }
      }),
    [measure?.model]
  );

  return (
    // <Suspense fallback={<div>loading</div>}>
    <div tw="grid lg:grid-cols-6 gap-4 mx-8 shadow-lg rounded-md border border-slate bg-white">
      <PopulationCriteriaSideNav
        canEdit={canEdit}
        sideNavLinks={sideNavLinks}
        setSideNavLinks={setSideNavLinks}
        measureGroupNumber={measureGroupNumber}
        setMeasureGroupNumber={setMeasureGroupNumber}
        measureId={measure?.id}
        isFormDirty={isFormDirty}
        isQDM={isQDM}
      />
      {/* path can be independent of nav */}
      {path.includes("/base-configuration") && <BaseConfiguration />}
      {/* we will load A measureGroups component*/}
      {path.includes("/groups") && (
        <MeasureGroupsComponent
          setIsFormDirty={setIsFormDirty}
          measureGroupNumber={measureGroupNumber}
          setMeasureGroupNumber={setMeasureGroupNumber}
        />
      )}
      {/* what's a better way to say if QDM or QICore? 
          To do: Find a more elegant solution for future when we have more than two models to avoid if else if else. */}
      {path.includes("/supplemental-data") && <SupplementalElements />}

      {path.includes("/risk-adjustment") && <RiskAdjustment />}
    </div>
    // </Suspense>
  );
}

export default PopulationCriteriaHome;
