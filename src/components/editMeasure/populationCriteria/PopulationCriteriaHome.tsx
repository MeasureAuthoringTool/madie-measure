import React, { lazy, useEffect, useMemo, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PopulationCriteriaSideNav from "./populationCriteriaSideNav/PopulationCriteriaSideNav";
import { checkUserCanEdit, measureStore } from "@madie/madie-util";
import { Measure } from "@madie/madie-models";
import BaseConfiguration from "./baseConfiguration/BaseConfiguration";
import QDMReporting from "./QDMReporting/QDMReporting";
import MeasureGroupAlerts from "./groups/MeasureGroupAlerts";
import { useFeatureFlags } from "@madie/madie-util";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";

export const COMPLETE = "complete";
export const INCOMPLETE = "incomplete";
export const NONE = "none";

export function PopulationCriteriaHome() {
  const { pathname } = useLocation();
  const { groupNumber, measureId } = useParams();
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const featureFlags = useFeatureFlags();

  useEffect(() => {
    // Subscribe to store
    const subscription = measureStore.subscribe(setMeasure);
    // Lock the measure if the Locking feature is enabled
    if (featureFlags?.Locking) {
      measureServiceApi
        .updateMeasureLock(measureId)
        .then((res) => {
          //@ts-ignore
          console.log("updateMeasureLock", res); // Preserve lock info
        })
        .catch((err) => {
          if (err.response?.data) {
            //@ts-ignore
            console.log("catch response.data", err);
          }
        });
    }

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      if (featureFlags?.Locking) {
        measureServiceApi.unlockMeasure(measureId);
      }
    };
  }, [measureServiceApi, measureId, featureFlags?.Locking]);

  let navigate = useNavigate();
  const canEdit: boolean = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
  const [measureGroupNumber, setMeasureGroupNumber] = useState<number>(null);
  const [sideNavLinks, setSideNavLinks] = useState<Array<any>>();
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const groupsBaseUrl = "/measures/" + measure?.id + "/edit/groups";

  const SupplementalDataComponent = useMemo(
    () =>
      lazy(() => {
        if (measure?.model?.includes("QDM")) {
          return import("./supplementalData/qdm/SupplementalData");
        }
        if (measure?.model?.includes("QI-Core")) {
          return import("./supplementalData/qiCore/SupplementalData");
        } else {
          return import("./supplementalData/EmptySupplementalData");
        }
      }),
    [measure?.model]
  );

  const RiskAdjustmentComponent = useMemo(
    () =>
      lazy(() => {
        if (measure?.model?.includes("QDM")) {
          return import("./riskAdjustment/qdm/RiskAdjustment");
        }
        if (measure?.model?.includes("QI-Core")) {
          return import("./riskAdjustment/qiCore/RiskAdjustment");
        } else {
          return import("./riskAdjustment/EmptyRiskAdjustment");
        }
      }),
    [measure?.model]
  );

  // this works for a specific QDM version
  // If we specify weather the string contains QDM, we can have a more flexible check. All QDM versions will trigger that render, then we can handle differently
  const isQDM = ((): boolean => {
    // return measure?.model === Model.QDM_5_6;
    return measure?.model.includes("QDM");
  })();

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

  /* This useEffect generates information required for left side nav bar
   * If a measure doesn't have any groups, then a new one is added. */
  useEffect(() => {
    const measureGroups =
      measure?.groups && measure.groups.length > 0
        ? measure.groups?.map((_group, id) => ({
            title: `Criteria ${id + 1}`,
            href: groupsBaseUrl + "/" + (id + 1),
            dataTestId: `leftPanelMeasureInformation-MeasureGroup${id + 1}`,
            groupPopulated: true,
          }))
        : [
            {
              title: "Criteria 1",
              href: groupsBaseUrl + "/1",
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

  // lets dynamically load our measureGroups component based on weather it's QDM or QICore
  // this needs to be memoized as it loses state otherwise and refreshes on change

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

  const checkBaseConfigPopulated = () => {
    if (measure?.model.includes("QDM")) {
      return measure?.baseConfigurationTypes?.length > 0;
    }
    return false;
  };

  const checkReporting = () => {
    if (
      measure?.improvementNotation &&
      measure?.improvementNotationDescription &&
      measure?.rateAggregation
    ) {
      return COMPLETE;
    } else {
      if (
        !measure?.improvementNotation &&
        !measure?.improvementNotationDescription &&
        !measure?.rateAggregation
      ) {
        return NONE;
      } else {
        return INCOMPLETE;
      }
    }
  };

  const checkSupplementalData = () => {
    if (
      measure?.supplementalData?.length > 0 &&
      measure?.supplementalDataDescription
    ) {
      return COMPLETE;
    } else {
      if (
        measure?.supplementalData?.length == 0 &&
        !measure?.supplementalDataDescription
      ) {
        return NONE;
      } else {
        return INCOMPLETE;
      }
    }
  };

  const checkRiskAdjustment = () => {
    if (
      measure?.riskAdjustments?.length > 0 &&
      measure?.riskAdjustmentDescription
    ) {
      return COMPLETE;
    } else {
      if (
        measure?.riskAdjustments?.length == 0 &&
        !measure?.riskAdjustmentDescription
      ) {
        return NONE;
      } else {
        return INCOMPLETE;
      }
    }
  };

  return (
    <>
      {/* Status handler for Population Criteria tab */}
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
        {/* path can be independent of nav */}
        {pathname.includes("/base-configuration") && <BaseConfiguration />}

        {/* we will load A measureGroups component*/}
        {pathname.includes("/groups") && (
          <MeasureGroupsComponent
            setIsFormDirty={setIsFormDirty}
            measureGroupNumber={measureGroupNumber}
            setMeasureGroupNumber={setMeasureGroupNumber}
            measureId={measure?.id}
            setAlertMessage={setAlertMessage}
          />
        )}
        {/* what's a better way to say if QDM or QICore?
          To do: Find a more elegant solution for future when we have more than two models to avoid if else if else. */}
        {pathname.includes("reporting") && <QDMReporting />}

        {pathname.includes("/supplemental-data") && (
          <SupplementalDataComponent />
        )}

        {pathname.includes("/risk-adjustment") && <RiskAdjustmentComponent />}
      </div>
    </>
  );
}

export default PopulationCriteriaHome;
