import React, { lazy, Suspense, useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PopulationCriteriaSideNav from "./populationCriteriaSideNav/PopulationCriteriaSideNav";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import BaseConfiguration from "./baseConfiguration/BaseConfiguration";
import QDMReporting from "./QDMReporting/QDMReporting";
import MeasureGroupAlerts from "./groups/MeasureGroupAlerts";

// Stable lazy imports. Without this child component infinitely renders.
const QdmSupplementalData = lazy(
  () => import("./supplementalData/qdm/SupplementalData")
);
const QiCoreSupplementalData = lazy(
  () => import("./supplementalData/qiCore/SupplementalData")
);
const EmptySupplementalData = lazy(
  () => import("./supplementalData/EmptySupplementalData")
);

const QdmRiskAdjustment = lazy(
  () => import("./riskAdjustment/qdm/RiskAdjustment")
);
const QiCoreRiskAdjustment = lazy(
  () => import("./riskAdjustment/qiCore/RiskAdjustment")
);
const EmptyRiskAdjustment = lazy(
  () => import("./riskAdjustment/EmptyRiskAdjustment")
);

const QdmMeasureGroups = lazy(() => import("./groups/QDM/QDMMeasureGroups"));
const QicoreMeasureGroups = lazy(
  () => import("./groups/QICore/QICoreMeasureGroups")
);

export const COMPLETE = "complete";
export const INCOMPLETE = "incomplete";
export const NONE = "none";

export function PopulationCriteriaHome() {
  const { pathname } = useLocation();
  const { groupNumber } = useParams();
  const [measure, setMeasure] = useState<Measure>(measureStore.state);

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => subscription.unsubscribe();
  }, []);

  const navigate = useNavigate();
  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  const [measureGroupNumber, setMeasureGroupNumber] = useState<number>(null);
  const [sideNavLinks, setSideNavLinks] = useState<Array<any>>();
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const groupsBaseUrl = `/measures/${measure?.id}/edit/groups`;

  const isQDM = measure?.model?.includes("QDM");

  const SupplementalDataComponent = measure?.model?.includes("QDM")
    ? QdmSupplementalData
    : measure?.model?.includes("QI-Core")
    ? QiCoreSupplementalData
    : EmptySupplementalData;

  const RiskAdjustmentComponent = measure?.model?.includes("QDM")
    ? QdmRiskAdjustment
    : measure?.model?.includes("QI-Core")
    ? QiCoreRiskAdjustment
    : EmptyRiskAdjustment;

  const MeasureGroupsComponent = measure?.model?.includes("QDM")
    ? QdmMeasureGroups
    : QicoreMeasureGroups;

  useEffect(() => {
    if (pathname.includes("/groups")) {
      if (+groupNumber && +groupNumber > 0) {
        setMeasureGroupNumber(+groupNumber - 1);
      } else {
        navigate("/404");
      }
    } else {
      setMeasureGroupNumber(null);
    }
  }, [groupNumber]);

  useEffect(() => {
    const measureGroups =
      measure?.groups && measure.groups.length > 0
        ? measure.groups.map((_group, id) => ({
            title: `Criteria ${id + 1}`,
            href: `${groupsBaseUrl}/${id + 1}`,
            dataTestId: `leftPanelMeasureInformation-MeasureGroup${id + 1}`,
            groupPopulated: true,
          }))
        : [
            {
              title: "Criteria 1",
              href: `${groupsBaseUrl}/1`,
              dataTestId: "leftPanelMeasureInformation-MeasureGroup1",
              groupPopulated: false,
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

  const checkBaseConfigPopulated = () =>
    measure?.model?.includes("QDM") &&
    measure?.baseConfigurationTypes?.length > 0;

  const checkReporting = () => {
    const {
      improvementNotation,
      improvementNotationDescription,
      rateAggregation,
    } = measure || {};
    if (
      improvementNotation &&
      improvementNotationDescription &&
      rateAggregation
    )
      return COMPLETE;
    if (
      !improvementNotation &&
      !improvementNotationDescription &&
      !rateAggregation
    )
      return NONE;
    return INCOMPLETE;
  };

  const checkSupplementalData = () => {
    const hasData = measure?.supplementalData?.length > 0;
    const hasDesc = !!measure?.supplementalDataDescription;
    if (hasData && hasDesc) return COMPLETE;
    if (!hasData && !hasDesc) return NONE;
    return INCOMPLETE;
  };

  const checkRiskAdjustment = () => {
    const hasData = measure?.riskAdjustments?.length > 0;
    const hasDesc = !!measure?.riskAdjustmentDescription;
    if (hasData && hasDesc) return COMPLETE;
    if (!hasData && !hasDesc) return NONE;
    return INCOMPLETE;
  };

  return (
    <>
      <MeasureGroupAlerts {...alertMessage} />
      <div
        tw="grid lg:grid-cols-6 gap-4 mx-8 shadow-lg rounded-md border bg-white"
        style={{
          borderColor: "#8c8c8c",
          borderRadius: "4px",
        }}
      >
        <PopulationCriteriaSideNav
          canEdit={canEdit}
          sideNavLinks={sideNavLinks}
          setSideNavLinks={setSideNavLinks}
          measureGroupNumber={measureGroupNumber}
          setMeasureGroupNumber={setMeasureGroupNumber}
          measureId={measure?.id}
          isFormDirty={isFormDirty}
          isQDM={isQDM}
          baseConfigPopulated={checkBaseConfigPopulated()}
          reportingStatus={checkReporting()}
          supplementalDataStatus={checkSupplementalData()}
          riskAdjustmentStatus={checkRiskAdjustment()}
        />

        {pathname.includes("/base-configuration") && <BaseConfiguration />}

        {pathname.includes("/groups") && (
          <Suspense fallback={<div>Loading groups…</div>}>
            <MeasureGroupsComponent
              setIsFormDirty={setIsFormDirty}
              measureGroupNumber={measureGroupNumber}
              setMeasureGroupNumber={setMeasureGroupNumber}
              measureId={measure?.id}
              setAlertMessage={setAlertMessage}
            />
          </Suspense>
        )}

        {pathname.includes("reporting") && <QDMReporting />}

        {pathname.includes("/supplemental-data") && (
          <Suspense fallback={<div>Loading supplemental data…</div>}>
            <SupplementalDataComponent />
          </Suspense>
        )}

        {pathname.includes("/risk-adjustment") && (
          <Suspense fallback={<div>Loading risk adjustment…</div>}>
            <RiskAdjustmentComponent />
          </Suspense>
        )}
      </div>
    </>
  );
}

export default PopulationCriteriaHome;
