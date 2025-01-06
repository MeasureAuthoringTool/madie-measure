import React, { useState, useEffect, useMemo } from "react";
import tw from "twin.macro";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import "styled-components/macro";
import { TestCase } from "@madie/madie-models";
import { TestCaseStatus, TestCaseActionButton } from "./TestCaseTableHelpers";
import {
  MadieDeleteDialog,
  Toast,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import "../TestCase.scss";
import TestCaseTablePopover from "./TestCaseTablePopover";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ShiftDatesDialog from "../shiftDates/ShiftDatesDialog";
import { useFeatureFlags } from "@madie/madie-util";
import _ from "lodash";

interface TestCaseTableProps {
  testCases: TestCase[];
  canEdit: boolean;
  deleteTestCase: Function;
  exportTestCase: Function;
  onCloneTestCase?: (testCase: TestCase) => void;
  measure: any;
  onTestCaseShiftDates?: (testCase: TestCase, shifted: number) => void;
  handleQiCloneTestCase?: (testCase: TestCase) => void;
  sorting: any;
  setSorting: any;
  setSelectedTestCases: any;
  selectedTestCases: any;
  deleteDialogModalOpen: any;
  setDeleteDialogModalOpen: any;
}

export const convertDate = (date: string) => {
  if (!date) {
    return "";
  }
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear().toString();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
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
    onTestCaseShiftDates,
    handleQiCloneTestCase,
    sorting,
    setSorting,
    setSelectedTestCases,
    selectedTestCases,
  } = props;
  const viewOrEdit = canEdit ? "edit" : "view";
  // const [deleteDialogModalOpen, setDeleteDialogModalOpen] =
  //   useState<boolean>(false);
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };

  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase>(null);
  const [shiftDatesDialogOpen, setShiftDatesDialogOpen] =
    useState<boolean>(false);
  const featureFlags = useFeatureFlags();
  const handleOpen = (
    selected: TestCase,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setSelectedTestCase(selected);
    setAnchorEl(event.currentTarget);
    setOptionsOpen(true);
  };

  const handleClose = () => {
    setOptionsOpen(false);
    setSelectedTestCase(null);
    setAnchorEl(null);
    setShiftDatesDialogOpen(false);
  };

  const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

  const transFormData = (testCases: TestCase[]): TCRow[] => {
    return testCases.map((tc: TestCase) => ({
      id: tc.id,
      status: tc.executionStatus,
      group: tc.series,
      title: tc.title,
      description: tc.description,
      lastSaved: tc.lastModifiedAt,
      action: tc,
      caseNumber: tc.caseNumber,
    }));
  };

  type TCRow = {
    status: any;
    group: string;
    title: string;
    description: string;
    lastSaved: string;
    action: any;
    id: string;
    caseNumber: number;
  };

  const [data, setData] = useState<TCRow[]>([]);

  useEffect(() => {
    if (testCases) {
      setData(transFormData(testCases));
    }
  }, [testCases]);

  const columns = useMemo<ColumnDef<TCRow>[]>(() => {
    const columnDefs = [];
    if (featureFlags?.TestCaseListActionCenter) {
      columnDefs.push({
        id: "select",
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <IndeterminateCheckbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              indeterminate={row.getIsSomeSelected()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      });
    }

    columnDefs.push({
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
    });

    return [
      ...columnDefs,
      {
        header: "Status",
        cell: (info) => (
          <TestCaseStatus executionStatus={info.row.original.status} />
        ),
        accessorKey: "executionStatus",
      },
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
        cell: (info) => (
          <TruncateText
            text={convertDate(info.row.original.lastSaved)}
            maxLength={23}
            dataTestId={`test-case-lastSaved-${
              info.row.original.lastSaved ? info.row.original.lastSaved : ""
            }`}
          />
        ),
        accessorKey: "lastModifiedAt",
      },
      {
        header: "Action",
        cell: (info) => (
          <TestCaseActionButton
            testCase={info.row.original.action}
            handleOpen={handleOpen}
          />
        ),
        accessorKey: "action",
        enableSorting: false,
      },
    ];
  }, [testCases, featureFlags]);

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
    manualSorting: true,
  });
  useEffect(() => {
    const selectedRowIds = table
      .getSelectedRowModel()
      .rows.map((row) => row.original?.id);
    const selectedTestCases = testCases.filter((testCase) =>
      selectedRowIds.includes(testCase.id)
    );
    setSelectedTestCases(selectedTestCases);
  }, [testCases, table.getSelectedRowModel().rows]);

  return (
    <div style={{ overflow: "hidden" }}>
      <table
        tw="min-w-full"
        data-testid="test-case-tbl"
        className="tcl-table"
        id="testCaseListTable"
        style={{
          borderTop: "solid 1px #8c8c8c",
          borderSpacing: "0 2em !important",
        }}
      >
        <thead tw="bg-slate">
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
                    {header.isPlaceholder ? null : (
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
                          header.getContext()
                        )}
                      </button>
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
        <TestCaseTablePopover
          canEdit={canEdit}
          viewOrEdit={viewOrEdit}
          model={measure?.model}
          groups={measure?.groups}
          selectedTestCase={selectedTestCase}
          anchorEl={anchorEl}
          optionsOpen={optionsOpen}
          setOptionsOpen={setOptionsOpen}
          exportTestCase={exportTestCase}
          onCloneTestCase={onCloneTestCase}
          setDeleteDialogModalOpen={props.setDeleteDialogModalOpen}
          handleClose={handleClose}
          shiftDatesDialogOpen={shiftDatesDialogOpen}
          setShiftDatesDialogOpen={setShiftDatesDialogOpen}
          onTestCaseShiftDates={onTestCaseShiftDates}
          handleQiCloneTestCase={handleQiCloneTestCase}
        />
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
          open={props.deleteDialogModalOpen}
          onContinue={() => {
            if (featureFlags?.TestCaseListActionCenter) {
              deleteTestCase(selectedTestCases[0].id);
              props.setDeleteDialogModalOpen(false);
            } else {
              deleteTestCase(selectedTestCase.id);
            }
          }}
          onClose={() => {
            props.setDeleteDialogModalOpen(false);
          }}
          dialogTitle={`Delete Test Case`}
          name={selectedTestCase?.title}
        />
        <ShiftDatesDialog
          open={shiftDatesDialogOpen}
          onClose={handleClose}
          canEdit={canEdit}
          testCase={selectedTestCase}
          onTestCaseShiftDates={onTestCaseShiftDates}
        />
      </table>
    </div>
  );
};

export default TestCaseTable;
