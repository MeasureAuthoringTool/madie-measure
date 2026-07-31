import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import "../../../../../../../../../measureLanding/MeasureLanding.scss";
import tw from "twin.macro";
import "styled-components/macro";
import {
  Button,
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
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, InputAdornment, Tooltip } from "@mui/material";
import { getHl7ProfileLink } from "../../../../../../../../../../utils/hl7Links";
// Add in later for sorting icons
// import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
// import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ClearIcon } from "@mui/x-date-pickers";
import "./ResourceList.scss";

import ProfileDisplayToggle from "./profileDisplayToggle/ProfileDisplayToggle";
import {
  ProfileDisplayMode,
  getProfileDisplayMode,
  saveProfileDisplayMode,
} from "./profileDisplayToggle/ProfileDisplayMode";
import useMeasureModel from "../../../../../../routes/qiCore/useMeasureModel";

export interface ResourceListProps {
  resourceIdentifiers?: ResourceIdentifier[];
  allResourceIdentifiers?: ResourceIdentifier[];
  onClick: (resourceIdentifier: ResourceIdentifier) => void;
  isPatientAdded?: boolean;
  isComposite?: boolean;
  onInsertTCClick?: () => void;
  measureId?: string;
  profileMap?: Record<string, number>;
}
const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

const ResourceList = ({
  resourceIdentifiers,
  allResourceIdentifiers,
  onClick,
  isPatientAdded,
  isComposite = false,
  onInsertTCClick,
  measureId,
  profileMap = {},
}: ResourceListProps) => {
  const measureModel = useMeasureModel();
  // Load saved pagination state from localStorage
  const resourcePageOptions = JSON.parse(
    localStorage.getItem("resourcePageOptions")
  ) || {
    page: 1,
    limit: 5,
  };

  const [visibleResources, setVisibleResources] = useState(resourceIdentifiers);
  const [resourceFilter, setResourceFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // utilities for pagination
  const [limit, setLimit] = useState(resourcePageOptions.limit);
  const [page, setPage] = useState(resourcePageOptions.page);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // add in later for sorting
  // const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  // measures owned or shared for the current user excluding the current measure
  const [offset, setOffset] = useState<number>(0);

  // Profile display mode state
  const [profileDisplayMode, setProfileDisplayMode] =
    useState<ProfileDisplayMode>(() => {
      if (!measureId) return ProfileDisplayMode.RELEVANT;
      return getProfileDisplayMode(measureId);
    });

  const handleProfileDisplayModeChange = useCallback(
    (mode: ProfileDisplayMode) => {
      setProfileDisplayMode(mode);
      if (measureId) {
        saveProfileDisplayMode(measureId, mode);
      }
      setPage(1);
    },
    [measureId]
  );

  const activeResourceIdentifiers = useMemo(() => {
    if (profileDisplayMode === ProfileDisplayMode.ALL) {
      return allResourceIdentifiers || resourceIdentifiers;
    }
    return resourceIdentifiers;
  }, [profileDisplayMode, allResourceIdentifiers, resourceIdentifiers]);

  const profileTableHeader = useMemo(() => {
    return profileDisplayMode === ProfileDisplayMode.ALL
      ? "All Profiles"
      : "Relevant Profiles";
  }, [profileDisplayMode]);

  const managePagination = useCallback(() => {
    const filter = resourceFilter?.trim().toLowerCase() || "";
    const filteredResources = activeResourceIdentifiers.filter((resource) =>
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
    activeResourceIdentifiers,
    setOffset,
    setVisibleResources,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
    resourceFilter,
  ]);

  useEffect(() => {
    if (activeResourceIdentifiers) {
      managePagination();
    }
  }, [activeResourceIdentifiers, page, limit, resourceFilter]);

  // Save pagination state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "resourcePageOptions",
      JSON.stringify({ page, limit })
    );
  }, [page, limit]);

  const columns = useMemo<ColumnDef<ResourceIdentifier>[]>(() => {
    const columnDefs = [];
    return [
      ...columnDefs,
      {
        header: profileTableHeader,
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
        header: "HL7",
        cell: ({ row }) => {
          const { original } = row;
          const hl7ProfileId = original.id || original.profile;
          const link = getHl7ProfileLink(hl7ProfileId, measureModel);
          const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (link) {
              window.open(link, "_blank");
            }
          };
          return (
            <IconButton
              data-testid={`hl7-link-${original.id || original.type}`}
              aria-label={`Open HL7 profile for ${
                original.id || original.type
              }`}
              onClick={handleClick}
            >
              <OpenInNewIcon />
            </IconButton>
          );
        },
        id: "hl7",
        accessorKey: "hl7",
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => {
          const { original } = row;
          const isPatient =
            original.id === "qicore-patient" ||
            original.id === "us-core-patient";
          const isDisabled = isPatient && isPatientAdded;
          return (
            <>
              <Tooltip
                data-testid="original.id-tooltip"
                title={
                  isDisabled
                    ? "Only one Patient profile is supported per test case. This test case already includes a Patient profile."
                    : "Click to add this profile to the test case."
                }
                placement="top"
                arrow
                slotProps={{
                  tooltip: {
                    sx: {
                      zIndex: 9999,
                      backgroundColor: "#333",
                      "& .MuiTooltip-arrow": {
                        color: "#333",
                      },
                    },
                  },
                }}
              >
                <span>
                  <Button
                    data-testId={`add-element-${original.id}`}
                    onClick={() => {
                      onClick(original);
                    }}
                    variant="outline"
                    disabled={isDisabled}
                  >
                    Add
                  </Button>
                </span>
              </Tooltip>
            </>
          );
        },
        accessorKey: "action",
      },
      {
        header: "# Added",
        id: "added",
        cell: ({ row }) => {
          const { original } = row;
          const { profile } = original;
          const numberOfEntries = profileMap?.[profile] ?? "-";
          return <div className="number-of-profiles">{numberOfEntries}</div>;
        },
      },
    ];
  }, [visibleResources, isPatientAdded, measureModel, profileTableHeader]);
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
      {isComposite && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            data-testid={`insert-test-case-button`}
            onClick={onInsertTCClick}
            disabled={!isPatientAdded}
          >
            Insert Existing Test Case
          </Button>
        </div>
      )}
      <div id="search-container" tw="mb-5 mt-3">
        <div className="search-field-wrapper">
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
        <div className="profile-toggle-wrapper">
          <ProfileDisplayToggle
            mode={profileDisplayMode}
            allProfileCount={
              (allResourceIdentifiers || resourceIdentifiers)?.length || 0
            }
            relevantProfileCount={resourceIdentifiers?.length || 0}
            onChange={handleProfileDisplayModeChange}
          />
        </div>
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
                            className={`header-cell ${
                              header.column.id === "hl7"
                                ? "hl7-column"
                                : header.column.id === "action"
                                ? "action-column"
                                : ""
                            }`}
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
                          className={
                            cell.column.id === "hl7"
                              ? "hl7-column"
                              : cell.column.id === "action"
                              ? "action-column"
                              : ""
                          }
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
      {activeResourceIdentifiers && visibleResources?.length === 0 && (
        <div
          data-testid="no-profiles-found"
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "20px",
            color: "#333",
            fontSize: "14px",
          }}
        >
          No profiles found
        </div>
      )}
      {!activeResourceIdentifiers && (
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
