import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { IconButton, MenuItem, Tooltip, Chip } from "@mui/material";
import {
  MadieDialog,
  MadieSpinner,
  TruncateText,
  Pagination,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";
import InputAdornment from "@material-ui/core/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import * as _ from "lodash";
import "../../../../../../measureLanding/MeasureLanding.scss";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { customSort } from "../Hooks/UseTestCases";
import { Measure } from "@madie/madie-models";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import useMeasureServiceApi from "../../../../../../../api/useMeasureServiceApi";
import "./tcPagination.scss";
const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

export const filterByOptions = ["Measure", "Version", "CMS ID"];

const CopyTestCaseDialog = ({ open, onClose, onSubmit, measure }) => {
  const measureSearchApi = useRef(useMeasureServiceApi());
  const abortController = useRef(null);

  // utilities for pagination
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(0);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  // utilities for filter & search
  const [filterBy, setFilterBy] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("")

  const handleSearch = (e) => {
    setSearchValue(e.target.value)

  }
  const handleFilter = (e) => {
    setFilterBy(e.target.value)

  }
  // measures owned or shared for the current user excluding the current measure
  const [measureList, setMeasureList] = useState<Measure[]>([]);
  console.log('measureList', measureList)
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchMeasures = useCallback(() => {
    if (!measure || !measure.model || !measure.id || !open) {
      return;
    }
    setLoading(true);
    abortController.current = new AbortController();
    measureSearchApi.current
      .searchMeasuresByCriteria(
        true,
        limit,
        page,
        {
          model: measure.model,
          excludeByMeasureIds: [measure.id],
          draft: true,
        },
        abortController.current.signal
      )
      .then((response) => {
        const {
          content,
          totalPages,
          totalElements,
          numberOfElements,
          pageable,
        } = response;
        setTotalPages(totalPages);
        setTotalItems(totalElements);
        setVisibleItems(numberOfElements);
        setMeasureList(content);
        setOffset(pageable?.offset);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        if (error.name !== "AbortError") {
          console.error("Failed to fetch measures:", error);
        }
      });
  }, [measure, open, limit, page]);

  useEffect(() => {
    fetchMeasures();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchMeasures]);

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [];
    columnDefs.push({
      id: "select",
      cell: ({ row }) => {
        return (
          <input
            type="radio"
            checked={selectedRowId === row.original.id}
            onChange={() => setSelectedRowId(row.original.id)}
          />
        );
      },
    });

    return [
      ...columnDefs,
      {
        header: "Measure Name",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureName",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.measureName, rowB.original.measureName),
      },
      {
        header: "Version",
        cell: (info) => (
          <>
            <TruncateText
              text={info.row.original.version}
              maxLength={20}
              dataTestId={`measure-version-${info.row.original.id}`}
            />
            {`${info.row.original.measureMetaData?.draft}` === "true" && (
              <Chip tw="ml-6" className="chip-draft" label="Draft" />
            )}
          </>
        ),
        accessorKey: "version",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.version, rowB.original.version),
      },
      {
        header: "CMS ID",
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original.measureSet.cmsId)}
            maxLength={20}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "cmsId",
        sortingFn: (rowA, rowB) =>
          customSort(
            _.toString(rowA.original.measureSet.cmsId),
            _.toString(rowB.original.measureSet.cmsId)
          ),
      },
    ];
  }, [selectedRowId]);

  const table = useReactTable({
    data: measureList,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <MadieDialog
      form
      title="Copy To"
      dialogProps={{
        onClose,
        open,
        onSubmit: () => {},
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "copy-test-cases-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "copy-test-cases-continue-button",
        continueText: "Save",
        disabled: _.isEmpty(selectedRowId),
      }}
      maxWidth={"lg"}
    >
      <div id="measure-landing" data-testid="measure-landing">
        <div id="tc-search">
        {/* <div tw="flex w-1/2 pr-4"> */}
          {/* <div tw="w-1/2 pr-2"> */}
          <div>
            <Select
              label="Filter By"
              id="filter-by-select"
              data-testid="filter-by-select"
              // tw="w-full"
              inputProps={{ "data-testid": "filter-by-select-input" }}
              placeHolder={{ name: "Filter By", value: "" }}
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              size="small"
              name="filterBy"
              value={filterBy}
              onChange={handleFilter}
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
          {/* <div tw="w-1/2 pl-2"> */}
          <div>
            <TextField
              id="search"
              // tw="w-full"
              label="Search"
              placeholder="Search"
              inputProps={{
                "data-testid": "test-case-list-search-input",
              }}
              data-testid="test-case-list-search"
              name="searchValue"
              value={searchValue}
              onChange={handleSearch}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  // handleNavigate();
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      data-testid="test-cases-trigger-search"
                      // onClick={handleNavigate}
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
                      // onClick={handleClearClick}
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
        <div className="measure-table no-margin-top">
          <div className="table" style={{ overflow: "auto" }}>
            <table
              tw="min-w-full"
              data-testid="measure-list-tbl"
              className="ml-table"
              style={{
                borderSpacing: "0 2em !important",
                borderBottom: "1px solid rgb(140, 140, 140)"
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
                                  ? header.column.getNextSortingOrder() ===
                                    "asc"
                                    ? "Sort ascending"
                                    : header.column.getNextSortingOrder() ===
                                      "desc"
                                    ? "Sort descending"
                                    : "Clear sort"
                                  : undefined
                              }
                            >
                              <span className="arrowDisplay">
                                {header.column.getCanSort() &&
                                  isHovered &&
                                  !header.column.getIsSorted() && (
                                    <UnfoldMoreIcon />
                                  )}
                                {{
                                  asc: <KeyboardArrowUpIcon />,
                                  desc: <KeyboardArrowDownIcon />,
                                }[header.column.getIsSorted() as string] ??
                                  null}
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
                {loading ? (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <MadieSpinner style={{ height: 50, width: 50 }} />
                  </div>
                ) : _.isEmpty(measureList) ? (
                  <tr>
                    <td colSpan={columns.length} tw="text-center p-2">
                      You don't have any other measures that you own or are
                      shared with you, belonging to the same model.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="ml-tr"
                      data-testid={`row-item`}
                      style={{
                        borderTop: "solid 1px #8c8c8c",
                        borderSpacing: "0 2em !important",
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          data-testid={`measure-name-${cell.id}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination
              totalItems={totalItems}
              visibleItems={visibleItems}
              limitOptions={[5, 10, 25, 50]}
              offset={offset}
              page={page + 1}
              limit={limit}
              handlePageChange={(e, v) => {
                setPage(v - 1);
                setMeasureList([]);
              }}
              handleLimitChange={(e) => {
                setLimit(e.target.value);
                setMeasureList([]);
              }}
              count={totalPages}
              shape="rounded"
              hideNextButton={!(page + 1 < totalPages)}
              hidePrevButton={!(page > 0)}
            />
          </div>
        </div>
      </div>
    </MadieDialog>
  );
};

export default CopyTestCaseDialog;
