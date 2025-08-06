import React, { useEffect, useState, useRef } from "react";
import tw from "twin.macro";
import {
  Routes,
  Route,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import MeasureInformation from "./measureInformation/MeasureInformation";
import MeasureMetadata from "./measureMetadata/MeasureMetadata";
import {
  checkUserCanEdit,
  measureStore,
  useDocumentTitle,
} from "@madie/madie-util";
import StewardAndDevelopers from "./stewardAndDevelopers/StewardAndDevelopers";
import ModelAndMeasurementPeriod from "./modelAndMeasurementPeriod/ModelAndMeasurementPeriod";
import "./MeasureDetails.scss";
import EditMeasureDetailsSideNav from "./EditMeasureDetailsSideNav";
import MeasureReferences from "./MeasureReferences/MeasureReferences";
import TransmissionFormat from "./TransmissionFormat/TransmissionFormat";
import MeasureDefinitions from "./MeasureDefinitions/MeasureDefinitions";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
const Grid = tw.div`grid grid-cols-6 auto-cols-max gap-4 mx-8 shadow-lg rounded-md border border-slate overflow-hidden bg-white`;
export interface RouteHandlerState {
  canTravel: boolean;
  pendingRoute: string;
}

export interface MeasureDetailsProps {
  setErrorMessage: Function;
  isQDM: boolean;
  featureFlags;
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
  const { setErrorMessage, isQDM, featureFlags } = props;
  const { measureId } = useParams();
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
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
  const canEdit: boolean = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
  useEffect(() => {
    // Subscribe to store
    const subscription = measureStore.subscribe(setMeasure);
    const handleUnload = () => {
      measureServiceApi.unlockMeasure(measureId);
    };
    // Lock the measure if the Locking feature is enabled
    if (featureFlags?.Locking && canEdit) {
      window.addEventListener("beforeunload", handleUnload);
      console.log("measureId", measureId);
      measureServiceApi
        .updateMeasureLock(measureId)
        .then(() => {})
        .catch((e) => {
          console.error("Error locking Measure:", e);
        });
    }
    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      if (featureFlags?.Locking && canEdit) {
        window.removeEventListener("beforeunload", handleUnload);
        measureServiceApi.unlockMeasure(measureId);
      }
    };
  }, [measureServiceApi, measureId, featureFlags?.Locking, canEdit]);

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
    links[1].links.push({
      title: "Definition",
      href: measureDefinitionLink,
      dataTestId: "leftPanelQiCoreMeasureDefinition",
      id: "sideNavQiCoreMeasureDefinition",
      displayCompletedIcon:
        !!measure?.measureMetaData.measureDefinitions?.[0]?.term,
    });
    links[1].links.splice(2, 0, {
      title: "Purpose",
      href: purposeLink,
      dataTestId: "leftPanelMeasurePurpose",
      id: "sideNavMeasurePurpose",
      displayCompletedIcon: !!measure?.measureMetaData.purpose,
    });
    links[1].links.splice(links[1].links.length - 1, 0, {
      title: "References",
      href: referencesLink,
      dataTestId: "leftPanelMeasureReferences",
      id: "sideNavMeasureReferences",
      displayCompletedIcon: measure?.measureMetaData.references?.length > 0,
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
          {!isQDM && (
            <Route
              path={purposeLink}
              element={
                <MeasureMetadata
                  measureMetadataId="Purpose"
                  measureMetadataType="Purpose"
                  header="Purpose"
                  setErrorMessage={setErrorMessage}
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
          {!isQDM && (
            <>
              <Route
                path={measureDefinitionLink}
                element={
                  <MeasureDefinitions setErrorMessage={setErrorMessage} />
                }
              />
            </>
          )}
          {!isQDM && (
            <>
              <Route
                path={measureReferencesLink}
                element={
                  <MeasureReferences setErrorMessage={setErrorMessage} />
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
