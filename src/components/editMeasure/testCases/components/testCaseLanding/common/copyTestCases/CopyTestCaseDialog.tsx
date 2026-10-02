import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Chip } from "@mui/material";
import {
  MadieDialog,
  MadieSpinner,
  MadieTable,
  TruncateText,
  Pagination,
  SearchAndFilter,
  useFilterSearch,
  filterMap,
  filterByOptions,
} from "@madie/madie-design-system/dist/react";

import * as _ from "lodash";
import "../../../../../../measureLanding/MeasureLanding.scss";
import "./CopyTestCaseDialog.scss";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ExpandIcon,
  CollapseIcon,
} from "../../../../../../../icons/MeasureListTableRightArrowIcons";
import {
  Measure,
  OwnershipType,
  TestCase,
  ValidationStatus,
} from "@madie/madie-models";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import Typography from "@mui/material/Typography";
import {
  useMeasureServiceApi,
  useFeatureFlags,
  formatCmsId,
} from "@madie/madie-util";

const CopyTestCaseDialog = ({ open, onClose, measure, selectedTestCases }) => {
  const measureSearchApi = useRef(useMeasureServiceApi());
  const testCaseServiceApi = useRef(useTestCaseServiceApi());
  const abortController = useRef(null);

  // utilities for pagination
  const [limit, setLimit] = useState(5);
  const [page, setPage] = useState(0);
  const [currentSort, setCurrentSort] = useState<string>("lastModifiedAt");
  const [currentDirection, setCurrentDirection] = useState<string>("DESC");
  const [selectedRowId, setSelectedRowId] = React.useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);

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

  const handleSearchTrigger = () => {
    finalizeSearchCriteria();
    setPage(0);
  };

  const [selectedIdForExpansion, setSelectedIdForExpansion] = useState(null);
  const [isRowExpanded, setIsRowExpanded] = useState<boolean>(false);
  const [expandedSectionData, setExpandedSectionData] = useState<TCRow[]>([]);
  const featureFlags = useFeatureFlags();

  type TCRow = {
    id: string;
    measureName: string;
    version: string;
    actions: Measure;
    hasAssociatedMeasures: boolean;
    cmsId?: string;
  };

  const transFormData = (measureList): TCRow[] => {
    return measureList.map((measure) => ({
      id: measure?.id,
      measureName: measure?.measureName,
      version: measure?.version,
      actions: measure,
      hasAssociatedMeasures: measure?.hasAssociatedMeasures,
    }));
  };

  // measures owned or shared for the current user excluding the current measure
  const [measureList, setMeasureList] = useState<Measure[]>([]);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [continueDisabled, setContinueDisabled] = useState<boolean>(
    _.isEmpty(selectedRowId)
  );
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

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
    // We have a condition when we first load the table where we don't want to apply the filters.
    // We want this to still fire, so we only want to append all possible filters for when "-" is selected in filters, if a searchValue is also provided
    if (!finalFilterBy && finalSearchField) {
      // apply all conditions
      filterByOptions.forEach((condition) => {
        optionalSearchProperties.push(filterMap[condition]);
      });
    }

    const searchCriteria: any = {
      searchField: finalSearchField,
      model: measure.model,
      excludeByMeasureIds: [measure.id],
      optionalSearchProperties,
      excludeCompositeMeasures: true,
    };

    // Always allow searching all measures (including versioned ones)
    measureSearchApi.current
      .searchMeasuresByCriteria(
        [OwnershipType.OWNED, OwnershipType.SHARED],
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
    // usually we'd attach the filter conditions as url params, but I don't think it makes sense if it's part of a dialog.
    // may be a smarter way to do this using a non controlled component, but it's not apparent to me now
  }, [
    measure,
    limit,
    page,
    currentSort,
    currentDirection,
    finalSearchAndFilterby,
    open,
  ]);

  const handleSort = (sort: string) => {
    let sortChange = "lastModifiedAt";
    let directionChange = "DESC";
    if (sort === currentSort) {
      if (currentDirection === "ASC") {
        sortChange = sort;
        directionChange = "DESC";
      } else if (currentDirection === "DESC") {
        sortChange = "";
        directionChange = "";
      }
    } else {
      sortChange = sort;
      directionChange = "ASC";
    }
    setCurrentSort(sortChange);
    setCurrentDirection(directionChange);
    setPage(0);
  };

  const [allTestCases, setAllTestCases] = useState<TestCase[]>([]);
  const retrieveTestCases = useCallback(() => {
    testCaseServiceApi.current
      .getTestCasesByMeasureId(measure?.id)
      .then((testCaseList: TestCase[]) => {
        setAllTestCases(testCaseList);
      })
      .catch((err) => {
        console.error("Error retrieving test cases:", err);
      });
  }, [measure?.id]);

  useEffect(() => {
    if (measure?.id) {
      retrieveTestCases();
    }
  }, [measure?.id, retrieveTestCases]);

  // This effect is used to determine if the test cases can be copied based on their validation status
  useEffect(() => {
    if (allTestCases?.length > 0 && selectedTestCases?.length > 0) {
      const selectedTestCaseIds = selectedTestCases.map((tc) => tc.id);
      setCannotCopy(
        allTestCases.some(
          (tc) =>
            measure?.model === "QI-Core v6.0.0" &&
            selectedTestCaseIds.includes(tc.id) &&
            (tc.validationStatus === ValidationStatus.PENDING ||
              tc.validationStatus === ValidationStatus.VALIDATING)
        )
      );
    }
  }, [selectedTestCases, measure?.id, allTestCases]);

  useEffect(() => {
    fetchMeasures();
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [fetchMeasures, measure?.id]);

  const [cannotCopy, setCannotCopy] = useState<boolean>(false);
  useEffect(() => {
    let timer;
    if (open && cannotCopy) {
      // Set a timeout to close the modal after the specified delay
      timer = setTimeout(() => {
        onClose();
      }, 3000);
    }

    // Cleanup function to clear the timeout if the modal is closed manually
    // or the component unmounts before the timer expires
    return () => {
      clearTimeout(timer);
    };
  }, [open, onClose, cannotCopy]); // Re-run effect when these props change

  const handleRowClick = async (actions) => {
    if (!isRowExpanded || selectedIdForExpansion !== actions?.measureSetId) {
      setSelectedIdForExpansion(actions?.measureSetId);
      const results = await measureServiceApi.getMeasuresByMeasureSetId(
        actions?.measureSetId,
        true
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
    setContinueDisabled(_.isEmpty(selectedRowId));
    const columnDefs = [];
    columnDefs.push({
      accessorKey: "",
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

    const updatedColumns = [
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
        header: "Status",
        cell: (info) => (
          <>
            {`${info.row.original.measureMetaData?.draft}` === "true" && (
              <Chip className="chip-draft" label="Draft" />
            )}
          </>
        ),
        accessorKey: "measureMetaData.draft",
      },
      {
        header: "CMS ID",
        cell: (info) => (
          <TruncateText
            text={formatCmsId(
              info.row.original?.measureSet?.cmsId,
              info.row.original?.model
            )}
            maxLength={20}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureSet.cmsId",
      },
    ];

    // Always show the expand column for versioned measures
    updatedColumns.push({
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
      enableSorting: false,
    });

    return updatedColumns;
  }, [
    selectedRowId,
    selectedIdForExpansion,
    isRowExpanded,
    expandedSectionData,
  ]);

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
  });

  const onSubmit = async (e) => {
    if (_.isEmpty(selectedRowId)) {
      return;
    }
    setExecuting(true);
    setContinueDisabled(true);
    testCaseServiceApi.current
      .copyTestCasesToMeasure(
        measure.id,
        selectedRowId,
        selectedTestCases?.map((tc: TestCase) => tc.id)
      )
      .then((result) => {
        if (
          // All copied successfully
          result?.copiedTestCases?.length ===
          selectedTestCases?.map((tc: TestCase) => tc.id).length
        ) {
          result.didClearExpectedValues
            ? onClose(
                "Test Cases successfully copied without expected values due to differing Population Criteria on target Measure.",
                "success"
              )
            : onClose("Test Cases have been successfully copied.", "success");
        } else {
          const failedTestCases: string[] = result?.failedTestCases?.map((tc) =>
            !tc.series ? tc.title : tc.title + " - " + tc.series
          );
          // Partial copy success
          if (result?.copiedTestCases?.length > 0) {
            if (result.didClearExpectedValues) {
              failedTestCases?.length > 0
                ? onClose(
                    `${result.copiedTestCases.length} test cases have been successfully copied without expected values due to differing Population Criteria on target Measure. The following ${failedTestCases.length} test cases could not be copied because the test cases are duplicates and the title is too long to copy.`,
                    null,
                    failedTestCases
                  )
                : onClose(
                    "Test Cases have been successfully copied without expected values due to differing Population Criteria on target Measure. Some Test Cases could not be copied.",
                    "warning"
                  );
            } else {
              failedTestCases?.length > 0
                ? onClose(
                    `${result.copiedTestCases.length} test cases were copied successfully. The following ${failedTestCases.length} test cases could not be copied because the test cases are duplicates and the title is too long to copy.`,
                    null,
                    failedTestCases
                  )
                : onClose(
                    "Test Cases have been successfully copied. Some Test Cases could not be copied.",
                    "warning"
                  );
            }
            // All failed
          } else {
            // one or more failed due to new test case name exceeding max length of 250.
            failedTestCases?.length > 0
              ? onClose(
                  `0 test cases were copied successfully. The following ${failedTestCases.length} test cases could not be copied because the test cases are duplicates and the title is too long to copy.`,
                  null,
                  failedTestCases
                )
              : onClose("Test Cases could not be copied.", "danger");
          }
        }
      })
      .catch((e) => {
        console.error(e);
        onClose(
          "Unable to copy Test Cases. Please contact the Help Desk.",
          "danger"
        );
      })
      .finally(() => {
        setExecuting(false);
      });
  };

  const handleDialogClose = (e) => {
    onClose();
  };

  const expandedColumns = useMemo<ColumnDef<Measure>[]>(() => {
    return columns;
  }, [columns]);

  return (
    <MadieDialog
      form
      title="Copy To"
      dialogProps={{
        onClose: handleDialogClose,
        open,
        onSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "copy-test-cases-cancel-button",
        disabled: executing,
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "copy-test-cases-continue-button",
        continueText: "Save",
        disabled: continueDisabled,
      }}
      maxWidth={"lg"}
    >
      {!executing && !cannotCopy && (
        <div id="measure-landing" data-testid="measure-landing">
          <div style={{ margin: "0 32px 40px 32px" }}>
            <SearchAndFilter
              filterBy={filterBy}
              searchField={searchField}
              onFilterChange={handleFilter}
              onSearchChange={handleSearch}
              onSearchTrigger={handleSearchTrigger}
              onSearchClear={blankSearchCriteria}
            />
          </div>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <MadieSpinner style={{ height: 50, width: 50 }} />
            </div>
          )}
          <div
            className="measure-table no-margin-top"
            style={{ display: loading ? "none" : "block" }}
          >
            <div className="table" style={{ overflow: "auto" }}>
              <MadieTable
                table={table}
                currentSort={currentSort}
                currentDirection={currentDirection}
                handleSort={handleSort}
                id="copyTestCaseMeasureTable"
                dataTestId="measure-list-tbl"
                emptyMessage="You don't have any other measures that you own or are shared with you, belonging to the same model."
                renderExpandedRow={(row) =>
                  selectedIdForExpansion === row.original.measureSetId &&
                  expandedSectionData?.map((subRow) => (
                    <tr key={subRow.id} className="expanded-row">
                      {expandedColumns.map((column: any) => (
                        <td key={column?.accessorKey || column.id}>
                          {column.accessorKey === "measureSet.cmsId"
                            ? formatCmsId(
                                subRow?.actions?.measureSet?.cmsId,
                                subRow?.actions?.model
                              )
                            : flexRender(column.cell ?? column.accessorKey, {
                                row: { original: subRow },
                                getValue: () => subRow[column.accessorKey],
                              })}
                        </td>
                      ))}
                    </tr>
                  ))
                }
              />
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
      )}
      {executing && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MadieSpinner style={{ height: 50, width: 50 }} />
            <Typography color="inherit">Copying Test Cases...</Typography>
          </div>
        </>
      )}
      {cannotCopy && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "1rem",
          }}
          data-testid="copy-test-cases-cannot-copy-message"
          aria-describedby="copy-test-cases-cannot-copy-message-description"
        >
          <Typography color="error">
            Some of the selected test cases are pending validation. Test cases
            cannot be copied at this time. Once validations are complete, please
            try again.
          </Typography>
        </div>
      )}
    </MadieDialog>
  );
};

export default CopyTestCaseDialog;
