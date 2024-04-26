import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import { useDocumentTitle, useFeatureFlags } from "@madie/madie-util";
import StewardAndDevelopers from "./stewardAndDevelopers/StewardAndDevelopers";
import ModelAndMeasurementPeriod from "./modelAndMeasurementPeriod/ModelAndMeasurementPeriod";
import "./MeasureDetails.scss";
import EditMeasureDetailsSideNav from "./EditMeasureDetailsSideNav";
import MeasureReferences from "./MeasureReferences/MeasureReferences";
import TransmissionFormat from "./TransmissionFormat/TransmissionFormat";
const Grid = tw.div`grid grid-cols-6 auto-cols-max gap-4 mx-8 shadow-lg rounded-md border border-slate overflow-hidden bg-white`;
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}

export interface MeasureDetailsProps {
  setErrorMessage: Function;
  isQDM: boolean;
}
export default function MeasureDetails(props: MeasureDetailsProps) {
  const { setErrorMessage, isQDM } = props;
  useDocumentTitle("MADiE Edit Measure Details");
  const location = useLocation();
  const { pathname } = location;
  const modelPeriodLink = `model&measurement-period`;
  const stewardLink = `measure-steward`;
  const descriptionLink = `measure-description`;
  const copyrightLink = `measure-copyright`;
  const disclaimerLink = `measure-disclaimer`;
  const rationaleLink = `measure-rationale`;
  const guidanceLink = `measure-guidance`;
  const clinicalLink = `measure-clinical-recommendation`;
  const definitionLink = `measure-definition`;
  const referencesLink = `measure-references`;
  const transmissionFormat = `transmission-format`;
  const detailsLink = "";
  const measureSetLink = `measure-set`;

  const links = [
    // General Information
    {
      title: "General Information",
      links: [
        {
          title: "Name, Version & ID",
          href: detailsLink,
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
      ],
    },
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
  const featureFlags = useFeatureFlags();
  if (isQDM) {
    links[1].links.splice(3, 0, {
      title: "Definition",
      href: definitionLink,
      dataTestId: "leftPanelQDMMeasureDefinition",
      id: "sideNavQDMMeasureDefinition",
    });

    links[1].links.push({
      title: "References",
      href: referencesLink,
      dataTestId: "leftPanelMeasureReferences",
      id: "sideNavMeasureReferences",
    });
    links[1].links.push({
      title: "Transmission Format",
      href: transmissionFormat,
      dataTestId: "leftPanelMeasureTransmissionFormat",
      id: "sideNavMeasureTransmissionFormat",
    });
    links[1].links.push({
      title: "Measure Set",
      href: measureSetLink,
      dataTestId: "leftPanelMeasureSet",
      id: "sideNavMeasureSet",
    });
  }
  useEffect(() => {
    setErrorMessage("");
  }, [pathname, setErrorMessage]);

  return (
    <>
      <Grid>
        <EditMeasureDetailsSideNav links={links} />
        <Routes>
          <Route
            path={detailsLink}
            element={<MeasureInformation setErrorMessage={setErrorMessage} />}
          />
          <Route
            path={modelPeriodLink}
            element={
              <ModelAndMeasurementPeriod setErrorMessage={setErrorMessage} />
            }
          />
          <Route
            path={stewardLink}
            element={<StewardAndDevelopers setErrorMessage={setErrorMessage} />}
          />
          <Route
            path={descriptionLink}
            element={
              <MeasureMetadata
                required
                measureMetadataId="Description"
                measureMetadataType="Description"
                header="Description"
                setErrorMessage={setErrorMessage}
              />
            }
          />
          <Route
            path={copyrightLink}
            element={
              <MeasureMetadata
                measureMetadataId="Copyright"
                measureMetadataType="Copyright"
                header="Copyright"
                setErrorMessage={setErrorMessage}
              />
            }
          />
          <Route
            path={disclaimerLink}
            element={
              <MeasureMetadata
                measureMetadataId="Disclaimer"
                measureMetadataType="Disclaimer"
                header="Disclaimer"
                setErrorMessage={setErrorMessage}
              />
            }
          />
          <Route
            path={rationaleLink}
            element={
              <MeasureMetadata
                measureMetadataId="Rationale"
                measureMetadataType="Rationale"
                header="Rationale"
                setErrorMessage={setErrorMessage}
              />
            }
          />
          <Route
            path={guidanceLink}
            element={
              <MeasureMetadata
                measureMetadataId="Guidance"
                measureMetadataType="Guidance (Usage)"
                header="Guidance (Usage)"
                setErrorMessage={setErrorMessage}
              />
            }
          />
          <Route
            path={clinicalLink}
            element={
              <MeasureMetadata
                measureMetadataId="ClinicalRecommendation"
                measureMetadataType="Clinical Recommendation Statement"
                header="Clinical Recommendation"
                setErrorMessage={setErrorMessage}
              />
            }
          />
          {isQDM && (
            <>
              <Route
                path={transmissionFormat}
                element={
                  <TransmissionFormat setErrorMessage={setErrorMessage} />
                }
              />
              <Route
                path={measureSetLink}
                element={
                  <MeasureMetadata
                    measureMetadataId="MeasureSet"
                    measureMetadataType="Measure Set"
                    header="Measure Set"
                    setErrorMessage={setErrorMessage}
                  />
                }
              />
              <Route
                path={referencesLink}
                element={
                  <MeasureReferences setErrorMessage={setErrorMessage} />
                }
              />

              <Route
                path={definitionLink}
                element={
                  <MeasureMetadata
                    measureMetadataId="Definition"
                    measureMetadataType="Definition"
                    header="Definition"
                    setErrorMessage={setErrorMessage}
                  />
                }
              />
            </>
          )}
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </Grid>
    </>
  );
}
