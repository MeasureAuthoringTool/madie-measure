import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { IconButton, MenuItem, Tooltip } from "@mui/material";
import {
  Select,
  TextField,
  Popover,
} from "@madie/madie-design-system/dist/react";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@material-ui/core/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useFormik } from "formik";
import queryString from "query-string";
import { useNavigate, useLocation } from "react-router-dom";
import { useFeatureFlags } from "@madie/madie-util";
import { blue, grey, red } from "@mui/material/colors";
import { TestCase } from "@madie/madie-models";

interface ActionCenterProps {
  onSubmit?: any;
  selectedTestCases: any;
  canEdit: boolean;
  isQDM: boolean;
  onCloneTestCase?: (testCase: TestCase) => void;
  exportTestCases?: Function;
  onExportQRDA?: Function;
  onExportExcel?: Function;
  measureId?: string;
  exportOptionsOpen?: boolean;
  setExportOptionsOpen?: Function;
}

const filterByOptions = ["Case #", "Status", "Group", "Title", "Description"];

export default function ActionCenter(props: ActionCenterProps) {
  const {
    selectedTestCases,
    canEdit,
    isQDM,
    onCloneTestCase,
    exportTestCases,
    onExportQRDA,
    onExportExcel,
    measureId,
    exportOptionsOpen,
    setExportOptionsOpen,
  } = props;

  const [disableDeleteBtn, setDisableDeleteBtn] = useState<boolean>(true);
  const [disableCloneBtn, setDisableCloneBtn] = useState<boolean>(true);
  const [disableExportBtn, setDisableExportBtn] = useState<boolean>(true);

  useEffect(() => {
    deleteButtonCheck();
    cloneButtonCheck();
    exportButtonCheck();
  }, [selectedTestCases, canEdit, isQDM]);

  const { search } = useLocation();
  let navigate = useNavigate();
  const featureFlags = useFeatureFlags();
  const values = queryString.parse(search);

  // init against URL
  const formik = useFormik({
    initialValues: {
      filterBy: values.filter ? values.filter : "",
      searchValue: values.search ? values.search : "",
    },
    enableReinitialize: true,
    onSubmit: async (formValues) => {
      props.onSubmit(formValues);
    },
  });

  const createEncodedQuery = (values) => {
    const filterEncoded = encodeURIComponent(values.filterBy);
    const searchEncoded = encodeURIComponent(values.searchValue);
    return `?filter=${filterEncoded}&search=${searchEncoded}&page=1&limit=${
      values.limit || 10
    }`;
  };

  const handleNavigate = () => {
    navigate(createEncodedQuery(formik.values));
  };

  const handleClearClick = () => {
    const testCasePageOptions = JSON.parse(
      window.localStorage.getItem("testCasesPageOptions")
    );
    localStorage.setItem(
      "testCasesPageOptions",
      JSON.stringify({
        page: 1,
        limit: testCasePageOptions?.limit ? testCasePageOptions.limit : 10,
        filter: "",
        search: "",
      })
    );
    navigate(window.location.pathname);
  };

  const deleteButtonCheck = () => {
    if (canEdit && selectedTestCases?.length == 1) {
      setDisableDeleteBtn(false);
    } else {
      setDisableDeleteBtn(true);
    }
  };

  const cloneButtonCheck = () => {
    if (
      canEdit &&
      selectedTestCases?.length == 1 &&
      selectedTestCases[0]?.validResource
    ) {
      setDisableCloneBtn(false);
    } else {
      setDisableCloneBtn(true);
    }
  };

  const exportButtonCheck = () => {
    if (isQDM) {
      if (
        selectedTestCases?.length > 0 &&
        selectedTestCases?.some(
          (testCase) => testCase?.executionStatus !== "NA"
        )
      ) {
        setDisableExportBtn(false);
      } else {
        setDisableExportBtn(true);
      }
    } else {
      if (selectedTestCases?.length > 0) {
        setDisableExportBtn(false);
      } else {
        setDisableExportBtn(true);
      }
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const handleClose = () => {
    setExportOptionsOpen(false);
    setAnchorEl(null);
  };

  return (
    <form onSubmit={formik.handleSubmit}>
      <div tw="flex py-4 justify-between items-center">
        <div tw="flex w-1/2 pr-4">
          <div tw="w-1/2 pr-2">
            <Select
              label="Filter By"
              id="filter-by-select"
              data-testid="filter-by-select"
              inputProps={{ "data-testid": "filter-by-select-input" }}
              placeHolder={{ name: "Filter By", value: "" }}
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              size="small"
              name="filterBy"
              value={formik.values.filterBy}
              onChange={formik.handleChange}
              options={filterByOptions
                ?.map((option) => {
                  return (
                    <MenuItem
                      key={option}
                      value={option}
                      data-testid={`filter-by-${option}`}
                    >
                      {option}
                    </MenuItem>
                  );
                })
                .concat(
                  <MenuItem key="-" value="" data-testid={`filter-by--`}>
                    -
                  </MenuItem>
                )}
            />
          </div>
          <div tw="w-1/2 pl-2">
            <TextField
              id="search"
              tw="w-full"
              label="Search"
              placeholder="Search"
              inputProps={{
                "data-testid": "test-case-list-search-input",
              }}
              data-testid="test-case-list-search"
              name="searchValue"
              value={formik.values.searchValue}
              onChange={formik.handleChange}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleNavigate();
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      data-testid="test-cases-trigger-search"
                      onClick={handleNavigate}
                      style={{ cursor: "pointer" }}
                    >
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment
                      data-testid="test-cases-clear-search"
                      position="end"
                      style={{ cursor: "pointer" }}
                      onClick={handleClearClick}
                    >
                      <IconButton>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
        </div>

        {/* Action Buttons (Delete, Clone, Export) */}
        {featureFlags.TestCaseListActionCenter && (
          <div tw="flex items-center">
            {canEdit && (
              <div tw="flex items-center">
                <Tooltip
                  data-testid="delete-tooltip"
                  title={
                    disableDeleteBtn
                      ? "Select test case to delete"
                      : "Delete test case"
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <IconButton
                      onClick={() => {}}
                      disabled={disableDeleteBtn}
                      data-testid="delete-action-btn"
                    >
                      <DeleteOutlinedIcon
                        data-testid={`delete-action-icon`}
                        sx={
                          disableDeleteBtn
                            ? { color: grey[500] }
                            : { color: red[500] }
                        }
                      />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip
                  data-testid="clone-tooltip"
                  title={
                    disableCloneBtn
                      ? "Select a valid test case to clone"
                      : "Clone test case"
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <IconButton
                      onClick={(e) => {
                        onCloneTestCase(selectedTestCases?.[0]);
                      }}
                      disabled={disableCloneBtn}
                      data-testid="clone-action-btn"
                    >
                      <LibraryAddIcon
                        data-testid={`clone-action-icon`}
                        sx={
                          disableCloneBtn
                            ? { color: grey[500] }
                            : { color: blue[700] }
                        }
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
            )}

            <Tooltip
              data-testid="export-tooltip"
              title={
                disableExportBtn
                  ? isQDM
                    ? "Test cases must be executed prior to exporting."
                    : "Select test cases to export"
                  : "Export test cases"
              }
              placement="top"
              arrow
            >
              <span>
                <IconButton
                  disabled={disableExportBtn}
                  data-testid="export-action-btn"
                >
                  <FileUploadOutlinedIcon
                    data-testid={`export-action-icon`}
                    onClick={(event) => {
                      event.preventDefault();
                      setAnchorEl(event.currentTarget);
                      setExportOptionsOpen(true);
                    }}
                    sx={
                      disableExportBtn
                        ? { color: grey[500] }
                        : { color: blue[700] }
                    }
                  />
                  {!isQDM && (
                    <Popover
                      optionsOpen={exportOptionsOpen}
                      anchorEl={anchorEl}
                      handleClose={handleClose}
                      canEdit={canEdit}
                      additionalSelectOptionProps={[
                        {
                          label: "Transaction Bundle",
                          dataTestId: `export-transaction-bundle`,
                          toImplementFunction: () => {
                            exportTestCases("TRANSACTION");
                          },
                        },
                        {
                          label: "Collection Bundle",
                          dataTestId: `export-collection-bundle`,
                          toImplementFunction: () => {
                            exportTestCases("COLLECTION");
                          },
                        },
                      ]}
                    />
                  )}
                  {isQDM && (
                    <Popover
                      optionsOpen={exportOptionsOpen}
                      anchorEl={anchorEl}
                      handleClose={handleClose}
                      canEdit={canEdit}
                      additionalSelectOptionProps={[
                        {
                          label: "QRDA",
                          toImplementFunction: onExportQRDA,
                          dataTestId: `export-qrda-${measureId}`,
                        },
                        {
                          label: "Excel",
                          toImplementFunction: onExportExcel,
                          dataTestId: `export-excel-${measureId}`,
                        },
                      ]}
                    />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </div>
        )}
      </div>
    </form>
  );
}
