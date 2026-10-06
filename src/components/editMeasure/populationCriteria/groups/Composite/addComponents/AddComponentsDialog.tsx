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
  MadieTable,
  SearchAndFilter,
  useFilterSearch,
  filterByOptions,
  filterMap,
} from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  CollapseIcon,
  ExpandIcon,
} from "../../../../../../icons/MeasureListTableRightArrowIcons";
import { Measure, OwnershipType } from "@madie/madie-models";
import * as _ from "lodash";
import {
  useMeasureServiceApi,
  formatCmsId,
  getAllowedScoringTypes,
} from "@madie/madie-util";
import "../../../../../measureLanding/MeasureLanding.scss";
import { convertDate } from "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable";
import styled from "styled-components";
import "./AddComponentsDialog.scss";

const DEFAULT_PAGE_LIMIT = 5;

type TableMeasure = Measure & {
  isPlaceholder?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
};

const EMPTY_TABLE_ROW: TableMeasure = {
  id: "__add-components-table-empty-row__",
  measureName: "",
  isPlaceholder: true,
} as TableMeasure;

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
  translatorVersion: string;
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
  const [limit, setLimit] = useState(DEFAULT_PAGE_LIMIT);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
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
  } = useFilterSearch(() => setPage(0));

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
        return prev;
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
      translatorVersion: measure?.translatorVersion,
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
  const resetDialogState = () => {
    setExpandedRowSelection({});
    setExpandedSectionMap({});
    setPage(0);
    setLimit(DEFAULT_PAGE_LIMIT);
    setSorting([]);
    blankSearchCriteria();
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
      resetDialogState();
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

  const columns = useMemo<ColumnDef<TableMeasure>[]>(() => {
    const columnDefs = [
      {
        id: "select",
        header: ({ table }) => {
          const visibleRows = table
            .getRowModel()
            .rows.filter((row) => !row.original.isPlaceholder);

          const allVisibleSelected =
            visibleRows.length > 0 &&
            visibleRows.every((row) => row.getIsSelected());
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
          if (row.original.isPlaceholder) {
            return null;
          }
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
        cell: (info) =>
          info.row.original.isPlaceholder ? (
            <div className="add-components-table-status">
              {info.row.original.isLoading ? (
                <MadieSpinner style={{ height: 50, width: 50 }} />
              ) : (
                info.row.original.emptyMessage
              )}
            </div>
          ) : (
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
        cell: (info) =>
          info.row.original.isPlaceholder ? null : (
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
        cell: (info) =>
          info.row.original.isPlaceholder ? null : (
            <TruncateText
              text={formatCmsId(info.getValue(), info.row.original?.model)}
              maxLength={20}
              dataTestId={`measure-cmsId-${info.row.original.id}`}
            />
          ),
        id: "cmsId",
        accessorFn: (row) => row.measureSet?.cmsId,
        sortDescFirst: false,
      },
      {
        header: "Translator",
        cell: (info) =>
          info.row.original.isPlaceholder ? null : (
            <TruncateText
              text={info.row.original?.translatorVersion}
              maxLength={20}
              dataTestId={`translator-version-${info.row.original.id}`}
            />
          ),
        accessorKey: "translatorVersion",
      },
      {
        header: "Updated",
        cell: (info) => {
          if (info.row.original.isPlaceholder) {
            return null;
          }
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

  const tableData = useMemo<TableMeasure[]>(
    () =>
      measureList.length > 0
        ? measureList
        : [
            {
              ...EMPTY_TABLE_ROW,
              isLoading: loading,
              emptyMessage: finalSearchAndFilterby.finalSearchField
                ? NO_RESULTS
                : NO_RESULTS_FOR_MODEL,
            },
          ],
    [measureList, loading, finalSearchAndFilterby.finalSearchField]
  );

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

    const currentSort =
      sorting[0]?.id === "cmsId"
        ? "measureSet.cmsId"
        : sorting[0]?.id || "lastModifiedAt";
    const currentDirection = sorting[0]
      ? sorting[0].desc
        ? "DESC"
        : "ASC"
      : "DESC";

    measureServiceApi
      .searchMeasuresByCriteria(
        [OwnershipType.ALL],
        limit,
        page,
        currentSort,
        currentDirection,
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
    sorting,
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
  const handleSortingChange = (
    updaterOrValue: React.SetStateAction<SortingState>
  ) => {
    setSorting(updaterOrValue);
    setPage(0);
  };
  const handleSort = (sort: string) => {
    setSorting((currentSorting) => {
      const activeSort = currentSorting[0];
      if (activeSort?.id !== sort) {
        return [{ id: sort, desc: false }];
      }
      return activeSort.desc ? [] : [{ id: sort, desc: true }];
    });
    setPage(0);
  };
  const handleSearchTrigger = () => {
    finalizeSearchCriteria();
    setPage(0);
  };

  const table = useReactTable({
    data: tableData,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange: handleSortingChange,
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
            text={formatCmsId(
              info.row.original.actions?.measureSet?.cmsId,
              info.row.original.actions?.model
            )}
            maxLength={60}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureSet.cmsId",
      },
      {
        header: "Translator",
        cell: (info) => (
          <TruncateText
            text={info.row.original?.translatorVersion}
            maxLength={20}
            dataTestId={`translator-version-${info.row.original.id}`}
          />
        ),
        accessorKey: "translatorVersion",
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
      <div className="dialog-measure-search-filters">
        <SearchAndFilter
          filterBy={filterBy}
          searchField={searchField}
          onFilterChange={handleFilter}
          onSearchChange={handleSearch}
          onSearchTrigger={handleSearchTrigger}
          onSearchClear={blankSearchCriteria}
          filterByOpts={filterByOptions}
          textFieldID="test-cases"
        />
      </div>
      <div className="measure-table no-margin-top add-components-table">
        <div className="table" style={{ overflow: "auto" }}>
          <div
            onClickCapture={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("thead button")
              ) {
                event.preventDefault();
              }
            }}
          >
            <MadieTable
              table={table}
              currentSort={sorting[0]?.id}
              currentDirection={
                sorting.length > 0
                  ? sorting[0].desc
                    ? "DESC"
                    : "ASC"
                  : undefined
              }
              handleSort={handleSort}
              id="addComponentsDialogTable"
              dataTestId="measure-list-tbl"
              renderExpandedRow={(row) =>
                expandedSectionMap[row.original.measureSetId]?.map((subRow) => (
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
                ))
              }
            />
          </div>
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
          setPage(0);
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
