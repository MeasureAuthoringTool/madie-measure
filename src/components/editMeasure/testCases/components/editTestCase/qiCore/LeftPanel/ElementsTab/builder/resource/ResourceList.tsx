import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as _ from "lodash";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import "../../../../../../../../../measureLanding/MeasureLanding.scss";
import tw from "twin.macro";
import "styled-components/macro";
import {
  TruncateText,
  Pagination,
  TextField,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment } from "@mui/material";
// Add in later for sorting icons
// import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
// import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { customSort } from "../../../../../../testCaseLanding/common/Hooks/UseTestCases";
import EditIcon from "../../../../../../../../../common/EditIcon";
import { ClearIcon } from "@mui/x-date-pickers";
import "./ResourceList.scss";

export interface ResourceListProps {
  resourceIdentifiers?: ResourceIdentifier[];
  onClick: (resourceIdentifier: ResourceIdentifier) => void;
  isPatientAdded?: boolean;
}
const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

const ResourceList = ({
  resourceIdentifiers,
  onClick,
  isPatientAdded,
}: ResourceListProps) => {
  const [visibleResources, setVisibleResources] = useState(resourceIdentifiers);
  const [resourceFilter, setResourceFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // utilities for pagination
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(1);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // add in later for sorting
  // const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  // measures owned or shared for the current user excluding the current measure
  const [offset, setOffset] = useState<number>(0);

  const managePagination = useCallback(() => {
    const filter = resourceFilter?.trim().toLowerCase() || "";
    const filteredResources = resourceIdentifiers.filter((resource) =>
      resource.title.toLowerCase().includes(filter)
    );
    if (filteredResources.length < limit) {
      setOffset(0);
      setVisibleResources([...filteredResources]);
      setVisibleItems(filteredResources.length);
      setTotalItems(filteredResources.length);
      setTotalPages(1);
    } else {
      const start = (page - 1) * limit;
      const end = start + limit;
      const newVisibleReferences = [...filteredResources].slice(start, end);
      setOffset(start);
      setVisibleResources(newVisibleReferences);
      setVisibleItems(newVisibleReferences.length);
      setTotalItems(filteredResources.length);
      setTotalPages(Math.ceil(filteredResources.length / limit));
    }
  }, [
    limit,
    page,
    resourceIdentifiers,
    setOffset,
    setVisibleResources,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
    resourceFilter,
  ]);

  useEffect(() => {
    if (resourceIdentifiers) {
      managePagination();
    }
  }, [resourceIdentifiers, page, limit, resourceFilter]);

  const columns = useMemo<ColumnDef<ResourceIdentifier>[]>(() => {
    const columnDefs = [];
    return [
      ...columnDefs,
      {
        header: "Profile",
        cell: (info) => (
          <TruncateText
            text={info.row.original.title}
            maxLength={120}
            dataTestId={`profile-${info.row.original.id}`}
          />
        ),
        accessorKey: "profile",
        // add in later for sorting
        // sortingFn: (rowA, rowB) =>
        //   customSort(rowA.original.profile, rowB.original.title),
      },
      {
        header: "",
        cell: ({ row }) => {
          const { original } = row;
          const isPatient = original.id === "qicore-patient";
          const isDisabled = isPatient && isPatientAdded;
          return (
            <>
              <IconButton
                data-testId={`add-element-${original.id}`}
                onClick={() => {
                  onClick(original);
                }}
                disabled={isDisabled}
              >
                <AddCircleOutlineIcon
                  sx={{ color: isDisabled ? "#BDBDBD" : "#0073C8" }}
                />
              </IconButton>
              <IconButton>
                <EditIcon color="#0073C8" />
              </IconButton>
            </>
          );
        },
        accessorKey: "action",
      },
    ];
  }, [visibleResources, isPatientAdded]);
  const canGoNext = (() => {
    return page < totalPages;
  })();

  const canGoPrev = page > 1;
  const handlePageChange = (e, v) => {
    setPage(v);
  };
  const handleLimitChange = (e) => {
    setLimit(e.target.value);
    setPage(1);
  };
  const table = useReactTable({
    data: visibleResources,
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

  // if there isnt a start adornment and end adornment the field gets really small like 1/4 the height. Going to just leave it in for now
  const handleClearClick = () => {
    setResourceFilter("");
    setSearchTerm("");
  };
  const searchInputProps = {
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon />
      </InputAdornment>
    ),
    endAdornment: (
      <IconButton aria-label="Clear-Search" onClick={handleClearClick}>
        <ClearIcon />
      </IconButton>
    ),
  };
  return (
    <div id="qi-core-6-tc-builder">
      <div id="search-container">
        <TextField
          onChange={({ target }) => {
            setSearchTerm(target.value);
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              setResourceFilter(e.target.value);
            }
          }}
          id="search-elements-input"
          name="searchElements"
          placeholder="Search"
          type="search"
          data-testid="elements-search-input"
          label="Search"
          value={searchTerm}
          variant="outlined"
          inputProps={{
            "data-testid": "search-elements-input-input",
            "aria-required": "false",
          }}
          InputProps={searchInputProps}
        />
      </div>

      {/* we want to render the table if visibleResources. We want to render the spinner if no resourceIdentifiers, and an empty div if no results */}
      {visibleResources?.length > 0 && (
        <div id="measure-landing" data-testid="measure-landing">
          <div className="measure-table no-margin-top">
            <div className="table" style={{ overflow: "auto" }}>
              <table
                tw="min-w-full"
                data-testid="measure-list-tbl"
                className="ml-table"
                style={{
                  borderSpacing: "0 2em !important",
                  width: "100%",
                }}
              >
                <thead tw="bg-slate">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        // const isHovered = hoveredHeader?.includes(header.id); add in later for visibility toggle
                        return (
                          <TH
                            key={header.id}
                            scope="col"
                            // onClick={header.column.getToggleSortingHandler()} //add in later
                            // onMouseEnter={() => setHoveredHeader(header.id)}
                            // onMouseLeave={() => setHoveredHeader(null)}
                            className="header-cell"
                          >
                            {header.isPlaceholder ? null : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault(); // needs this or it triggers a submit somewhere up the form and errors
                                }}
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
                                {/* 
                                add in later for sorting.
                                add a negative margin on the arrow display to not make the table jump
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
                                </span> */}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div id="tc-builder-pagination-container">
            <Pagination
              totalItems={totalItems}
              visibleItems={visibleItems}
              limitOptions={[5, 10, 25, 50]}
              offset={offset}
              page={page}
              limit={limit}
              handlePageChange={handlePageChange}
              handleLimitChange={handleLimitChange}
              count={totalPages}
              shape="rounded"
              hideNextButton={!canGoNext}
              hidePrevButton={!canGoPrev}
            />
          </div>
        </div>
      )}
      {!resourceIdentifiers && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <MadieSpinner
            data-testId="madie-loading-spinner"
            style={{ height: 50, width: 50 }}
          />
        </div>
      )}
    </div>
  );
};

export default ResourceList;
