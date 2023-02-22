import React, { useState, useEffect, useRef } from "react";
import "twin.macro";
import "styled-components/macro";
import { Measure } from "@madie/madie-models";
import { useHistory } from "react-router-dom";
import { Chip, IconButton } from "@mui/material";
import {
  TextField,
  Button,
  Popover,
  Toast,
} from "@madie/madie-design-system/dist/react";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import JSzip from "jszip";
import { saveAs } from "file-saver";
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";
import CreatVersionDialog from "../createVersionDialog/CreateVersionDialog";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import DraftMeasureDialog from "../draftMeasureDialog/DraftMeasureDialog";
import versionErrorHelper from "../../utils/versionErrorHelper";
import JSZip from "jszip";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const searchInputStyle = {
  borderRadius: "3px",
  height: 40,
  border: "1px solid #DDDDDD",
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
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
      opacity: 0.6,
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
  const history = useHistory();

  // Popover utilities
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMeasure, setSelectedMeasure] = useState<Measure>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  // if user can edit and it is a version, then draft button
  const [
    otherSelectOptionPropsForPopOver,
    setOtherSelectOptionPropsForPopOver,
  ] = useState(null);
  const [additionalSelectOptionProps, setAdditionalSelectOptionProps] =
    useState(null);

  const measureServiceApi = useMeasureServiceApi();
  const featureFlags = useFeatureFlags();
  const exportFeature = !!featureFlags?.export;
  const versioningFeature = !!featureFlags?.measureVersioning;
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
    props.setSearchCriteria("");
    measureServiceApi
      .fetchMeasures(props.activeTab === 0, props.currentLimit, 0)
      .then((data) => {
        setPageProps(data);
      })
      .catch((error: Error) => {
        props.setInitialLoad(false);
        props.setErrMsg("");
      });
    history.push(
      `?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`
    );
  };

  const doSearch = () => {
    measureServiceApi
      .searchMeasuresByMeasureNameOrEcqmTitle(
        props.activeTab === 0,
        props.currentLimit,
        0,
        props.searchCriteria
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

    history.push(
      `?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`
    );
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

  const handleOpen = (
    selected: Measure,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setOptionsOpen(true);
    setSelectedMeasure(selected);
    setAnchorEl(event.currentTarget);
    setCanEdit(checkUserCanEdit(selected?.createdBy, selected?.acls));

    let options = [];
    // additional options are outside the edit flag
    let additionalOptions = [];
    // always on if feature
    if (exportFeature) {
      const exportButton = {
        label: "Export",
        toImplementFunction: zipData,
        dataTestId: `export-measure-${selected?.id}`,
      };
      additionalOptions.push(exportButton);
    }
    // always on if feature
    if (versioningFeature) {
      if (selected.measureMetaData.draft) {
        options.push({
          label: "Version",
          toImplementFunction: createVersion,
          dataTestId: `create-version-measure-${selected?.id}`,
        });
      } else {
        options.push({
          label: "Draft",
          toImplementFunction: () => setDraftMeasureDialog({ open: true }),
          dataTestId: `draft-measure-${selected?.id}`,
        });
      }
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
    history.push(`/measures/${selectedMeasure?.id}/edit/details`);
    setOptionsOpen(false);
  };

  const zipData = async () => {
    try {
      const blobResponse = await measureServiceApi.getZippedMeasureData(
        targetMeasure?.current?.id
      );
      const url = window.URL.createObjectURL(blobResponse);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${targetMeasure.current?.ecqmTitle}-v${targetMeasure.current?.version}-${targetMeasure.current?.model}.zip`
      );
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.log(err.msg);
    }
  };

  const doUpdateList = () => {
    measureServiceApi
      .fetchMeasures(
        props.activeTab === 0,
        props.currentLimit,
        props.currentPage
      )
      .then((data) => {
        setPageProps(data);
      })
      .catch((error: Error) => {
        props.setInitialLoad(false);
        props.setErrMsg(error.message);
      });
  };

  const createVersion = async (versionType: string) => {
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
    } else {
      await measureServiceApi
        .createVersion(targetMeasure.current?.id, versionType)
        .then(async () => {
          handleDialogClose();
          setToastOpen(true);
          setToastType("success");
          setToastMessage("New version of measure is Successfully created");
          doUpdateList();
        })
        .catch((error) => {
          const errorData = error?.response;
          setToastOpen(true);
          if (errorData?.status === 400) {
            setToastMessage("Requested measure cannot be versioned");
          } else if (errorData?.status === 403) {
            setToastMessage("User is unauthorized to create a version");
          } else {
            setToastMessage(
              errorData?.message ? errorData.message : "Server error!"
            );
          }
          const message = JSON.parse(errorData?.request?.responseText)?.message;
          if (message) {
            setVersionHelperText(versionErrorHelper(message));
          }
        });
    }
  };

  const draftMeasure = async (measureName: string) => {
    await measureServiceApi
      .draftMeasure(targetMeasure.current?.id, measureName)
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
              <table tw="min-w-full" style={{ borderTop: "solid 1px #DDD" }}>
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
                      style={{ borderBottom: "solid 1px #AAA" }}
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
                            if (exportFeature || versioningFeature) {
                              handleOpen(measure, e);
                            } else {
                              history.push(
                                `/measures/${measure.id}/edit/details`
                              );
                            }
                          }}
                          data-testid={
                            exportFeature || versioningFeature
                              ? `measure-action-${measure.id}`
                              : `edit-measure-${measure.id}`
                          }
                        >
                          {exportFeature || versioningFeature
                            ? "Select"
                            : "View"}
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
                  label: "View",
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
            <CreatVersionDialog
              open={createVersionDialog.open}
              onClose={handleDialogClose}
              onSubmit={createVersion}
              versionHelperText={versionHelperText}
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
    </div>
  );
}
