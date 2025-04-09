import _ from "lodash";
import { MeasureScoring, Model } from "@madie/madie-models";
import getModelFamily from "./measureModelHelpers";

export const EXPORT_FAILURE_MESSAGE =
  "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";

export const downloadZipFile = (
  exportData,
  ecqmTitle,
  model,
  version,
  warn = false,
  setToastOpen,
  setToastType,
  setToastMessage,
  setDownloadState
) => {
  const url = window.URL.createObjectURL(exportData);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${_.trim(ecqmTitle)}-v${version}-${getModelFamily(model)}.zip`
  );
  document.body.appendChild(link);
  link.click();
  setToastOpen(true);
  setToastType("success");
  setToastMessage("Measure exported successfully");
  setDownloadState(warn ? "warning" : "success");
  document.body.removeChild(link);
};

export const exportMeasure = async (
  setFailureMessage,
  setDownloadState,
  abortController,
  measure,
  measureServiceApi,
  setToastOpen,
  setToastType,
  setToastMessage,
  elmErrorSeverity
) => {
  setFailureMessage(null);
  setDownloadState("downloading");
  try {
    // we need to generate an abort controller for this call and bind it in the context of our ref
    abortController.current = new AbortController();
    const { ecqmTitle, model, version } = measure ?? {};
    const { status, data } = await measureServiceApi?.getMeasureExport(
      measure.id,
      elmErrorSeverity,
      abortController.current.signal
    );
    const warn = status === 201 && !measure?.measureMetaData?.draft;
    downloadZipFile(
      data,
      ecqmTitle,
      model,
      version,
      warn,
      setToastOpen,
      setToastType,
      setToastMessage,
      setDownloadState
    );
  } catch (err) {
    const errorStatus = err.response?.status;
    if (err.message === "canceled") {
      setToastOpen(false);
      setDownloadState(null);
    } else {
      setToastType("danger");
      setDownloadState("failure");
      if (errorStatus === 409) {
        const {
          cql,
          cqlErrors,
          errors,
          groups,
          measureMetaData,
          cqlLibraryName,
          model,
          baseConfigurationTypes,
        } = measure;
        const missing = [];
        if (_.isEmpty(cql)) {
          missing.push("Missing CQL");
        }
        if (cqlErrors) {
          missing.push("CQL Contains Errors");
        }
        if (!_.isEmpty(errors)) {
          errors.forEach((error) => {
            if (error.startsWith("MISMATCH_CQL_POPULATION_RETURN_TYPES")) {
              missing.push("CQL Populations Return Types are invalid");
            } else if (error.startsWith("MISMATCH_CQL_RISK_ADJUSTMENT")) {
              missing.push("CQL Risk Adjustment are invalid");
            } else if (error.startsWith("MISMATCH_CQL_SUPPLEMENTAL_DATA")) {
              missing.push("CQL Supplemental Data Elements are invalid");
            }
          });
        }
        if (
          (model.startsWith("QI-Core") &&
            !/^(^[A-Z][a-zA-Z0-9]*$)/.test(cqlLibraryName)) ||
          (model.startsWith("QDM") &&
            !/^(^[A-Z][a-zA-Z0-9_]*$)/.test(cqlLibraryName)) ||
          cqlLibraryName == null ||
          cqlLibraryName.length > 64
        ) {
          missing.push("Measure CQL Library Name is invalid");
        }
        if (_.isEmpty(groups)) {
          missing.push("Missing Population Criteria");
        }
        if (_.isEmpty(measureMetaData.developers)) {
          missing.push("Missing Measure Developers");
        }
        if (_.isEmpty(measureMetaData.steward)) {
          missing.push("Missing Steward");
        }
        if (_.isEmpty(measureMetaData.description)) {
          missing.push("Missing Description");
        }
        if (
          model === Model.QICORE &&
          groups &&
          groups.filter(
            (group) =>
              group.measureGroupTypes === null ||
              _.isEmpty(group.measureGroupTypes)
          ).length > 0
        ) {
          missing.push("At least one Population Criteria is missing Type");
        }
        if (model === Model.QDM_5_6 && _.isEmpty(baseConfigurationTypes)) {
          missing.push("Measure Type is required");
        }
        if (
          (model === Model.QICORE || model === Model.QICORE_6_0_0) &&
          measureMetaData.draft
        ) {
          if (
            groups?.some(
              (group) =>
                _.isEmpty(group.improvementNotation) &&
                group.scoring !== MeasureScoring.COHORT
            )
          ) {
            missing.push(
              "At least one Population Criteria is missing Improvement Notation"
            );
          }
        }
        if (missing.length <= 0) {
          setFailureMessage(EXPORT_FAILURE_MESSAGE);
        } else if (missing.length > 0) {
          setFailureMessage(missing);
        }
        // we send a custom error here. but it's type blob. we decode it here.
      } else if (errorStatus === 400 || errorStatus === 404) {
        if (err.response?.data instanceof Blob) {
          const errorText = await err.response.data.text();
          try {
            const errorJson = JSON.parse(errorText);
            setFailureMessage(errorJson?.message);
          } catch (jsonErr) {
            setFailureMessage(EXPORT_FAILURE_MESSAGE);
          }
        } else {
          setFailureMessage(EXPORT_FAILURE_MESSAGE);
        }
      } else {
        setFailureMessage(EXPORT_FAILURE_MESSAGE);
      }
    }
  }
};
