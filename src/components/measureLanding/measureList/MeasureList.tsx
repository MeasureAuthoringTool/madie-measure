import React, { useState, useEffect, useRef, useCallback } from "react";
import "twin.macro";
import "styled-components/macro";
import { Measure, Model } from "@madie/madie-models";
import { useNavigate } from "react-router-dom";
import { Chip, IconButton } from "@mui/material";
import {
  TextField,
  Button,
  Popover,
  Toast,
} from "@madie/madie-design-system/dist/react";

import InvalidTestCaseDialog from "./InvalidTestCaseDialog.tsx/InvalidTestCaseDialog";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";
import CreatVersionDialog from "./createVersionDialog/CreateVersionDialog";
import DraftMeasureDialog from "./draftMeasureDialog/DraftMeasureDialog";
import versionErrorHelper from "../../../utils/versionErrorHelper";
import getModelFamily from "../../../utils/measureModelHelpers";
import _ from "lodash";
import ExportDialog from "./exportDialog/ExportDialog";
import { AxiosResponse } from "axios";

const searchInputStyle = {
  borderRadius: "3px",
  height: 40,
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
    borderColor: "#8C8C8C",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    "&&": {
      borderRadius: "3px",
    },
  },
  "& .MuiInputBase-input": {
    height: 40,
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 1,
      color: "#717171",
    },
  },
};

export default function MeasureList(props: {
  measureList: Measure[];
  setMeasureList;
  setTotalPages;
  setTotalItems;
  setVisibleItems;
  setOffset;
  setInitialLoad;
  activeTab: number;
  searchCriteria: string;
  setSearchCriteria;
  currentLimit: number;
  currentPage: number;
  setErrMsg;
}) {
  const measureServiceApi = useRef(useMeasureServiceApi()).current; //needs to be ref or triggers jest. throws warn
  // CanDraftLookup will be an object who's keys are measureSetIds, to check weather we can draft M
  const [canDraftLookup, setCanDraftLookup] = useState<object>({});

  const buildLookup = useCallback(
    async (measureList) => {
      const measureSetList = measureList.map((m) => m.measureSetId);
      try {
        const results = await measureServiceApi.fetchMeasureDraftStatuses(
          measureSetList
        );
        if (results) {
          setCanDraftLookup(results);
        }
      } catch (e) {
        console.warn("Error fetching draft statuses: ", e);
      }
    },
    [measureServiceApi]
  );
  useEffect(() => {
    if (props.measureList && measureServiceApi) {
      buildLookup(props.measureList);
    }
  }, [props.measureList, measureServiceApi]);

  const navigate = useNavigate();
  // Popover utilities
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMeasure, setSelectedMeasure] = useState<Measure>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // if user can edit and it is a version, then draft button
  const [
    otherSelectOptionPropsForPopOver,
    setOtherSelectOptionPropsForPopOver,
  ] = useState(null);
  const [additionalSelectOptionProps, setAdditionalSelectOptionProps] =
    useState(null);
  const [editViewButtonLabel, setEditViewButtonLabel] = useState<string>(null);

  const targetMeasure = useRef<Measure>();

  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    measureId: "",
  });
  const [versionHelperText, setVersionHelperText] = useState("");
  const [draftMeasureDialog, setDraftMeasureDialog] = useState({
    open: false,
  });
  const handleDialogClose = () => {
    setCreateVersionDialog({
      open: false,
      measureId: "",
    });
    setDraftMeasureDialog({
      open: false,
    });
    setVersionHelperText("");
    setInvalidTestCaseOpen(false);
  };
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };

  const handleClearClick = async (event) => {
    abortController.current = new AbortController();
    props.setSearchCriteria("");
    measureServiceApi
      .fetchMeasures(
        props.activeTab === 0,
        props.currentLimit,
        0,
        abortController.current.signal
      )
      .then((data) => {
        setPageProps(data);
      })
      .catch((error: Error) => {
        props.setInitialLoad(false);
        props.setErrMsg("");
      });
    navigate(`?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`);
  };

  const doSearch = () => {
    abortController.current = new AbortController();
    props.setErrMsg();
    measureServiceApi
      .searchMeasuresByMeasureNameOrEcqmTitle(
        props.activeTab === 0,
        props.currentLimit,
        0,
        props.searchCriteria,
        abortController.current.signal
      )
      .then((data) => {
        setPageProps(data);
      })
      .catch((error: Error) => {
        props.setInitialLoad(false);
        props.setErrMsg(error.message);
      });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (props.searchCriteria) {
      doSearch();
    }

    navigate(`?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`);
  };
  const setPageProps = (data) => {
    if (data) {
      const { content, totalPages, totalElements, numberOfElements, pageable } =
        data;
      props.setTotalPages(totalPages);
      props.setTotalItems(totalElements);
      props.setVisibleItems(numberOfElements);

      props.setMeasureList(content);
      props.setOffset(pageable.offset);
      props.setInitialLoad(false);
    }
  };

  const searchInputProps = {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    ),
    endAdornment: (
      <IconButton
        aria-label="Clear-Search"
        sx={{
          visibility: props.searchCriteria ? "visible" : "hidden",
        }}
        onClick={handleClearClick}
      >
        <ClearIcon />
      </IconButton>
    ),
  };

  useEffect(() => {
    if (selectedMeasure) {
      targetMeasure.current = selectedMeasure;
    }
  }, [selectedMeasure]);
  const featureFlags = useFeatureFlags();
  // put export and version behind a flag for qdm
  const shouldAllowAction = (measure: Measure, flag: boolean) => {
    // pass in current model and barring flag
    // we only want to block in case model === qdm & it's flag is false
    if (measure.model === Model.QDM_5_6 && !flag) {
      return false;
    }
    return true;
  };
  const handlePopOverOpen = async (
    selected: Measure,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setOptionsOpen(true);
    setSelectedMeasure(selected);
    setAnchorEl(event.currentTarget);
    const isSelectedMeasureEditable = checkUserCanEdit(
      selected?.measureSet?.owner,
      selected?.measureSet?.acls
    );
    setCanEdit(isSelectedMeasureEditable);
    setEditViewButtonLabel(
      isSelectedMeasureEditable && selected?.measureMetaData.draft
        ? "Edit"
        : "View"
    );

    let options = [];
    // additional options are outside the edit flag
    let additionalOptions = [];
    // always on if feature
    const exportButton = {
      label: "Export",
      toImplementFunction: exportMeasure,
      dataTestId: `export-measure-${selected?.id}`,
    };
    if (shouldAllowAction(selected, featureFlags.qdmExport)) {
      additionalOptions.push(exportButton);
    }
    // no longer an always on if feature
    if (
      selected.measureMetaData.draft &&
      (selected.model.startsWith("QI") ||
        (selected.model.startsWith("QDM") &&
          !featureFlags.enableQdmRepeatTransfer))
    ) {
      options.push({
        label: "Version",
        toImplementFunction: checkCreateVersion,
        dataTestId: `create-version-measure-${selected?.id}`,
      });
      // draft should only be available if no other measureSet is in draft, by call
    }
    if (canDraftLookup[selected?.measureSetId]) {
      options.push({
        label: "Draft",
        toImplementFunction: () => setDraftMeasureDialog({ open: true }),
        dataTestId: `draft-measure-${selected?.id}`,
      });
    }
    setAdditionalSelectOptionProps(additionalOptions);
    setOtherSelectOptionPropsForPopOver(options);
  };

  const handleClose = () => {
    setOtherSelectOptionPropsForPopOver(null);
    setOptionsOpen(false);
    setSelectedMeasure(null);
    setAnchorEl(null);
    setCanEdit(false);
  };

  const viewEditRedirect = () => {
    navigate(`/measures/${selectedMeasure?.id}/edit/details`);
    setOptionsOpen(false);
  };

  const [downloadState, setDownloadState] = useState(null); // state of dialog
  const [failureMessage, setFailureMessage] = useState(null); // message to pass to dialog
  // Ref required or value will be lost on all state changes.
  const abortController = useRef(null);

  const downloadZipFile = (
    exportData,
    ecqmTitle,
    model,
    version,
    warn = false
  ) => {
    const url = window.URL.createObjectURL(exportData);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${ecqmTitle}-v${version}-${getModelFamily(model)}.zip`
    );
    document.body.appendChild(link);
    link.click();
    setToastOpen(true);
    setToastType("success");
    setToastMessage("Measure exported successfully");
    setDownloadState(warn ? "warning" : "success");
    document.body.removeChild(link);
  };

  const exportMeasure = async () => {
    setFailureMessage(null);
    setDownloadState("downloading");
    try {
      // we need to generate an abort controller for this call and bind it in the context of our ref
      abortController.current = new AbortController();
      const { ecqmTitle, model, version } = targetMeasure?.current ?? {};
      const { status, data } = await measureServiceApi?.getMeasureExport(
        targetMeasure.current?.id,
        abortController.current.signal
      );

      const warn =
        status === 201 && !targetMeasure?.current?.measureMetaData?.draft;
      downloadZipFile(data, ecqmTitle, model, version, warn);
    } catch (err) {
      const errorStatus = err.response?.status;
      const targetedMeasure = targetMeasure.current;
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
          } = await measureServiceApi?.fetchMeasure(targetMeasure.current?.id);
          const missing = [];
          if (_.isEmpty(cql)) {
            missing.push("Missing CQL");
          }
          if (cqlErrors) {
            missing.push("CQL Contains Errors");
          }
          if (
            (model.startsWith("QI-Core") &&
              !/^(^[A-Z][a-zA-Z0-9]*$)/.test(cqlLibraryName)) ||
            (model.startsWith("QDM") &&
              !/^(^[A-Z][a-zA-Z0-9_]*$)/.test(cqlLibraryName))
          ) {
            missing.push("Measure CQL Library Name is invalid");
          }
          if (!_.isEmpty(errors)) {
            errors.forEach((error) => {
              if (error.startsWith("MISMATCH")) {
                missing.push(error);
              }
            });
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
          if (missing.length <= 0) {
            const message =
              "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";
            setFailureMessage(message);
          } else if (missing.length > 0) {
            setFailureMessage(missing);
          }
        } else {
          const message =
            "Unable to Export measure. Package could not be generated. Please try again and contact the Help Desk if the problem persists.";
          setFailureMessage(message);
        }
      }
    }
  };
  const handleContinueDialog = () => {
    setDownloadState(null);
    setFailureMessage(null);
  };
  const handleCancelDialog = () => {
    abortController.current && abortController.current.abort();
    handleContinueDialog();
  };

  const doUpdateList = () => {
    abortController.current = new AbortController();
    measureServiceApi
      .fetchMeasures(
        props.activeTab === 0,
        props.currentLimit,
        props.currentPage,
        abortController.current.signal
      )
      .then((data) => {
        setPageProps(data);
      })
      .catch((error: Error) => {
        props.setInitialLoad(false);
        props.setErrMsg(error.message);
      });
  };

  const [invalidTestCaseOpen, setInvalidTestCaseOpen] =
    useState<boolean>(false);
  // we need to preserver version type as invalid test case dialog will not be aware of it
  const [versionType, setVersionType] = useState<string>(null);

  const handleCreateError = (error) => {
    const errorData = error?.response;
    setToastOpen(true);
    setLoading(false);
    if (errorData?.status === 400) {
      setToastMessage("Requested measure cannot be versioned");
    } else if (errorData?.status === 403) {
      setToastMessage("User is unauthorized to create a version");
    } else if (errorData?.status === 409) {
      setToastMessage(
        errorData?.data?.message
          ? errorData.data.message
          : "Requested operation could not be completed. Please contact the Help Desk."
      );
    } else {
      setToastMessage(errorData?.message ? errorData.message : "Server error!");
    }
    const message = JSON.parse(errorData?.request?.responseText)?.message;
    if (message) {
      setVersionHelperText(versionErrorHelper(message));
    }
  };

  const createVersion = (versionType: string) => {
    setLoading(true);
    return measureServiceApi
      .createVersion(targetMeasure.current?.id, versionType)
      .then((r) => {
        handleDialogClose();
        setToastOpen(true);
        setToastType("success");
        setLoading(false);
        setToastMessage("New version of measure is Successfully created");
        doUpdateList();
      })
      .catch((error) => {
        handleCreateError(error);
      });
  };

  // given a version and target, check if possible
  const checkCreateVersion = async (versionType: string) => {
    setLoading(true);
    if (
      versionType !== "major" &&
      versionType !== "minor" &&
      versionType !== "patch"
    ) {
      setCreateVersionDialog({
        open: true,
        measureId: targetMeasure.current?.id,
      });
      setOptionsOpen(false);
      setLoading(false);
    } else {
      await measureServiceApi
        .checkValidVersion(targetMeasure.current?.id, versionType)
        .then(async (successResponse) => {
          setLoading(false);
          // if we get a 202, we have invalid test cases, but no other issues so we can create it
          if (successResponse?.status === 202) {
            setVersionType(versionType);
            setInvalidTestCaseOpen(true);
          }
          // we assume standard 200 success case, we create the version
          else {
            createVersion(versionType);
          }
        })
        .catch((error) => {
          handleCreateError(error);
        });
    }
  };

  const draftMeasure = async (measureName: string) => {
    await measureServiceApi
      .draftMeasure(
        targetMeasure.current?.id,
        targetMeasure.current.model,
        measureName
      )
      .then(async () => {
        setOptionsOpen(false);
        handleDialogClose();
        setToastOpen(true);
        setToastType("success");
        setToastMessage("New draft created successfully.");
        doUpdateList();
      })
      .catch((error) => {
        const errorOb = error?.response?.data;
        setToastOpen(true);
        if (errorOb?.message) {
          setToastMessage(errorOb.message);
        } else {
          setToastMessage(
            "An error occurred, please try again. If the error persists, please contact the help desk."
          );
        }
      });
  };

  return (
    <div data-testid="measure-list">
      <div tw="flex flex-col">
        <div tw="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div tw="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div>
              <form onSubmit={handleSubmit}>
                <table
                  style={{ marginLeft: 20, marginTop: 20, marginBottom: 20 }}
                >
                  <thead>
                    <tr>
                      <TextField
                        onChange={(newValue) => {
                          props.setSearchCriteria(newValue.target.value);
                        }}
                        id="searchMeasure"
                        name="searchMeasure"
                        placeholder="Search Measure"
                        type="search"
                        fullWidth
                        data-testid="measure-search-input"
                        label="Filter Measures"
                        variant="outlined"
                        defaultValue={props.searchCriteria}
                        value={props.searchCriteria}
                        inputProps={{
                          "data-testid": "searchMeasure-input",
                          "aria-required": "false",
                        }}
                        InputProps={searchInputProps}
                        sx={searchInputStyle}
                      />
                    </tr>
                  </thead>
                </table>
              </form>
              <table tw="min-w-full" style={{ borderTop: "solid 1px #8c8c8c" }}>
                <thead tw="bg-slate">
                  <tr>
                    <th scope="col" className="col-header">
                      Measure Name
                    </th>
                    <th scope="col" className="col-header">
                      Version
                    </th>
                    <th scope="col" className="col-header">
                      Model
                    </th>
                    <th scope="col" className="col-header">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody data-testid="table-body" className="table-body">
                  {props.measureList?.map((measure, i) => (
                    <tr
                      key={`${measure.id}-${i}`}
                      data-testid="row-item"
                      style={{ borderTop: "solid 1px #8c8c8c" }}
                    >
                      <td tw="w-7/12">{measure.measureName}</td>
                      <td>
                        {measure?.version}
                        {`${measure.measureMetaData?.draft}` === "true" && (
                          <Chip
                            tw="ml-6"
                            className="chip-draft"
                            label="Draft"
                          />
                        )}
                      </td>
                      <td>{measure.model}</td>
                      <td>
                        <Button
                          variant="outline-secondary"
                          name="Select"
                          onClick={(e) => {
                            handlePopOverOpen(measure, e);
                          }}
                          data-testid={`measure-action-${measure.id}`}
                          aria-label={`Measure ${measure?.measureName} version ${measure?.version} draft status ${measure?.measureMetaData?.draft} Select`}
                          role="button"
                          tab-index={0}
                        >
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Popover
                optionsOpen={optionsOpen}
                anchorEl={anchorEl}
                handleClose={handleClose}
                canEdit={canEdit}
                editViewSelectOptionProps={{
                  label: editViewButtonLabel,
                  toImplementFunction: viewEditRedirect,
                  dataTestId: `view-measure-${selectedMeasure?.id}`,
                }}
                otherSelectOptionProps={otherSelectOptionPropsForPopOver}
                additionalSelectOptionProps={additionalSelectOptionProps}
              />
            </div>
            <Toast
              toastKey="measure-action-toast"
              aria-live="polite"
              toastType={toastType}
              testId={toastType === "danger" ? "error-toast" : "success-toast"}
              closeButtonProps={{
                "data-testid": "close-toast-button",
              }}
              open={toastOpen}
              message={toastMessage}
              onClose={onToastClose}
              autoHideDuration={6000}
            />
            <InvalidTestCaseDialog
              open={invalidTestCaseOpen}
              onContinue={createVersion}
              onClose={handleDialogClose}
              versionType={versionType}
              loading={loading}
            />
            <CreatVersionDialog
              currentVersion={targetMeasure?.current?.version}
              open={createVersionDialog.open}
              onClose={handleDialogClose}
              onSubmit={checkCreateVersion}
              versionHelperText={versionHelperText}
              loading={loading}
              measureId={targetMeasure?.current?.id}
            />
            <DraftMeasureDialog
              open={draftMeasureDialog.open}
              onClose={handleDialogClose}
              onSubmit={draftMeasure}
              measure={targetMeasure.current}
            />
          </div>
        </div>
      </div>
      <ExportDialog
        failureMessage={failureMessage}
        measureName={targetMeasure?.current?.measureName}
        downloadState={downloadState}
        open={Boolean(downloadState)}
        handleContinueDialog={handleContinueDialog}
        handleCancelDialog={handleCancelDialog}
      />
    </div>
  );
}
