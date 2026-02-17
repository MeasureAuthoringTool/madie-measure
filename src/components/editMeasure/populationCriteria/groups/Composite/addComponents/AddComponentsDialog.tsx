import React, {
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

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

type TCRow = {
  id: string;
  measureName: string;
  version: string;
  actions: Measure;
  hasAssociatedMeasures: boolean;
  cmsId?: string;
  updated: string;
};

export default function AddComponentsDialog({
  open,
  onClose,
  measure,
  compositeScoring,
}) {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedIdForExpansion, setSelectedIdForExpansion] = useState(null);
  const [isRowExpanded, setIsRowExpanded] = useState<boolean>(false);
  const [expandedSectionData, setExpandedSectionData] = useState<TCRow[]>([]);
  const abortController = useRef(null);

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

  const handleRowClick = async (actions) => {
    if (!isRowExpanded || selectedIdForExpansion !== actions?.measureSetId) {
      setSelectedIdForExpansion(actions?.measureSetId);

      const searchCriteria: any = {
        fromCompositeMeasureComponent: true,
        allowedScoringTypes: getAllowedScoringTypes(compositeScoring),
      };

      const results = await measureServiceApi.getMeasuresByMeasureSetId(
        actions?.measureSetId,
        true,
        searchCriteria
      );

      const filteredResults = results.filter(
        (result) => result.id !== actions?.id && result.id !== measure?.id
      );
      setIsRowExpanded(true);
      setExpandedSectionData(transFormData(filteredResults));
    } else {
      setIsRowExpanded(false);
      setExpandedSectionData(null);
      setSelectedIdForExpansion(null);
    }
  };

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

        cell: (info) => (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 16,
            }}
          >
            <div className="px-1">
              <IndeterminateCheckbox />
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
          return <div style={{ marginLeft: "8px" }}>{date}</div>;
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
                {isRowExpanded &&
                selectedIdForExpansion === info.row.original.measureSetId ? (
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
  }, [
    selectedRowId,
    selectedIdForExpansion,
    isRowExpanded,
    expandedSectionData,
  ]);

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
    setSelectedRowId(null);
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

  const handleDialogClose = () => {
    onClose();
  };

  const handleDialogSubmit = (e) => {
    e.preventDefault();
    // required: to prevent event bubbling to parent forms
    e.stopPropagation();
  };

  const expandedColumns = useMemo<ColumnDef<Measure>[]>(() => {
    return columns;
  }, [columns]);

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
        continueText: "Save",
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
                    There are no measures that belong to the same model.
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
                    {selectedIdForExpansion === row.original.measureSetId &&
                      expandedSectionData?.map((subRow) => (
                        <tr key={subRow.id} className="expanded-row">
                          {expandedColumns.map((column: any) => (
                            <td key={column?.accessorKey || column.id}>
                              {column.accessorKey === "cmsId"
                                ? subRow?.actions?.measureSet?.cmsId || ""
                                : flexRender(
                                    column.cell ?? column.accessorKey,
                                    {
                                      row: { original: subRow },
                                      getValue: () =>
                                        subRow[column.accessorKey],
                                    }
                                  )}
                            </td>
                          ))}
                        </tr>
                      ))}
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
    </MadieDialog>
  );
}
