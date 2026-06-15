import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  TruncateText,
  Button,
  Pagination,
  Select,
  TextField,
} from "@madie/madie-design-system/dist/react";
import tw from "twin.macro";
import "styled-components/macro";
import { InputAdornment, IconButton, MenuItem } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { TestCase, Measure } from "@madie/madie-models";
import HowItWorks from "../LeftPanel/ElementsTab/builder/HowItWorks/HowItWorks";
import { formatCmsId } from "../../../../../../../utils/cmsIdFormatter";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

const filterByOptions = ["Group", "Title", "Description"];

export default function CompositeTestCasesTable({
  testCases,
  selectedMeasure,
  onBackToMeasures,
  onSelectProfile,
}: {
  testCases: TestCase[];
  selectedMeasure: Measure;
  onBackToMeasures: () => void;
  onSelectProfile?: (testCase: TestCase) => void;
}) {
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterBy, setFilterBy] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Only show valid test cases
  const validTestCases = useMemo(
    () => testCases.filter((tc) => tc.validResource),
    [testCases]
  );

  // Filter
  const filteredTestCases = useMemo(() => {
    if (!searchText.trim()) return validTestCases;
    const lowerSearch = searchText.toLowerCase();

    return validTestCases.filter((tc) => {
      if (!filterBy || filterBy === "") {
        // Search across all 3 fields when "-" (empty) is selected
        const group = (tc.series || "").toLowerCase();
        const title = (tc.title || "").toLowerCase();
        const description = (tc.description || "").toLowerCase();
        return (
          group.includes(lowerSearch) ||
          title.includes(lowerSearch) ||
          description.includes(lowerSearch)
        );
      }

      // Map filterBy display value to TestCase field
      const fieldMap: Record<string, string> = {
        Group: "series",
        Title: "title",
        Description: "description",
      };
      const field = fieldMap[filterBy] || filterBy;
      const value = (tc[field] ?? "").toString().toLowerCase();
      return value.includes(lowerSearch);
    });
  }, [validTestCases, searchText, filterBy]);

  // Pagination
  const totalItems = filteredTestCases.length;
  const count = Math.ceil(totalItems / limit);
  const offset = (page - 1) * limit;
  const currentSlice = filteredTestCases.slice(offset, offset + limit);
  const visibleItems = currentSlice.length;

  const handleSearch = () => {
    setPage(1);
  };

  const handleClear = () => {
    setSearchText("");
    setFilterBy("");
    setPage(1);
  };

  const columns = useMemo<ColumnDef<TestCase>[]>(
    () => [
      {
        header: "Group",
        accessorKey: "series",
        size: 10,
        cell: (info) => (
          <TruncateText
            text={info.row.original.series || "-"}
            maxLength={60}
            dataTestId={`tc-group-${info.row.original.id}`}
          />
        ),
      },
      {
        header: "Title",
        accessorKey: "title",
        size: 38,
        cell: (info) => (
          <span
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
              display: "inline-block",
              maxWidth: "100%",
            }}
            data-testid={`tc-title-${info.row.original.id}`}
          >
            {info.row.original.title}
          </span>
        ),
      },
      {
        header: "Description",
        accessorKey: "description",
        size: 35,
        cell: (info) => (
          <TruncateText
            text={info.row.original.description || "-"}
            maxLength={120}
            dataTestId={`tc-description-${info.row.original.id}`}
          />
        ),
      },
      {
        id: "actions",
        header: null,
        size: 15,
        cell: (info) => (
          <Button
            tw="m-2"
            type="button"
            data-testid={`select-profile-btn-${info.row.original.id}`}
            onClick={() => onSelectProfile?.(info.row.original)}
          >
            Select Profile(s)
            <ChevronRightIcon style={{ height: "20px", width: "20px" }} />
          </Button>
        ),
        accessorKey: "actions",
        enableSorting: false,
      },
    ],
    [onSelectProfile]
  );

  const table = useReactTable({
    data: currentSlice,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    defaultColumn: {
      minSize: 50,
    },
  });

  const cmsId = (selectedMeasure as any)?.measureSet?.cmsId;

  return (
    <div data-testid="composite-test-cases-panel">
      {/* Back button + How it works */}
      {howItWorksOpen ? (
        <>
          <div tw="mt-4 mb-4">
            <Button
              variant="outline"
              type="button"
              data-testid="back-to-measures-btn"
              onClick={onBackToMeasures}
            >
              <ArrowBackIcon
                style={{ height: "18px", width: "18px", marginRight: 4 }}
              />
              Back to All Profiles
            </Button>
          </div>
          <div tw="mb-4" className="how-it-works-flush-left">
            <HowItWorks
              isOpen={howItWorksOpen}
              onOpenChange={setHowItWorksOpen}
            />
          </div>
        </>
      ) : (
        <div
          tw="mt-4 mb-4"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button
            variant="outline"
            type="button"
            data-testid="back-to-measures-btn"
            onClick={onBackToMeasures}
          >
            <ArrowBackIcon
              style={{ height: "18px", width: "18px", marginRight: 4 }}
            />
            Back to All Measures
          </Button>
          <HowItWorks
            isOpen={howItWorksOpen}
            onOpenChange={setHowItWorksOpen}
          />
        </div>
      )}

      {/* Header */}
      <h3 style={{ fontSize: 18, fontWeight: 500 }}>
        2. Select which Test Case to choose Test Case Profiles from:
      </h3>
      <hr
        style={{
          margin: "12px 0",
          border: "none",
          borderTop: "1px solid #d1d5db",
        }}
      />

      {/* Measure info */}
      <div tw="mb-4">
        <p style={{ fontWeight: 700, margin: 0 }}>
          {selectedMeasure.measureName}
          {cmsId && (
            <span style={{ fontWeight: 400, color: "#717171", marginLeft: 8 }}>
              (CMS ID: {formatCmsId(cmsId, selectedMeasure?.model)})
            </span>
          )}
        </p>
        <p
          style={{
            fontSize: 14,
            color: "#717171",
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          {totalItems} Test Cases
        </p>
      </div>

      {/* Search / Filter */}
      <div tw="flex py-4 items-center">
        <div tw="flex w-1/2 pr-4">
          <div tw="w-1/2 pr-2">
            <Select
              label="Filter By"
              id="tc-filter-by-select"
              data-testid="tc-filter-by-select"
              inputProps={{ "data-testid": "tc-filter-by-select-input" }}
              placeHolder={{ name: "Filter By", value: "" }}
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              size="small"
              name="filterBy"
              value={filterBy}
              onChange={(e) => {
                setFilterBy(e.target.value);
                setPage(1);
              }}
              options={[
                <MenuItem key="-" value="" data-testid="tc-filter-by--">
                  -
                </MenuItem>,
                ...filterByOptions.map((option) => (
                  <MenuItem
                    key={option}
                    value={option}
                    data-testid={`tc-filter-by-${option}`}
                  >
                    {option}
                  </MenuItem>
                )),
              ]}
            />
          </div>
          <div tw="w-1/2 pl-2">
            <TextField
              id="tc-search"
              tw="w-full"
              label="Search"
              placeholder="Search"
              inputProps={{
                "data-testid": "tc-search-input",
              }}
              data-testid="tc-search"
              name="searchValue"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      data-testid="tc-trigger-search"
                      onClick={handleSearch}
                      style={{ cursor: "pointer" }}
                    >
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment
                      data-testid="tc-clear-search"
                      position="end"
                      style={{ cursor: "pointer" }}
                      onClick={handleClear}
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
      </div>

      {/* Table */}
      {currentSlice.length > 0 ? (
        <>
          <div className="measure-table no-margin no-vert-borders no-radius middle-align-row">
            <div className="table" style={{ overflow: "auto" }}>
              <table
                tw="min-w-full"
                data-testid="composite-test-cases-tbl"
                className="ml-table"
                style={{
                  borderSpacing: "0 2em !important",
                  tableLayout: "fixed",
                  width: "100%",
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
                            style={{
                              width: `${header.column.getSize()}%`,
                            }}
                          >
                            {header.isPlaceholder ? null : (
                              <button
                                type="button"
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
                                  {header.column.columnDef.header !== "" &&
                                    header.column.getCanSort() &&
                                    isHovered &&
                                    !header.column.getIsSorted() && (
                                      <UnfoldMoreIcon />
                                    )}
                                  {header.column.columnDef.header !== "" &&
                                    ({
                                      asc: <KeyboardArrowUpIcon />,
                                      desc: <KeyboardArrowDownIcon />,
                                    }[header.column.getIsSorted() as string] ??
                                      null)}
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
                    <React.Fragment key={row.id}>
                      <tr
                        className="ml-tr"
                        data-testid="tc-row-item"
                        style={{
                          borderTop: "solid 1px #8c8c8c",
                          borderSpacing: "0 2em !important",
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            data-testid={`tc-cell-${cell.id}`}
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: 0,
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination
            totalItems={totalItems}
            visibleItems={visibleItems}
            limitOptions={[10, 25, 50, "All"]}
            offset={offset}
            handlePageChange={(e, newPage) => setPage(newPage)}
            handleLimitChange={(e) => {
              const val = e.target.value;
              if (val === "All") {
                setLimit(totalItems);
              } else {
                setLimit(Number(val));
              }
              setPage(1);
            }}
            page={page}
            limit={limit}
            count={count}
            shape="rounded"
            hideNextButton={page >= count}
            hidePrevButton={page <= 1}
          />
        </>
      ) : (
        <p
          data-testid="no-test-cases-message"
          style={{ textAlign: "center", color: "#717171", marginTop: 24 }}
        >
          No valid test cases found.
        </p>
      )}
    </div>
  );
}
