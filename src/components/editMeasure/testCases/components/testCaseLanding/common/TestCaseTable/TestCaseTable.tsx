import React, { useState, useEffect, useMemo, useRef } from "react";
import tw from "twin.macro";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import "styled-components/macro";
import { Model, TestCase } from "@madie/madie-models";
import {
  TestCaseStatus,
  TestCaseValidationStatus,
  TestCaseActionButton,
  getTranslatedValidationStatus,
} from "./TestCaseTableHelpers";
import {
  MadieDeleteDialog,
  Toast,
  TruncateText,
  Button,
} from "@madie/madie-design-system/dist/react";
import "../TestCase.scss";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ShiftDatesDialog from "../shiftDates/ShiftDatesDialog";
import { Tooltip } from "@mui/material";
import { checkUserCanEdit } from "@madie/madie-util";
import _ from "lodash";
import { useNavigate } from "react-router-dom";
import DeleteDisabledIcon from "../../../../../../common/DeleteDisabledIcon";

interface TestCaseTableProps {
  testCases: TestCase[];
  canEdit: boolean;
  deleteTestCase: Function;
  exportTestCase: Function;
  onCloneTestCase?: (testCase: TestCase) => void;
  measure: any;
  handleQiCloneTestCase?: (testCase: TestCase) => void;
  sorting: any;
  setSorting: any;
  setSelectedTestCases: any;
  selectedTestCases: any;
  deleteDialogModalOpen: any;
  setDeleteDialogModalOpen: any;
  shiftDatesDialogModalOpen: any;
  setShiftDatesDialogModalOpen: any;
  setWarnings: any;
  page: number;
  setShiftTestCaseDatesWarnings: any;
}

const fiberManualRecordStyles = {
  color: "#003366",
  width: 8,
  height: 8,
};

const DeleteDisabledIconStyles = {
  color: "#8C8C8C",
  width: 24,
  height: 24,
};

const deleteTooltipStyles = {
  maxWidth: 300,
  padding: "8px 16px",
  textAlign: "center",
  fontFamily: "Rubik",
  fontSize: "14px",
  lineHeight: "19px",
};

export const convertDate = (date: string) => {
  if (!date) {
    return { date: "", time: "" };
  }
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear().toString();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  const hours = String(dateObj.getUTCHours()).padStart(2, "0");
  const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getUTCSeconds()).padStart(2, "0");
  return {
    date: `${month}/${day}/${year}`,
    time: `${hours}:${minutes}:${seconds} (UTC)`,
  };
};

// Returns true if the test case was created or modified after the measure was last versioned
const isCreatedOrModifiedAfterVersioning = (
  testCaseLastModifiedDateStr: string,
  measureLastModifiedDateStr: string,
) => {
  const testCaseLastModifiedDate = new Date(testCaseLastModifiedDateStr);
  const measureLastModifiedDate = new Date(measureLastModifiedDateStr);

  return testCaseLastModifiedDate > measureLastModifiedDate;
};

const IndeterminateCheckbox = ({ indeterminate, checked, ...rest }: any) => {
  const ref = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return <input type="checkbox" ref={ref} checked={checked} {...rest} />;
};

const TestCaseTable = (props: TestCaseTableProps) => {
  const {
    testCases,
    canEdit,
    deleteTestCase,
    exportTestCase,
    onCloneTestCase,
    measure,
    handleQiCloneTestCase,
    sorting,
    setSorting,
    setSelectedTestCases,
    selectedTestCases,
    deleteDialogModalOpen,
    setDeleteDialogModalOpen,
    shiftDatesDialogModalOpen,
    setShiftDatesDialogModalOpen,
    setShiftTestCaseDatesWarnings,
  } = props;
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };

  const navigate = useNavigate();
  const isQICore6 = measure?.model === Model.QICORE_6_0_0;

  const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

  const transFormData = (testCases: TestCase[]): TCRow[] => {
    return testCases.map((tc: TestCase) => ({
      id: tc.id,
      status: tc.executionStatus,
      validationStatus: tc.validationStatus,
      group: tc.series,
      title: tc.title,
      description: tc.description,
      lastSaved: tc.lastModifiedAt,
      action: tc,
      caseNumber: tc.caseNumber,
      createdBeforeVersioning: tc.createdBeforeVersioning,
    }));
  };

  type TCRow = {
    status: any;
    validationStatus: any;
    group: string;
    title: string;
    description: string;
    lastSaved: string;
    action: any;
    id: string;
    caseNumber: number;
    createdBeforeVersioning: boolean;
  };

  const [data, setData] = useState<TCRow[]>([]);

  useEffect(() => {
    if (testCases) {
      setData(transFormData(testCases));
    }
  }, [testCases]);

  const columns = useMemo<ColumnDef<TCRow>[]>(() => {
    const columnDefs = [];
    columnDefs.push({
      id: "select",
      header: ({ table }) => {
        const visibleRows = table.getRowModel().rows;

        const allVisibleSelected = visibleRows.every((row) =>
          row.getIsSelected(),
        );
        const someVisibleSelected = visibleRows.some((row) =>
          row.getIsSelected(),
        );

        const toggleVisibleRows = () => {
          const shouldSelectAll = !allVisibleSelected;
          visibleRows.forEach((row) => row.toggleSelected(shouldSelectAll));
        };

        return (
          <IndeterminateCheckbox
            checked={allVisibleSelected}
            indeterminate={!allVisibleSelected && someVisibleSelected}
            onChange={toggleVisibleRows}
            aria-label="Test Case Selection"
            tabIndex={0}
          />
        );
      },

      cell: (info) => (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 16,
          }}
        >
          <div className="px-1">
            <IndeterminateCheckbox
              checked={info.row.getIsSelected()}
              disabled={!info.row.getCanSelect()}
              indeterminate={info.row.getIsSomeSelected()}
              onChange={info.row.getToggleSelectedHandler()}
            />
          </div>

          {canEdit &&
          !measure.measureMetaData?.draft &&
          info.row.original.createdBeforeVersioning ? (
            <Tooltip
              data-testid="delete-disabled-tooltip"
              title="Test cases present at versioning can't be deleted; only newly added ones can."
              placement="top"
              arrow
              slotProps={{ tooltip: { sx: deleteTooltipStyles } }}
            >
              <div>
                <DeleteDisabledIcon
                  sx={DeleteDisabledIconStyles}
                  aria-label={`Test case "${info.row.original.title}" in group "${info.row.original.group}" cannot be deleted because it was created before the measure was versioned`}
                  data-testid={`test-case-no-delete-icon-${info.row.original.id}`}
                />
              </div>
            </Tooltip>
          ) : null}
        </div>
      ),
    });

    columnDefs.push(
      {
        header: "Case #",
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original.caseNumber)}
            maxLength={60}
            dataTestId={`test-case-caseNumber-${info.row.original.id}`}
          />
        ),
        accessorKey: "caseNumber",
        sortingFn: "alphanumeric",
        sortDescFirst: false,
      },
      {
        header: "Status",
        cell: (info) => (
          <TestCaseStatus executionStatus={info.row.original.status} />
        ),
        accessorKey: "executionStatus",
      },
    );

    if (isQICore6) {
      columnDefs.push({
        header: "Validation",
        cell: (info) => (
          <TestCaseValidationStatus
            validationStatus={info.row.original.validationStatus}
          />
        ),
        accessorKey: "testCaseValidationStatus",
        // ValidationStatus doesn't naturally sort, so we provide a custom sorting function
        sortingFn: (rowA, rowB, columnId) => {
          return getTranslatedValidationStatus(rowA.original.validationStatus) >
            getTranslatedValidationStatus(rowB.original.validationStatus)
            ? 1
            : getTranslatedValidationStatus(rowA.original.validationStatus) <
              getTranslatedValidationStatus(rowB.original.validationStatus)
            ? -1
            : 0;
        },
        sortDescFirst: false,
      });
    }

    return [
      ...columnDefs,
      {
        header: "Group",
        cell: (info) => (
          <TruncateText
            text={info.row.original.group}
            maxLength={120}
            dataTestId={`test-case-series-${info.row.original.id}`}
          />
        ),
        accessorKey: "series",
      },
      {
        header: "Title",
        cell: (info) => (
          <TruncateText
            text={info.row.original.title}
            maxLength={60}
            dataTestId={`test-case-title-${info.row.original.id}`}
          />
        ),
        accessorKey: "title",
      },
      {
        header: "Description",
        cell: (info) => (
          <TruncateText
            text={info.row.original.description}
            maxLength={120}
            dataTestId={`test-case-description-${info.row.original.id}`}
          />
        ),
        accessorKey: "description",
      },
      {
        header: "Last Saved",
        cell: (info) => {
          const converted = convertDate(info.row.original.lastSaved);
          const { date, time } = converted;
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {!measure.measureMetaData?.draft &&
              isCreatedOrModifiedAfterVersioning(
                info.row.original.lastSaved,
                measure?.lastModifiedAt,
              ) ? (
                <div>
                  <FiberManualRecord
                    sx={fiberManualRecordStyles}
                    data-testid={`test-case-fiber-manual-record-icon-${info.row.original.id}`}
                  />
                </div>
              ) : null}
              <div style={{ marginLeft: "8px" }}>
                {date}
                <br />
                {time}
              </div>
            </div>
          );
        },
        accessorKey: "lastModifiedAt",
      },
      {
        header: () => (
          <button tabIndex={0} aria-label="Edit or View Test Case">
            Action
          </button>
        ),
        cell: (info) => {
          const testCase = testCases.find(
            (tc) => tc.id === info.row.original.id,
          );
          const isLockedByOther = canEdit && !!testCase?.testCaseLock;

          const buttonText = isLockedByOther
            ? "View"
            : canEdit
            ? "Edit"
            : "View";

          const buttonElement = (
            <Button
              variant="outline-filled"
              data-testid={`view-edit-test-case-button-${info.row.original.id}`}
              aria-label={`${buttonText} Test Case ${info.row.original.group} ${
                info.row.original.title
              }${
                isLockedByOther
                  ? `(Locked by ${testCase.testCaseLock.lockedBy})`
                  : ""
              }`}
              onClick={() => {
                const editTestCaseUrl = _.isEmpty(measure?.groups)
                  ? `../${info.row.original.id}`
                  : `../../${info.row.original.id}`;
                navigate(editTestCaseUrl, { relative: "path" });
              }}
              role="button"
              tabIndex={0}
            >
              {isLockedByOther && (
                <LockOutlinedIcon sx={{ fontSize: 16, marginRight: 0.5 }} />
              )}
              {buttonText}
            </Button>
          );

          if (isLockedByOther) {
            return (
              <Tooltip
                title={
                  <>
                    Locked while being edited by
                    <br />
                    {testCase.testCaseLock.lockedBy}
                  </>
                }
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      maxWidth: "none",
                      whiteSpace: "nowrap",
                    },
                  },
                }}
              >
                <span>{buttonElement}</span>
              </Tooltip>
            );
          }

          return buttonElement;
        },
        accessorKey: "action",
        enableSorting: false,
      },
    ];
  }, [testCases]);

  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });
  // unchecks boxes on page change or testCases change
  useEffect(() => {
    const clearSelection = () => {
      //deslect on page change
      table.toggleAllRowsSelected(false);
      // deselect on testCases change
      table.resetRowSelection();
    };

    clearSelection();
  }, [props.page, props.testCases, table]);

  useEffect(() => {
    const selectedRowIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original?.id);
    const selectedTestCases = testCases.filter((testCase) =>
      selectedRowIds.includes(testCase.id),
    );
    setSelectedTestCases(selectedTestCases);
  }, [testCases, table.getSelectedRowModel().rows]);

  return (
    <div style={{ overflow: "visible" }}>
      <table
        tw="min-w-full"
        data-testid="test-case-tbl"
        className="tcl-table"
        id="testCaseListTable"
        style={{
          borderSpacing: "0 2em !important",
          overflow: "visible",
        }}
      >
        <thead tw="bg-slate" className="sticky-table">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isHovered = hoveredHeader?.includes(header.id);
                return (
                  <TH
                    key={header.id}
                    scope="col"
                    onClick={header.column.getToggleSortingHandler()}
                    onMouseEnter={() => setHoveredHeader(header.id)}
                    onMouseLeave={() => setHoveredHeader(null)}
                    className="header-cell"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className={
                          header.column.getCanSort()
                            ? "cursor-pointer select-none header-button"
                            : "header-button"
                        }
                        title={
                          header.column.getCanSort()
                            ? header.column.getNextSortingOrder() === "asc"
                              ? "Sort ascending"
                              : header.column.getNextSortingOrder() === "desc"
                              ? "Sort descending"
                              : "Clear sort"
                            : undefined
                        }
                      >
                        <span className="arrowDisplay">
                          {header.column.getCanSort() &&
                            isHovered &&
                            !header.column.getIsSorted() && <UnfoldMoreIcon />}

                          {{
                            asc: <KeyboardArrowUpIcon />,
                            desc: <KeyboardArrowDownIcon />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TH>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="table-body" style={{ padding: 20 }}>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="tcl-tr"
              data-testid={`test-case-row-${row.id}`}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} data-testid={`test-case-title-${cell.id}`}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <Toast
          toastKey="test-case-action-toast"
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
        <MadieDeleteDialog
          open={deleteDialogModalOpen}
          onContinue={() => {
            deleteTestCase();
            setDeleteDialogModalOpen(false);
          }}
          onClose={() => {
            setDeleteDialogModalOpen(false);
          }}
          dialogTitle={`Are you sure?`}
          customDialog={
            "You are choosing to delete the following Test Case(s)!"
          }
          name={`<ul style='margin:0;padding-left:28px;list-style:disc;font-weight:normal'>${selectedTestCases
            ?.map((tc) => `<li>${tc.series} - ${tc.title}</li>`)
            .join("")}</ul>`}
          alternateText="Delete Case(s)"
          statement={true}
          additionalText={
            " Test cases in-use by another user will not be deleted."
          }
        />

        <ShiftDatesDialog
          open={shiftDatesDialogModalOpen}
          onClose={() => {
            setShiftDatesDialogModalOpen(false);
          }}
          canEdit={canEdit}
          testCases={selectedTestCases ? selectedTestCases : []}
          measure={measure}
          setShiftTestCaseDatesWarnings={setShiftTestCaseDatesWarnings}
          setToastOpen={setToastOpen}
          setToastType={setToastType}
          setToastMessage={setToastMessage}
        />
      </table>
    </div>
  );
};

export default TestCaseTable;
