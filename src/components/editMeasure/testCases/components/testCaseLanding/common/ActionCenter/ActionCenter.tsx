import React, { useEffect, useRef, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import {
  ClickAwayListener,
  Grow,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import { Select, TextField } from "@madie/madie-design-system/dist/react";
import SearchIcon from "@mui/icons-material/Search";

import ClearIcon from "@mui/icons-material/Clear";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useFormik } from "formik";
import queryString from "query-string";
import { useNavigate, useLocation } from "react-router-dom";
import { useFeatureFlags } from "@madie/madie-util";
import { blue, grey, red } from "@mui/material/colors";
import { TestCase } from "@madie/madie-models";
import { Icon } from "@iconify-icon/react";
import { MakeJsonMatchUiIcon } from "./MakeJsonMatchUiIcon";

interface ActionCenterProps {
  onSubmit?: any;
  selectedTestCases: any;
  canEdit: boolean;
  isQDM: boolean;
  setDeleteDialogModalOpen?: Function;
  setShiftDatesDialogModalOpen?: Function;
  setMakeJsonMatchUiDialogOpen?: Function;
  onCloneTestCase?: (testCase: TestCase) => void;
  exportTestCases?: Function;
  onExportQRDA?: Function;
  onExportExcel?: Function;
  measureId?: string;
  displayTestCaseCopyDialog?: Function;
  executeAllTestCases?: boolean;
  isDraft?;
}

const filterByOptions = ["Case #", "Status", "Group", "Title", "Description"];

export default function ActionCenter(props: ActionCenterProps) {
  const {
    selectedTestCases,
    canEdit,
    isQDM,
    onCloneTestCase,
    setDeleteDialogModalOpen,
    setShiftDatesDialogModalOpen,
    setMakeJsonMatchUiDialogOpen,
    exportTestCases,
    onExportQRDA,
    onExportExcel,
    measureId,
    displayTestCaseCopyDialog,
    executeAllTestCases,
    isDraft,
  } = props;

  const [exportMenuOpen, setExportMenuOpen] = useState<boolean>(false);
  const [disableDeleteBtn, setDisableDeleteBtn] = useState<boolean>(true);
  const [disableShiftDatesBtn, setDisableShiftDatesBtn] =
    useState<boolean>(true);
  const [disableCloneBtn, setDisableCloneBtn] = useState<boolean>(true);
  const [disableExportBtn, setDisableExportBtn] = useState<boolean>(true);
  const [disableCopyBtn, setDisableCopyBtn] = useState<boolean>(true);
  const [disableMakeJsonMatchUiBtn, setDisableMakeJsonMatchUiBtn] =
    useState<boolean>(true);
  const [disabledDeleteBtnMessage, setDisabledDeleteBtnMessage] = useState<
    string | undefined
  >();
  const [cloneTooltipBtnMessage, setCloneTooltipBtnMessage] = useState<string>(
    "Select a valid test case to clone"
  );
  const [makeJsonMatchUiTooltipMessage, setMakeJsonMatchUiTooltipMessage] =
    useState<string>(
      "Select a test case to make JSON (family/given) match UI (group/title)"
    );

  useEffect(() => {
    deleteButtonCheck();
    shiftDatesButtonCheck();
    cloneButtonCheck();
    exportButtonCheck();
    copyButtonCheck();
    makeJsonMatchUiButtonCheck();
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
    if (canEdit && selectedTestCases?.length >= 1) {
      if (!isDraft) {
        const hasCreatedBeforeVersioning = selectedTestCases.some(
          (testCase) => testCase.createdBeforeVersioning === true
        );
        setDisableDeleteBtn(hasCreatedBeforeVersioning);
        setDisabledDeleteBtnMessage(
          "Test cases added prior to versioning cannot be deleted"
        );
      } else {
        setDisableDeleteBtn(false);
      }
    } else {
      setDisabledDeleteBtnMessage("Select a test case to delete");
      setDisableDeleteBtn(true);
    }
  };

  const shiftDatesButtonCheck = () => {
    if (canEdit && selectedTestCases?.length >= 1) {
      setDisableShiftDatesBtn(false);
    } else {
      setDisableShiftDatesBtn(true);
    }
  };

  const cloneButtonCheck = () => {
    if (
      canEdit &&
      selectedTestCases?.length === 1 &&
      selectedTestCases[0]?.validResource
    ) {
      const testCaseTitle = selectedTestCases[0].title;

      if (testCaseTitle.length >= 226) {
        setDisableCloneBtn(true);
        setCloneTooltipBtnMessage("The test case title is too long to clone");
      } else {
        setDisableCloneBtn(false);
        setCloneTooltipBtnMessage("Clone test case");
      }
    } else {
      setDisableCloneBtn(true);
      setCloneTooltipBtnMessage("Select a valid test case to clone");
    }
  };

  const exportButtonCheck = () => {
    if (isQDM) {
      if (executeAllTestCases) {
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

  const copyButtonCheck = () => {
    if (selectedTestCases?.length > 0) {
      setDisableCopyBtn(false);
    } else {
      setDisableCopyBtn(true);
    }
  };

  const makeJsonMatchUiButtonCheck = () => {
    if (selectedTestCases?.length >= 1) {
      setDisableMakeJsonMatchUiBtn(false);
      setMakeJsonMatchUiTooltipMessage(
        "Make JSON (family/given) match UI (group/title)"
      );
    } else {
      setDisableMakeJsonMatchUiBtn(true);
      setMakeJsonMatchUiTooltipMessage(
        "Select a test case to make JSON (family/given) match UI (group/title)"
      );
    }
  };

  const anchorRef = useRef<HTMLButtonElement>(null);
  const handleClose = () => {
    setExportMenuOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setExportMenuOpen(false);
    }
    if (event.key === "Escape") {
      setExportMenuOpen(false);
    }
  }

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

        {/* Action Buttons (Delete, Shift Test Case Dates, Clone, Export) */}
        <div tw="flex items-center">
          {canEdit && (
            <div tw="flex items-center">
              <Tooltip
                data-testid="delete-tooltip"
                title={
                  disableDeleteBtn
                    ? disabledDeleteBtnMessage
                    : "Delete test case"
                }
                placement="top"
                arrow
              >
                <span>
                  <IconButton
                    onClick={() => {
                      setDeleteDialogModalOpen(true);
                    }}
                    disabled={disableDeleteBtn}
                    data-testid="delete-action-btn"
                  >
                    <DeleteOutlinedIcon data-testid={`delete-action-icon`} />
                  </IconButton>
                </span>
              </Tooltip>

              {isDraft && (
                <Tooltip
                  data-testid="shift-test-case-dates-tooltip"
                  title={
                    disableShiftDatesBtn
                      ? "Select test cases to shift test case dates"
                      : "Shift test case dates"
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <IconButton
                      onClick={() => {
                        setShiftDatesDialogModalOpen(true);
                      }}
                      disabled={disableShiftDatesBtn}
                      data-testid="shift-test-case-dates-action-btn"
                    >
                      <EditCalendarOutlinedIcon
                        data-testid={`shift-test-case-dates-action-icon`}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              )}

              <Tooltip
                data-testid="clone-tooltip"
                title={cloneTooltipBtnMessage}
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
                    <LibraryAddIcon data-testid={`clone-action-icon`} />
                  </IconButton>
                </span>
              </Tooltip>

              {featureFlags?.MakeJSONMatchUI && !isQDM && (
                <Tooltip
                  data-testid="make-json-match-ui-tooltip"
                  title={makeJsonMatchUiTooltipMessage}
                  placement="top"
                  arrow
                >
                  <span>
                    <IconButton
                      onClick={() => {
                        setMakeJsonMatchUiDialogOpen(true);
                      }}
                      disabled={disableMakeJsonMatchUiBtn}
                      data-testid="make-json-match-ui-action-btn"
                    >
                      <MakeJsonMatchUiIcon
                        disabled={disableMakeJsonMatchUiBtn}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
            </div>
          )}

          <Tooltip
            data-testid="copy-tooltip"
            title={
              disableCopyBtn
                ? "Select test cases to copy to another measure"
                : "Copy to another measure"
            }
            placement="top"
            arrow
          >
            <span>
              <IconButton
                onClick={() => {
                  displayTestCaseCopyDialog();
                }}
                disabled={disableCopyBtn}
                data-testid="copy-action-btn"
              >
                <Icon
                  icon="fluent:share-screen-start-24-regular"
                  data-testid={`copy-action-icon`}
                  rotate={45}
                />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip
            data-testid="export-tooltip"
            title={
              disableExportBtn
                ? isQDM
                  ? executeAllTestCases
                    ? "Select test cases to export"
                    : "Test cases must be executed prior to exporting."
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
                ref={anchorRef}
                onClick={() => {
                  if (!disableExportBtn) {
                    setExportMenuOpen(true);
                  }
                }}
              >
                <FileUploadOutlinedIcon data-testid="export-action-icon" />
              </IconButton>
            </span>
          </Tooltip>

          <Popper
            open={exportMenuOpen}
            anchorEl={anchorRef.current}
            role={undefined}
            placement="bottom-end"
            transition
          >
            {({ TransitionProps }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin: "right top",
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleClose}>
                    <MenuList
                      autoFocusItem={exportMenuOpen}
                      id="export-menu"
                      onKeyDown={handleListKeyDown}
                    >
                      {!isQDM && [
                        <MenuItem
                          key="transaction-bundle"
                          data-testid="export-transaction-bundle"
                          onClick={() => {
                            exportTestCases("TRANSACTION");
                            handleClose();
                          }}
                        >
                          Transaction Bundle
                        </MenuItem>,
                        <MenuItem
                          key="collection-bundle"
                          data-testid="export-collection-bundle"
                          onClick={() => {
                            exportTestCases("COLLECTION");
                            handleClose();
                          }}
                        >
                          Collection Bundle
                        </MenuItem>,
                      ]}
                      {isQDM && [
                        <MenuItem
                          key="qrda"
                          data-testid={`export-qrda-${measureId}`}
                          onClick={() => {
                            onExportQRDA();
                            handleClose();
                          }}
                        >
                          QRDA
                        </MenuItem>,
                        <MenuItem
                          key="excel"
                          data-testid={`export-excel-${measureId}`}
                          onClick={() => {
                            onExportExcel();
                            handleClose();
                          }}
                        >
                          Excel
                        </MenuItem>,
                      ]}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </div>
      </div>
    </form>
  );
}
