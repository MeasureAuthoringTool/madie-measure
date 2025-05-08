import React, { useEffect, useState } from "react";
import tw from "twin.macro";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import { measureStore, useDocumentTitle } from "@madie/madie-util";
import StewardAndDevelopers from "./stewardAndDevelopers/StewardAndDevelopers";
import ModelAndMeasurementPeriod from "./modelAndMeasurementPeriod/ModelAndMeasurementPeriod";
import "./MeasureDetails.scss";
import EditMeasureDetailsSideNav from "./EditMeasureDetailsSideNav";
import MeasureReferences from "./MeasureReferences/MeasureReferences";
import TransmissionFormat from "./TransmissionFormat/TransmissionFormat";
import MeasureDefinitions from "./MeasureDefinitions/MeasureDefinitions";
import StatusHandler from "./statusHandler/StatusHandler";
const Grid = tw.div`grid grid-cols-6 auto-cols-max gap-4 mx-8 shadow-lg rounded-md border border-slate overflow-hidden bg-white`;
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}

export interface MeasureDetailsProps {
  isQDM: boolean;
  featureFlags;
  errorMessages: Array<string>;
  setErrorMessages: Function;
}

export interface LinkItem {
  title: string;
  href: string;
  dataTestId: string;
  id: string;
  displayCompletedIcon: boolean;
  displayIncompletedIcon?: boolean;
}

export interface Link {
  title: string;
  links: LinkItem[];
}

export default function MeasureDetails(props: MeasureDetailsProps) {
  const { isQDM, featureFlags, errorMessages, setErrorMessages } = props;
  useDocumentTitle("MADiE Edit Measure Details");
  const location = useLocation();
  const { pathname } = location;
  const modelPeriodLink = "model&measurement-period";
  const stewardLink = "measure-steward";
  const descriptionLink = "measure-description";
  const copyrightLink = "measure-copyright";
  const disclaimerLink = "measure-disclaimer";
  const rationaleLink = "measure-rationale";
  const purposeLink = "measure-purpose";
  const guidanceLink = "measure-guidance";
  const clinicalLink = "measure-clinical-recommendation";
  const definitionLink = "measure-definition";
  const referencesLink = "measure-references";
  const transmissionFormat = "transmission-format";
  const detailsLink = "";
  const measureSetLink = "measure-set";
  const measureDefinitionLink = "measure-definition";
  const measureReferencesLink = "measure-references";

  const [measure, setMeasure] = useState<any>(measureStore.state);

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          displayCompletedIcon: !!(
            measure?.measureName &&
            measure?.cqlLibraryName &&
            measure?.ecqmTitle
          ),
          displayIncompletedIcon: !(
            measure?.measureName &&
            measure?.cqlLibraryName &&
            measure?.ecqmTitle
          ),
        },
        {
          title: "Model & Measurement Period",
          href: modelPeriodLink,
          dataTestId: "leftPanelModelAndMeasurementPeriod",
          id: "sideNavMeasureModelAndMeasurementPeriod",
          displayCompletedIcon: !!(
            measure?.measurementPeriodStart && measure?.measurementPeriodEnd
          ),
          displayIncompletedIcon: !(
            measure?.measurementPeriodStart && measure?.measurementPeriodEnd
          )
            ? true
            : false,
        },
        {
          title: "Steward & Developers",
          href: stewardLink,
          dataTestId: "leftPanelMeasureSteward",
          id: "sideNavMeasureSteward",
          displayCompletedIcon: !!(
            measure?.measureMetaData.steward &&
            measure?.measureMetaData.developers
          ),
          displayIncompletedIcon: !(
            measure?.measureMetaData.steward &&
            measure?.measureMetaData.developers
          ),
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
          displayCompletedIcon: !!measure?.measureMetaData.description,
          displayIncompletedIcon: !measure?.measureMetaData.description,
        },
        {
          title: "Rationale",
          href: rationaleLink,
          dataTestId: "leftPanelMeasureRationale",
          id: "sideNavMeasureRationale",
          displayCompletedIcon: !!measure?.measureMetaData.rationale,
        },
        {
          title: "Guidance (Usage)",
          href: guidanceLink,
          dataTestId: "leftPanelMeasureGuidance",
          id: "sideNavMeasureGuidance",
          displayCompletedIcon: !!measure?.measureMetaData.guidance,
        },
        {
          title: "Clinical Recommendation",
          href: clinicalLink,
          dataTestId: "leftPanelMeasureClinicalRecommendation",
          id: "sideNavMeasureClinicalRecommendation",
          displayCompletedIcon:
            !!measure?.measureMetaData.clinicalRecommendation,
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
          displayCompletedIcon: !!measure?.measureMetaData.copyright,
        },
        {
          title: "Disclaimer",
          href: disclaimerLink,
          dataTestId: "leftPanelMeasureDisclaimer",
          id: "sideNavMeasureDisclaimer",
          displayCompletedIcon: !!measure?.measureMetaData.disclaimer,
        },
      ],
    },
  ] as Link[];

  if (isQDM) {
    links[1].links.splice(3, 0, {
      title: "Definition",
      href: definitionLink,
      dataTestId: "leftPanelQDMMeasureDefinition",
      id: "sideNavQDMMeasureDefinition",
      displayCompletedIcon: !!measure?.measureMetaData.definition,
    });

    links[1].links.push({
      title: "References",
      href: referencesLink,
      dataTestId: "leftPanelMeasureReferences",
      id: "sideNavMeasureReferences",
      displayCompletedIcon: measure?.measureMetaData.references?.length > 0,
    });
    links[1].links.push({
      title: "Transmission Format",
      href: transmissionFormat,
      dataTestId: "leftPanelMeasureTransmissionFormat",
      id: "sideNavMeasureTransmissionFormat",
      displayCompletedIcon: !!measure?.measureMetaData.transmissionFormat,
    });
    links[1].links.push({
      title: "Measure Set",
      href: measureSetLink,
      dataTestId: "leftPanelMeasureSet",
      id: "sideNavMeasureSet",
      displayCompletedIcon: !!measure?.measureMetaData.measureSetTitle,
    });
  } else {
    if (featureFlags?.QICoreMeasureDefinitions) {
      links[1].links.push({
        title: "Definition",
        href: measureDefinitionLink,
        dataTestId: "leftPanelQiCoreMeasureDefinition",
        id: "sideNavQiCoreMeasureDefinition",
        displayCompletedIcon:
          !!measure?.measureMetaData.measureDefinitions?.[0]?.term,
      });
    }
    links[1].links.splice(2, 0, {
      title: "Purpose",
      href: purposeLink,
      dataTestId: "leftPanelMeasurePurpose",
      id: "sideNavMeasurePurpose",
      displayCompletedIcon: !!measure?.measureMetaData.purpose,
    });
    if (featureFlags?.QICoreMeasureReferences) {
      links[1].links.splice(links[1].links.length - 1, 0, {
        title: "References",
        href: referencesLink,
        dataTestId: "leftPanelMeasureReferences",
        id: "sideNavMeasureReferences",
        displayCompletedIcon: measure?.measureMetaData.references?.length > 0,
      });
    }
  }
  useEffect(() => {
    setErrorMessages([]);
  }, [pathname, setErrorMessages]);

  return (
    <>
      {/* Status handler for Details tab  */}
      <StatusHandler errorMessages={errorMessages} />
      <Grid>
        <EditMeasureDetailsSideNav links={links} />
        <Routes>
          <Route
            path={detailsLink}
            element={<MeasureInformation setErrorMessages={setErrorMessages} />}
          />
          <Route
            path={modelPeriodLink}
            element={
              <ModelAndMeasurementPeriod setErrorMessages={setErrorMessages} />
            }
          />
          <Route
            path={stewardLink}
            element={
              <StewardAndDevelopers setErrorMessages={setErrorMessages} />
            }
          />
          <Route
            path={descriptionLink}
            element={
              <MeasureMetadata
                required
                measureMetadataId="Description"
                measureMetadataType="Description"
                header="Description"
                setErrorMessages={setErrorMessages}
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
                setErrorMessages={setErrorMessages}
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
                setErrorMessages={setErrorMessages}
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
                setErrorMessages={setErrorMessages}
              />
            }
          />
          {!isQDM && (
            <Route
              path={purposeLink}
              element={
                <MeasureMetadata
                  measureMetadataId="Purpose"
                  measureMetadataType="Purpose"
                  header="Purpose"
                  setErrorMessages={setErrorMessages}
                />
              }
            />
          )}
          <Route
            path={guidanceLink}
            element={
              <MeasureMetadata
                measureMetadataId="Guidance"
                measureMetadataType="Guidance (Usage)"
                header="Guidance (Usage)"
                setErrorMessages={setErrorMessages}
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
                setErrorMessages={setErrorMessages}
              />
            }
          />
          {isQDM && (
            <>
              <Route
                path={transmissionFormat}
                element={
                  <TransmissionFormat setErrorMessages={setErrorMessages} />
                }
              />
              <Route
                path={measureSetLink}
                element={
                  <MeasureMetadata
                    measureMetadataId="MeasureSet"
                    measureMetadataType="Measure Set"
                    header="Measure Set"
                    setErrorMessages={setErrorMessages}
                  />
                }
              />
              <Route
                path={referencesLink}
                element={
                  <MeasureReferences setErrorMessages={setErrorMessages} />
                }
              />

              <Route
                path={definitionLink}
                element={
                  <MeasureMetadata
                    measureMetadataId="Definition"
                    measureMetadataType="Definition"
                    header="Definition"
                    setErrorMessages={setErrorMessages}
                  />
                }
              />
            </>
          )}
          {!isQDM && featureFlags?.QICoreMeasureDefinitions && (
            <>
              <Route
                path={measureDefinitionLink}
                element={
                  <MeasureDefinitions setErrorMessages={setErrorMessages} />
                }
              />
            </>
          )}
          {!isQDM && featureFlags.QICoreMeasureReferences && (
            <>
              <Route
                path={measureReferencesLink}
                element={
                  <MeasureReferences setErrorMessages={setErrorMessages} />
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
