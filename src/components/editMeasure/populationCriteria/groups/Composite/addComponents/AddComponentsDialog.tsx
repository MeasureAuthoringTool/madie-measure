import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  TruncateText,
  MadieDialog,
  Pagination,
  MadieSpinner,
  Toast,
} from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../../../icons/MeasureListTableRightArrowIcons";
import { Measure, MeasureScoring, OwnershipType } from "@madie/madie-models";
import * as _ from "lodash";
import tw from "twin.macro";
import "styled-components/macro";
import { useMeasureServiceApi } from "@madie/madie-util";
import "../../../../../measureLanding/MeasureLanding.scss";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { convertDate } from "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable";
import {
  filterByOptions,
  filterMap,
  useMeasureFilterSearch,
} from "../../../../hooks/useMeasureFilterSearch";
import { MeasureSearchFilters } from "../../../../shared/MeasureSearchFilters";
import styled from "styled-components";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

const SelectedRow = styled.tr`
  background-color: #e3f2fd;
  &:hover {
    background-color: #bbdefb;
  }
`;

type TCRow = {
  id: string;
  measureName: string;
  version: string;
  actions: Measure;
  hasAssociatedMeasures: boolean;
  cmsId?: string;
  updated: string;
};

export const ROW_EXPANSION_ERROR =
  "Failed to fetch measures for measure set. Please try again. If the issue persists, contact helpdesk.";
const NO_RESULTS = "No results were found";
const NO_RESULTS_FOR_MODEL =
  "There are no measures that belong to the same model.";

export default function AddComponentsDialog({
  open,
  onClose,
  measure,
  compositeScoring,
  components,
  submitComponentForm,
}) {
  // we need to know what measures are added by means of component selection
  const preselectedIds = useMemo(
    () => new Set((components ?? []).map((c) => c.id)),
    [components]
  );

  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // Map of measureSetId -> expanded sub-rows (supports multiple expanded rows)
  const [expandedSectionMap, setExpandedSectionMap] = useState<
    Record<string, TCRow[]>
  >({});
  const abortController = useRef(null);
  const [expandedRowSelection, setExpandedRowSelection] = useState({});

  // Use custom hook for filter and search functionality
  const {
    filterBy,
    searchField,
    finalSearchAndFilterby,
    handleFilter,
    handleSearch,
    finalizeSearchCriteria,
    blankSearchCriteria,
  } = useMeasureFilterSearch(() => setPage(0));

  const [measureList, setMeasureList] = useState<Measure[]>([]);

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    type: "danger",
    message: "",
  });

  useEffect(() => {
    setRowSelection((prev) => {
      if (!measureList?.length) {
        return Object.keys(prev).length ? {} : prev;
      }

      let changed = false;
      const next = { ...prev };

      for (const m of measureList) {
        if (m?.id && preselectedIds.has(m.id) && !next[m.id]) {
          next[m.id] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [measureList, preselectedIds]);

  const IndeterminateCheckbox = ({ indeterminate, checked, ...rest }: any) => {
    const ref = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (ref.current) {
        ref.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return <input type="checkbox" ref={ref} checked={checked} {...rest} />;
  };

  const transFormData = (measureList): TCRow[] => {
    return measureList.map((measure) => ({
      id: measure?.id,
      measureName: measure?.measureName,
      version: measure?.version,
      actions: measure,
      hasAssociatedMeasures: measure?.hasAssociatedMeasures,
      lastModifiedAt: measure?.lastModifiedAt,
    }));
  };

  const handleRowClick = async (row) => {
    const isRowCurrentlyExpanded =
      expandedSectionMap[row?.measureSetId]?.length > 0;

    if (!isRowCurrentlyExpanded) {
      const searchCriteria: any = {
        fromCompositeMeasureComponent: true,
        allowedScoringTypes: getAllowedScoringTypes(compositeScoring),
      };
      try {
        const results = await measureServiceApi.getMeasuresByMeasureSetId(
          row?.measureSetId,
          true,
          searchCriteria
        );

        const filteredResults = results.filter(
          (result) => result.id !== row?.id && result.id !== measure?.id
        );
        setExpandedSectionMap((prev) => ({
          ...prev,
          [row.measureSetId]: transFormData(filteredResults),
        }));
      } catch (error: any) {
        console.error(
          "Failed to fetch measures for measure set:",
          error?.measure
        );
        setToast({
          open: true,
          type: "danger",
          message: ROW_EXPANSION_ERROR,
        });
      }
    } else {
      setExpandedSectionMap((prev) => {
        const newState = { ...prev };
        delete newState[row.measureSetId];
        return newState;
      });
    }
  };

  useEffect(() => {
    if (open) {
      // Sync main table row selection with preselected IDs
      const newRowSelection = {};
      preselectedIds.forEach((id: any) => {
        newRowSelection[id] = true;
      });
      setRowSelection(newRowSelection);
    } else {
      // Reset all expanded state when dialog closes
      setExpandedRowSelection({});
      setExpandedSectionMap({});
    }
  }, [open, preselectedIds]);

  // Auto-expand rows whose measureSetId matches any component's measureSetId on table load
  useEffect(() => {
    if (!open || !measureList?.length || !components?.length) {
      return;
    }

    const componentMeasureSetIds = new Set(
      components.map((c) => c.measureSetId).filter(Boolean)
    );

    // expand the row by default if component selected is not the latest version in the measure set
    for (const measure of measureList) {
      if (
        componentMeasureSetIds.has(measure.measureSetId) &&
        !expandedSectionMap[measure.measureSetId] &&
        !components.some((component) => component.id === measure.id)
      ) {
        handleRowClick(measure);
      }
    }
  }, [measureList, open]);

  // Sync expanded row selection with preselected IDs whenever expanded data changes
  useEffect(() => {
    if (open && Object.keys(expandedSectionMap).length > 0) {
      const newExpandedRowSelection: Record<string, boolean> = {};
      Object.values(expandedSectionMap).forEach((rows) => {
        rows.forEach((row) => {
          if (preselectedIds.has(row.actions.id)) {
            newExpandedRowSelection[row.id] = true;
          }
        });
      });
      setExpandedRowSelection(newExpandedRowSelection);
    }
  }, [expandedSectionMap, preselectedIds, open]);

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [
      {
        id: "select",
        header: ({ table }) => {
          const visibleRows = table.getRowModel().rows;

          const allVisibleSelected = visibleRows.every((row) =>
            row.getIsSelected()
          );
          const someVisibleSelected = visibleRows.some((row) =>
            row.getIsSelected()
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
        cell: ({ row }) => {
          return (
            <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
              <div className="px-1">
                <IndeterminateCheckbox
                  indeterminate={row.getIsSomeSelected?.()}
                  checked={row.getIsSelected()}
                  onChange={row.getToggleSelectedHandler()}
                  aria-label={`Toggle row ${row.id}`}
                />
              </div>
            </div>
          );
        },
      },
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
          </>
        ),
        accessorKey: "version",
      },
      {
        header: "CMS ID",
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original?.measureSet?.cmsId)}
            maxLength={20}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "cmsId",
      },
      {
        header: "Updated",
        cell: (info) => {
          const converted = convertDate(info.row.original.lastModifiedAt);
          const { date } = converted;
          return <div>{date}</div>;
        },
        accessorKey: "lastModifiedAt",
      },
      {
        header: "",
        cell: (info) => {
          if (info.row.original?.hasAssociatedMeasures) {
            const handleKeyDown = (e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleRowClick(info.row.original);
              }
            };
            return (
              <span
                role="button"
                tabIndex={0}
                onClick={() => {
                  handleRowClick(info.row.original);
                }}
                onKeyDown={handleKeyDown}
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {expandedSectionMap[info.row.original.measureSetId]?.length >
                0 ? (
                  <CollapseIcon />
                ) : (
                  <ExpandIcon />
                )}
              </span>
            );
          } else {
            return <></>;
          }
        },
        accessorKey: "expandArrow",
      },
    ];

    return columnDefs;
  }, [expandedSectionMap]);

  const getAllowedScoringTypes = (compositeScoring: string) => {
    if (
      compositeScoring === "Opportunity" ||
      compositeScoring === "All-or-nothing"
    ) {
      return [MeasureScoring.PROPORTION, MeasureScoring.RATIO];
    } else if (compositeScoring === "Linear") {
      return [
        MeasureScoring.PROPORTION,
        MeasureScoring.RATIO,
        MeasureScoring.CONTINUOUS_VARIABLE,
      ];
    }
    return [];
  };

  const fetchMeasures = useCallback(() => {
    if (!measure || !measure.model || !measure.id || !open) {
      return;
    }
    setLoading(true);
    abortController.current = new AbortController();
    const { finalSearchField, finalFilterBy } = finalSearchAndFilterby;
    const optionalSearchProperties = [];

    if (finalFilterBy) {
      optionalSearchProperties.push(filterMap[finalFilterBy]);
    }

    if (!finalFilterBy && finalSearchField) {
      // apply all conditions
      filterByOptions.forEach((condition) => {
        optionalSearchProperties.push(filterMap[condition]);
      });
    }

    const searchCriteria: any = {
      model: measure.model,
      excludeByMeasureIds: [measure.id],
      optionalSearchProperties,
      draft: false,
      fromCompositeMeasureComponent: true,
      allowedScoringTypes: getAllowedScoringTypes(compositeScoring),
      searchField: finalSearchField,
      // already selected components should be prioritized on top, so pass their measureSetIds to backend for sorting priority
      priorityMeasureSets: components?.map((c) => c.measureSetId) || [],
    };

    measureServiceApi
      .searchMeasuresByCriteria(
        [OwnershipType.ALL],
        limit,
        page,
        "lastModifiedAt",
        "DESC",
        searchCriteria,
        abortController.current
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
  }, [
    measure,
    open,
    finalSearchAndFilterby,
    compositeScoring,
    measureServiceApi,
    limit,
    page,
  ]);

  useEffect(() => {
    fetchMeasures();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchMeasures, measure?.id]);

  const [rowSelection, setRowSelection] = useState({});
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
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
  });

  const handleDialogClose = () => {
    onClose();
  };

  const handleDialogSubmit = async (e) => {
    e.preventDefault();
    // required: to prevent event bubbling to parent forms
    e.stopPropagation();
    // make shallow copy of what we already have
    const newComponents = [];
    // get all the objectIds of the selected measures
    const selectedMeasureObjectIds = Object.keys(rowSelection);
    const results = await measureServiceApi.fetchMeasuresByIds(
      selectedMeasureObjectIds
    );
    results.forEach((measure) => {
      measure.groups.forEach((group) => {
        newComponents.push({
          measureId: measure.id,
          groupId: group.id,
        });
      });
    });
    const uniqueComponents = _.uniqBy(
      newComponents,
      (c) => `${c.measureId}:${c.groupId}`
    );
    submitComponentForm(uniqueComponents);
    onClose();
  };

  const expandedColumns = useMemo<ColumnDef<TCRow>[]>(() => {
    return [
      {
        id: "select",
        header: null,
        cell: ({ row }) => (
          <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
            <div className="px-1">
              <IndeterminateCheckbox
                checked={expandedRowSelection[row.id] || false}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  if (isChecked) {
                    setExpandedRowSelection((prev) => ({
                      ...prev,
                      [row.id]: true,
                    }));
                    setRowSelection((prev) => ({
                      ...prev,
                      [row.original.actions.id]: true,
                    }));
                  } else {
                    setExpandedRowSelection((prev) => {
                      const newState = { ...prev };
                      delete newState[row.id];
                      return newState;
                    });
                    setRowSelection((prev) => {
                      const newState = { ...prev };
                      delete newState[row.original.actions.id];
                      return newState;
                    });
                  }
                }}
                aria-label={`Toggle expanded row ${row.id}`}
                style={{
                  accentColor: expandedRowSelection[row.id]
                    ? "#2196F3"
                    : "inherit",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>
        ),
      },
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
      },
      {
        header: "Version",
        cell: (info) => (
          <TruncateText
            text={info.row.original.actions?.version}
            maxLength={20}
            dataTestId={`measure-version-${info.row.original.id}`}
          />
        ),
        accessorKey: "version",
      },
      {
        header: "CMS ID",
        cell: (info) => (
          <TruncateText
            text={(() => {
              const cmsId =
                info.row.original.actions?.measureSet?.cmsId?.toString();
              const model = info.row.original.actions?.model;

              if (!cmsId) return "";
              return model?.startsWith("QI-Core") ? `${cmsId}FHIR` : cmsId;
            })()}
            maxLength={60}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureSet.cmsId",
      },
      {
        header: "Updated",
        cell: (info) => (
          <span>
            {new Date(
              info.row.original.actions.lastModifiedAt
            ).toLocaleDateString()}
          </span>
        ),
        accessorKey: "lastModifiedAt",
        sortingFn: (rowA, rowB) =>
          new Date(rowA.original.actions.lastModifiedAt).getTime() -
          new Date(rowB.original.actions.lastModifiedAt).getTime(),
      },
      {
        header: "",
        cell: () => null,
      },
    ];
  }, [expandedRowSelection]);

  return (
    <MadieDialog
      form
      title="Select Composite Measure Components"
      dialogProps={{
        onClose: handleDialogClose,
        open,
        onSubmit: handleDialogSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "select-composite-measure-components-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "select-composite-measure-components-continue-button",
        continueText: "Continue",
      }}
      maxWidth={"lg"}
    >
      <MeasureSearchFilters
        filterBy={filterBy}
        searchField={searchField}
        onFilterChange={handleFilter}
        onSearchChange={handleSearch}
        onSearchTrigger={finalizeSearchCriteria}
        onSearchClear={blankSearchCriteria}
      />
      <div className="measure-table no-margin-top">
        <div className="table" style={{ overflow: "auto" }}>
          <table
            tw="min-w-full"
            data-testid="measure-list-tbl"
            className="ml-table"
            style={{
              borderSpacing: "0 2em !important",
              borderBottom: "1px solid rgb(140, 140, 140)",
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
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <MadieSpinner style={{ height: 50, width: 50 }} />
                </div>
              ) : _.isEmpty(measureList) ? (
                <tr>
                  <td colSpan={columns.length} tw="text-center p-2">
                    {finalSearchAndFilterby.finalSearchField
                      ? NO_RESULTS
                      : NO_RESULTS_FOR_MODEL}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr
                      key={row.id}
                      className="ml-tr"
                      data-testid={`row-item`}
                      style={{
                        borderTop: "solid 1px #8c8c8c",
                        borderSpacing: "0 2em !important",
                        ...(row.getIsSelected() && {
                          backgroundColor: "#e3f2fd",
                        }),
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
                    {expandedSectionMap[row.original.measureSetId]?.map(
                      (subRow) => (
                        <SelectedRow
                          key={subRow.id}
                          className="expanded-row"
                          style={{
                            backgroundColor: expandedRowSelection[subRow.id]
                              ? "#e3f2fd"
                              : "white",
                            borderTop: "solid 1px #8c8c8c",
                          }}
                          data-testid={`expanded-row-${subRow.id}`}
                        >
                          {expandedColumns.map((column: any) => (
                            <td key={column?.accessorKey || column.id}>
                              {flexRender(column.cell ?? column.accessorKey, {
                                row: {
                                  id: subRow.id,
                                  original: subRow,
                                  getIsSelected: () =>
                                    expandedRowSelection[subRow.id] || false,
                                },
                                getValue: () => subRow[column.accessorKey],
                              })}
                            </td>
                          ))}
                        </SelectedRow>
                      )
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      <Toast
        toastKey="expand-measure-set-toast"
        testId="expand-measure-set-toast"
        toastType={toast.type}
        open={toast.open}
        message={toast.message}
        onClose={() =>
          setToast({
            open: false,
            type: "danger",
            message: "",
          })
        }
        autoHideDuration={8000}
      />
    </MadieDialog>
  );
}
