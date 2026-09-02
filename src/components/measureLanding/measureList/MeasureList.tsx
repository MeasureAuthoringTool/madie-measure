import React, {
  Dispatch,
  HTMLProps,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { Measure, Model } from "@madie/madie-models";
import {
  useMeasureServiceApi,
  useUserServiceApi,
  checkUserCanEdit,
  useUserRoles,
  useFeatureFlags,
  ExportDialog,
  ViewHRModal,
  ViewMeasureHistoryDialog,
  CompareVersionsDialog,
  exportMeasure as downloadMeasureExport,
  ShareDialog,
  TransferDialog,
  ManageReviewDialog,
  REVIEW_STATUS_OPTIONS,
  formatCmsId,
  padCmsId,
  validateCompositeMeasure,
} from "@madie/madie-util";
import { useNavigate } from "react-router-dom";
import { Chip, Tooltip } from "@mui/material";
import {
  Button,
  TruncateText,
  MadieTooltipIcon,
  MadieTable,
  MadieDeleteDialog,
  SearchAndFilter,
  useFilterSearch,
} from "@madie/madie-design-system/dist/react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import "../../editMeasure/testCases/components/testCaseLanding/common/TestCase.scss";
import InvalidTestCaseDialog from "../../common/invalidTestCaseDialog/InvalidTestCaseDialog";
import CreatVersionDialog from "../../common/createVersionDialog/CreateVersionDialog";
import DraftMeasureDialog from "../../common/draftMeasureDialog/DraftMeasureDialog";
import versionErrorHelper from "../../../utils/versionErrorHelper";
import VersioningErrorDialog from "./versioningErrorDialog/VersioningErrorDialog";
import getLibraryNameErrors from "./versioningErrorDialog/getLibraryNameErrors";
import AssociateCmsIdDialog from "./associateCmsIdDialog/AssociateCmsIdDialog";
import ActionCenter, {
  ALL_REVIEWS_TAB,
  MY_REVIEWS_TAB,
} from "./actionCenter/ActionCenter";
import {
  ExpandIcon,
  CollapseIcon,
} from "../../../icons/MeasureListTableRightArrowIcons";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { MeasureSearchCriteria } from "../MeasureLanding";
import queryString from "query-string";
import { getTabStorageKey } from "../measureLandingUtils";
import ReviewDialog from "../../common/reviewDialog/ReviewDialog";

const COMPONENT_MEASURE_MSG =
  "This measure is a component of a composite measure";

export const shouldShowReviewerTooltip = (
  reviewStatus?: string,
  reviewers?: string[]
): boolean => {
  return (
    !!reviewStatus &&
    REVIEW_STATUS_OPTIONS.includes(reviewStatus) &&
    !!reviewers?.length
  );
};

// Export customSort for testing purposes
export function customSort(a: string, b: string) {
  if (a === undefined || a === "") {
    return 1;
  } else if (b === undefined || b === "") {
    return -1;
  }
  const aComp = a.trim().toLocaleLowerCase();
  const bComp = b.trim().toLocaleLowerCase();
  if (aComp < bComp) return -1;
  if (aComp > bComp) return 1;
  return 0;
}

// Display chips for draft, composite and in-composite state
const MeasureStatusChips = ({ measure }) => {
  return (
    <div
      style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}
      aria-label="Measure status"
    >
      {measure.measureMetaData?.draft && (
        <Chip
          className="chip-draft"
          label="Draft"
          role="status"
          aria-label="Draft"
        />
      )}
      {measure.measureMetaData?.composite && (
        <Chip
          className="chip-composite"
          label="Composite"
          role="status"
          aria-label="Composite"
        />
      )}
      {measure.component && (
        <Chip
          className="chip-in-composite"
          role="status"
          aria-label={`In Composite: ${COMPONENT_MEASURE_MSG}`} // for 508
          label={
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              In Composite
              <Tooltip title={`${COMPONENT_MEASURE_MSG}`} arrow>
                <InfoOutlinedIcon
                  sx={{ fontSize: 16 }}
                  aria-label={`${COMPONENT_MEASURE_MSG}`}
                  role="img"
                  tabIndex={0}
                  focusable="true"
                />
              </Tooltip>
            </span>
          }
        />
      )}
    </div>
  );
};

export default function MeasureList(props: {
  retrieveMeasures?: (
    tab: number,
    limit: number,
    page: number,
    searchCriteria: MeasureSearchCriteria,
    sort: string,
    direction: string,
    doUpdateMeasureCount: boolean
  ) => void;
  measureList: Measure[];
  setMeasureList;
  setTotalPages;
  setTotalItems;
  setVisibleItems;
  setOffset;
  setLoading;
  activeTab: number;
  searchCriteria: MeasureSearchCriteria;
  setSearchCriteria: Dispatch<SetStateAction<MeasureSearchCriteria>>;
  currentLimit: number;
  currentPage: number;
  setCurrentPage?: Dispatch<SetStateAction<number>>;
  handlePageChange?: any;
  currentSort?;
  setCurrentSort?;
  currentDirection?;
  setCurrentDirection?;
  setStatusHandler;
  search: any;
  // Toast props
  toastOpen: boolean;
  toastMessage: string;
  toastType: string;
  setToastOpen: Dispatch<SetStateAction<boolean>>;
  setToastMessage: Dispatch<SetStateAction<string>>;
  setToastType: Dispatch<SetStateAction<string>>;
  onToastClose: () => void;
}) {
  const { searchCriteria, setSearchCriteria, retrieveMeasures } = { ...props };
  const measureServiceApi = useRef(useMeasureServiceApi()).current; //needs to be ref or triggers jest. throws warn
  const userServiceApi = useRef(useUserServiceApi()).current; //needs to be ref or triggers jest. throws warn
  const featureFlags = useFeatureFlags();

  const isReviewTab =
    props.activeTab === ALL_REVIEWS_TAB || props.activeTab === MY_REVIEWS_TAB;
  const showReviewStatus =
    isReviewTab ||
    (!!featureFlags?.MeasureReviewStatus && props.activeTab !== 2);

  const filterByOpts = [
    "Measure",
    "Model",
    "Version",
    "CMS ID",
    ...(showReviewStatus ? ["Review"] : []),
  ];
  const filterMap: Record<string, string> = {
    Measure: "measureName",
    Model: "model",
    Version: "version",
    "CMS ID": "cmsId",
    Review: "review",
  };

  const {
    filterBy,
    searchField,
    handleFilter,
    handleSearch,
    finalizeSearchCriteria,
    blankSearchCriteria: resetFilterSearch,
  } = useFilterSearch();

  const handleSearchTrigger = () => {
    finalizeSearchCriteria();
    const optionalSearchProperties: string[] = [];
    if (filterBy && filterMap[filterBy]) {
      optionalSearchProperties.push(filterMap[filterBy]);
    }
    if (!filterBy && searchField) {
      filterByOpts.forEach((condition) => {
        optionalSearchProperties.push(filterMap[condition]);
      });
    }
    setSearchCriteria({
      searchField: searchField,
      optionalSearchProperties,
    });
    props.handlePageChange(null, 1);
  };

  const handleSearchClear = () => {
    resetFilterSearch();
    setSearchCriteria({
      searchField: "",
      optionalSearchProperties: [],
    });
  };

  const navigate = useNavigate();
  // Popover utilities
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<Measure>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // if user can edit and it is a version, then draft button

  const targetMeasure = useRef<Measure>();

  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    measureId: "",
  });
  const [versionErrorDialogOpen, setVersionErrorDialogOpen] =
    useState<boolean>(false);
  const [versionErrors, setVersionErrors] = useState<string[]>([]);

  const [viewHumanReadableModal, setViewHumanReadableModal] = useState({
    open: false,
    measureId: "",
  });

  const [viewMeasureHistoryDialog, setViewMeasureHistoryDialog] =
    useState(false);

  const [versionHelperText, setVersionHelperText] = useState("");
  const [deleteMeasureDialog, setDeleteMeasureDialog] =
    useState<boolean>(false);
  const [draftMeasureDialog, setDraftMeasureDialog] = useState({
    open: false,
  });

  const [openAssociateCmsIdDialog, setOpenAssociateCmsIdDialog] =
    useState(false);

  const [shareDialog, setShareDialog] = useState({ open: false, option: "" });
  const [selectedIdForExpansion, setSelectedIdForExpansion] = useState(null);
  const [isRowExpanded, setIsRowExpanded] = useState<boolean>(false);
  const [selectedExpandedMeasuresIds, setSelectedExpandedMeasuresIds] =
    useState([]);
  const [transferDialog, setTransferDialog] = useState({
    open: false,
    measures: [],
    isAdminTransfer: false,
  });
  const [compareVersionsDialog, setCompareVersionsDialog] =
    useState<boolean>(false);
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    measureId: "",
  });
  const userRoles = useUserRoles();

  const transFormData = (
    measureList,
    lockedByDisplayNames: Record<string, string> = {}
  ): TCRow[] => {
    return measureList.map((measure) => {
      const lockedBy = measure?.measureLock?.lockedBy;
      return {
        id: measure?.id,
        measureName: measure?.measureName,
        version: measure?.version,
        model: measure?.model,
        actions: measure,
        hasAssociatedMeasures: measure?.hasAssociatedMeasures,
        ownerDisplayName: measure?.ownerDisplayName,
        reviewStatus: measure?.reviewStatus,
        reviewers: measure?.reviewers,
        lockedByDisplayName: lockedBy
          ? lockedByDisplayNames[lockedBy] || lockedBy
          : undefined,
      };
    });
  };

  type TCRow = {
    id: string;
    // select: any;
    measureName: string;
    version: string;
    model: string;
    actions: any;
    hasAssociatedMeasures: boolean;
    ownerDisplayName?: string;
    lockedByDisplayName?: string;
    reviewStatus?: string;
    reviewers?: string[];
  };

  const [data, setData] = useState<TCRow[]>([]);
  const [expandedSectionData, setExpandedSectionData] = useState<TCRow[]>([]);
  // Collapse any expanded row and clear its data when switching tabs
  const [renderedTab, setRenderedTab] = useState<number>(props.activeTab);
  if (renderedTab !== props.activeTab) {
    setRenderedTab(props.activeTab);
    setIsRowExpanded(false);
    setSelectedIdForExpansion(null);
    setSelectedExpandedMeasuresIds([]);
    setExpandedSectionData(null);
  }
  // Real names of users who currently have a measure locked for editing,
  // similar to the "in use" chip on the Page Header. Baked into `data` (rather
  // than read directly from the column defs) so resolving names doesn't force
  // the memoized table columns/cells to be recreated and remounted.
  const [lockedByDisplayNames, setLockedByDisplayNames] = useState<
    Record<string, string>
  >({});
  useEffect(() => {
    if (props.measureList && measureServiceApi) {
      setData(transFormData(props.measureList, lockedByDisplayNames));
    }
  }, [props.measureList, measureServiceApi, lockedByDisplayNames]);

  useEffect(() => {
    const lockedByHarpIds = Array.from(
      new Set(
        (props.measureList || [])
          .map((measure) => measure?.measureLock?.lockedBy)
          .filter((harpId): harpId is string => !!harpId)
      )
    );
    if (lockedByHarpIds.length === 0 || !userServiceApi) {
      return;
    }
    userServiceApi
      .getBulkUserDetails(lockedByHarpIds)
      .then((userDetails) => {
        setLockedByDisplayNames((prev) => {
          const next = { ...prev };
          Object.entries(userDetails || {}).forEach(
            ([harpId, details]: [string, any]) => {
              const name = [details?.firstName, details?.lastName]
                .filter(Boolean)
                .join(" ");
              next[harpId] = name ? `${name} (${harpId})` : harpId;
            }
          );
          return next;
        });
      })
      .catch(() => {
        // fall back to displaying the raw HARP ID if the lookup fails
      });
  }, [props.measureList, userServiceApi]);

  function IndeterminateCheckbox({
    indeterminate,
    className = "",
    onChange,
    id,
    ...rest
  }: {
    indeterminate?: boolean;
  } & HTMLProps<HTMLInputElement>) {
    const ref = React.useRef<HTMLInputElement>(null!);

    React.useEffect(() => {
      if (typeof indeterminate === "boolean") {
        ref.current.indeterminate = !rest.checked && indeterminate;
      }
    }, [ref, indeterminate]);

    return (
      <input
        type="checkbox"
        ref={ref}
        data-testid={`checkbox-${id}`}
        className={className + " cursor-pointer"}
        onChange={onChange}
        {...rest}
      />
    );
  }

  const columnsToBeAdded = [
    {
      header: "Measure",
      cell: (info) => (
        <>
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.id}`}
          />
        </>
      ),
      accessorKey: "measureName",
      sortingFn: (rowA, rowB) =>
        customSort(rowA.original.measureName, rowB.original.measureName),
    },
    {
      header: "Version",
      cell: (info) => (
        <TruncateText
          text={info.row.original.version}
          maxLength={60}
          dataTestId={`measure-version-${info.row.original.id}`}
        />
      ),
      accessorKey: "version",
      sortingFn: (rowA, rowB) =>
        customSort(rowA.original.version, rowB.original.version),
    },
    {
      header: "Status",
      cell: (info) => (
        <MeasureStatusChips measure={info.row.original.actions} />
      ),
      accessorKey: "measureMetaData.draft",
    },
    {
      header: "Model",
      cell: (info) => (
        <TruncateText
          text={info.row.original.model}
          maxLength={120}
          dataTestId={`measure-model-${info.row.original.id}`}
        />
      ),
      accessorKey: "model",
      sortingFn: (rowA, rowB) =>
        customSort(rowA.original.model, rowB.original.model),
    },
    // Do not display Shared column in Shared Measures tab
    ...(props.activeTab !== 1
      ? [
          {
            header: "Shared",
            cell: (info) => (
              <div>
                {info.row.original.actions?.measureSet?.acls?.length > 0 && (
                  <CheckCircleOutlineIcon sx={{ color: "#4CAF50" }} />
                )}
              </div>
            ),
            accessorKey: "measureSet.acls",
          },
        ]
      : []),
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
    // Do not display Owner column in My Measures tab
    ...(props.activeTab === 1 || props.activeTab === 2
      ? [
          {
            header: "Owner",
            cell: (info) => (
              <TruncateText
                text={info.row.original.ownerDisplayName || "-"}
                maxLength={120}
                dataTestId={`measure-owner-${info.row.original.id}`}
              />
            ),
            accessorKey: "ownerDisplayName",
            enableSorting: false,
          },
        ]
      : []),
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
    ...(showReviewStatus
      ? [
          {
            header: "Review",
            accessorKey: "reviewStatus",
            enableSorting: false,
            cell: (info) => {
              const { id, reviewStatus, reviewers } = info.row.original;

              if (!reviewStatus) {
                return <p>-</p>;
              }

              if (!shouldShowReviewerTooltip(reviewStatus, reviewers)) {
                return <p>{reviewStatus}</p>;
              }
              return (
                <Tooltip
                  title={
                    <div>
                      {reviewers.map((reviewer, index) => (
                        <div key={`${id}-reviewer-${index}`}>{reviewer}</div>
                      ))}
                    </div>
                  }
                  arrow
                >
                  <span>{reviewStatus}</span>
                </Tooltip>
              );
            },
          },
        ]
      : []),
    {
      // Use tabIndex={0} for accessibility, and make sure it's not inside a button.
      header: () => (
        <button tabIndex={0} aria-label="Edit or View Measure">
          Action
        </button>
      ),
      cell: (info) => {
        const canEdit =
          checkUserCanEdit(
            info.row.original.actions?.measureSet?.owner,
            info.row.original.actions?.measureSet?.acls
          ) && info.row.original.actions.measureMetaData?.draft;
        const isLockedByOther =
          canEdit && !!info.row.original.actions?.measureLock;
        const lockedByDisplayName =
          info.row.original.lockedByDisplayName ||
          info.row.original.actions?.measureLock?.lockedBy;

        const buttonText = isLockedByOther ? "View" : canEdit ? "Edit" : "View";

        const buttonElement = (
          <Button
            variant="outline-filled"
            data-testid={`measure-action-${info.row.original.id}`}
            aria-label={`${buttonText} Measure ${
              info.row.original.measureName
            } ${info.row.original.version}${
              info.row.original.actions.measureMetaData?.draft ? " Draft" : ""
            }${isLockedByOther ? ` (Locked by ${lockedByDisplayName})` : ""}`}
            onClick={() => {
              navigate(`/measures/${info.row.original.id}/edit/details/`);
            }}
            tabIndex={0}
            role="button"
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
                  {lockedByDisplayName}
                </>
              }
              arrow
              slotProps={{
                tooltip: {
                  sx: {
                    maxWidth: "none",
                    whiteSpace: "nowrap",
                    zIndex: 99,
                    backgroundColor: "#333",
                    "& .MuiTooltip-arrow": {
                      color: "#333",
                    },
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
      accessorKey: "actions",
      enableSorting: false,
    },
  ];
  const getHeader = () => {
    if (props.activeTab === 0 || props.activeTab === 1) {
      return (
        <Tooltip
          title="Select"
          id={`measure-list-select-tooltip`}
          placement="bottom"
          arrow
          slotProps={{
            // base style
            tooltip: {
              sx: {
                zIndex: 99,
                backgroundColor: "#333",
                // pseudo element class target
                "& .MuiTooltip-arrow": {
                  color: "#333",
                },
              },
            },
          }}
        >
          <div style={{ width: 16 }}>
            <IndeterminateCheckbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              id={`select-all-checkbox`}
            />
          </div>
        </Tooltip>
      );
    } else {
      return (
        <Tooltip
          title="Select"
          id={`measure-list-select-tooltip`}
          placement="bottom"
          arrow
          slotProps={{
            tooltip: {
              sx: {
                zIndex: 99,
                backgroundColor: "#333",
                "& .MuiTooltip-arrow": {
                  color: "#333",
                },
              },
            },
          }}
        >
          <div style={{ width: 14 }}>
            <MadieTooltipIcon />
          </div>
        </Tooltip>
      );
    }
  };
  const columns = useMemo<ColumnDef<TCRow>[]>(() => {
    const t = [
      {
        id: "select", // retain ID so we have the column for checkboxes but the header is blank
        header: () => <div aria-label="Measure Selection">{getHeader()}</div>,
        cell: ({ row }) => {
          return (
            <div className="px-1">
              <IndeterminateCheckbox
                {...{
                  checked: row.getIsSelected(), //props.selectedIds[row.original.id],
                  disabled: !row.getCanSelect(),
                  indeterminate: row.getIsSomeSelected(),
                  onChange: row.getToggleSelectedHandler(),
                  id: row.original.id,
                }}
              />
            </div>
          );
        },
      },
      ...columnsToBeAdded,
    ];

    t.push({
      header: () => <span aria-label="expandArrow"></span>,
      cell: (info) => {
        if (info.row.original?.hasAssociatedMeasures) {
          const handleKeyDown = (e) => {
            if (e.key === "Enter" || e.key === " ") {
              setSelectedExpandedMeasuresIds([]);
              handleRowClick(info.row.original.actions);
            }
          };
          return (
            <span
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedExpandedMeasuresIds([]);
                handleRowClick(info.row.original.actions);
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
              selectedIdForExpansion ===
                info.row.original.actions?.measureSetId ? (
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

    return t;
  }, [
    selectedIdForExpansion,
    isRowExpanded,
    props.activeTab,
    showReviewStatus,
  ]);

  const expandedcolumns = useMemo<ColumnDef<TCRow>[]>(() => {
    return [
      {
        id: "select",
        accessorKey: "select",
        header: "Select",
        cell: (info) => {
          const isChecked = selectedExpandedMeasuresIds.includes(
            info.row.original.id
          );
          return (
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(event) => {
                const checked = event.target.checked;
                if (checked) {
                  setSelectedExpandedMeasuresIds((prev) => [
                    ...prev,
                    info.row.original.id,
                  ]);
                } else {
                  setSelectedExpandedMeasuresIds((prev) =>
                    prev.filter((id) => id !== info.row.original.id)
                  );
                }
              }}
            />
          );
        },
      },
      ...columnsToBeAdded,
      {
        header: "",
        cell: (info) => <></>,
        accessorKey: "",
      },
    ];
  }, [selectedExpandedMeasuresIds, isRowExpanded, props.activeTab]);

  const handleRowClick = async (actions) => {
    if (!isRowExpanded || selectedIdForExpansion !== actions?.measureSetId) {
      setSelectedIdForExpansion(actions?.measureSetId);
      const results = await measureServiceApi.getMeasuresByMeasureSetId(
        actions?.measureSetId,
        true,
        searchCriteria
      );
      const filteredResults = results.filter(
        (result) => result.id !== actions?.id
      );
      setIsRowExpanded(true);
      setExpandedSectionData(transFormData(filteredResults));
    } else {
      setIsRowExpanded(false);
      setExpandedSectionData(null);
      setSelectedIdForExpansion(null);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200, //starting column size
      minSize: 50, //enforced during column resizing
      maxSize: 500, //enforced during column resizing
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });
  useEffect(() => {
    table.toggleAllRowsSelected(false);
  }, [props.currentLimit, props.currentPage]);

  const parentMeasures =
    props.measureList?.filter((measure) => {
      return table
        .getSelectedRowModel()
        .rows.find((row) => row.original.id === measure.id);
    }) || [];

  const expandedMeasures = selectedExpandedMeasuresIds?.map(
    (expandedMeasureId) => {
      return expandedSectionData?.find((data) => data?.id === expandedMeasureId)
        ?.actions;
    }
  );

  const selectedMeasures =
    parentMeasures?.length === 0 && expandedMeasures?.length === 0
      ? []
      : [
          ...parentMeasures,
          ...expandedMeasures?.filter((expMeasure) => expMeasure !== undefined),
        ];

  const handleDialogClose = () => {
    setVersionErrorDialogOpen(false);
    setInvalidTestCaseOpen(false);
    setCreateVersionDialog({
      open: false,
      measureId: "",
    });
    setDraftMeasureDialog({
      open: false,
    });
    setVersionErrors([]);
    setVersionHelperText("");
    setViewHumanReadableModal({
      open: false,
      measureId: "",
    });
    setOpenAssociateCmsIdDialog(false);
    setDeleteMeasureDialog(false);
    setIsRowExpanded(false);
    setSelectedIdForExpansion(null);
    setSelectedExpandedMeasuresIds([]);
    setTransferDialog({
      open: false,
      measures: [],
      isAdminTransfer: false,
    });
    setViewMeasureHistoryDialog(false);
    setReviewDialog({
      open: false,
      measureId: "",
    });
  };

  const handleViewDialogClose = () => {
    setViewHumanReadableModal({
      open: false,
      measureId: "",
    });
    setViewMeasureHistoryDialog(false);
  };

  const handleShareDialogClose = () => {
    setShareDialog({
      open: false,
      option: "",
    });
  };

  const handleShareDialogSave = ({
    toastType = "danger",
    toastMessage = "",
    toastOpen = false,
  } = {}) => {
    if (toastType === "success") {
      doUpdateList(true);
    }

    handleShareDialogClose();

    props.setToastType(toastType);
    props.setToastMessage(toastMessage);
    props.setToastOpen(toastOpen);
  };

  const handleSort = async (sort: string) => {
    props.setLoading(true);
    abortController.current = new AbortController();
    let sortChange = "lastModifiedAt";
    let directionChange = "DESC";
    if (sort === props.currentSort) {
      if (props.currentDirection === "ASC") {
        sortChange = sort;
        directionChange = "DESC";
      } else if (props.currentDirection === "DESC") {
        sortChange = "";
        directionChange = "";
      }
    } else {
      sortChange = sort;
      directionChange = "ASC";
    }
    props.setCurrentSort(sortChange);
    props.setCurrentDirection(directionChange);
    props.handlePageChange(null, 1);
  };

  const handleTransferDialogClose = ({
    toastType = "danger",
    toastMessage = "",
    toastOpen = false,
  } = {}) => {
    if (toastType === "success") {
      doUpdateList(true);
    }

    handleDialogClose();

    props.setToastType(toastType);
    props.setToastMessage(toastMessage);
    props.setToastOpen(toastOpen);
  };

  const handleCompareVersionsDialogClose = () => {
    setCompareVersionsDialog(false);
  };

  const handleReviewDialogClose = () => {
    setReviewDialog({
      open: false,
      measureId: "",
    });
  };

  const updateTargetMeasure = (newValue) => {
    targetMeasure.current = newValue;
  };

  useEffect(() => {
    if (selectedMeasure) {
      updateTargetMeasure(selectedMeasure);
    }
  }, [selectedMeasure]);

  const [downloadState, setDownloadState] = useState(null); // state of dialog
  const [failureMessage, setFailureMessage] = useState(null); // message to pass to dialog
  // Ref required or value will be lost on all state changes.
  const abortController = useRef(null);

  const exportMeasure = async (elmErrorSeverity: string) => {
    setViewHumanReadableModal({
      open: false,
      measureId: "",
    });
    try {
      const measure: Measure = await measureServiceApi.fetchMeasure(
        targetMeasure.current?.id
      );
      await downloadMeasureExport(
        setFailureMessage,
        setDownloadState,
        abortController,
        measure,
        measureServiceApi,
        props.setToastOpen,
        props.setToastType,
        props.setToastMessage,
        elmErrorSeverity
      );
    } catch (error) {
      console.error("Error fetching measure:", error);
      setFailureMessage("Failed to fetch measure");
    }
  };
  const handleContinueDialog = () => {
    setDownloadState(null);
    setFailureMessage(null);
  };
  const handleCancelDialog = () => {
    abortController.current && abortController.current.abort();
    handleContinueDialog();
  };

  const doUpdateList = (doUpdateMeasureCount = false) => {
    const tabStorageKey = getTabStorageKey(props.activeTab);
    const tabPageOptions = JSON.parse(localStorage.getItem(tabStorageKey)) || {
      page: 1,
      limit: 10,
    };

    const currentLimit = tabPageOptions.limit || 10;

    retrieveMeasures(
      props.activeTab,
      currentLimit,
      props.currentPage,
      props.searchCriteria,
      props.currentSort,
      props.currentDirection,
      doUpdateMeasureCount
    );
  };

  const [invalidTestCaseOpen, setInvalidTestCaseOpen] =
    useState<boolean>(false);
  // we need to preserver version type as invalid test case dialog will not be aware of it
  const [versionType, setVersionType] = useState<string>(null);

  const handleCreateError = (error) => {
    const errorData = error?.response;
    const message = errorData?.data?.message;

    props.setToastOpen(true);
    setLoading(false);
    if (errorData?.status === 400) {
      props.setToastMessage("Requested measure cannot be versioned");
    } else if (errorData?.status === 403) {
      props.setToastMessage("User is unauthorized to create a version");
    } else if (errorData?.status === 500) {
      // For server errors (500), always show a generic error message
      props.setToastMessage(
        "An unexpected error has occurred. Please contact the help desk."
      );
    } else {
      props.setToastMessage(
        message ||
          "Requested operation could not be completed. Please contact the Help Desk."
      );
    }

    if (message) {
      setVersionHelperText(versionErrorHelper(message));
    }
  };

  const createVersion = (versionType: string) => {
    setLoading(true);
    return measureServiceApi
      .createVersion(targetMeasure.current?.id, versionType)
      .then((r) => {
        handleDialogClose();
        props.setToastOpen(true);
        props.setToastType("success");
        setLoading(false);
        props.setToastMessage("New version of measure is Successfully created");
        doUpdateList();
      })
      .catch((error) => {
        handleCreateError(error);
      });
  };

  // given a version and target, check if possible
  const checkCreateVersion = async (versionType: string) => {
    setLoading(true);
    if (
      versionType !== "major" &&
      versionType !== "minor" &&
      versionType !== "patch"
    ) {
      setCreateVersionDialog({
        open: true,
        measureId: targetMeasure.current?.id,
      });
      setLoading(false);
    } else {
      await measureServiceApi
        .checkValidVersion(targetMeasure.current?.id, versionType)
        .then(async (successResponse) => {
          setLoading(false);
          // if we get a 202, we have invalid test cases, but no other issues so we can create it
          if (successResponse?.status === 202) {
            setVersionType(versionType);
            setInvalidTestCaseOpen(true);
          }
          // we assume standard 200 success case, we create the version
          else {
            createVersion(versionType);
          }
        })
        .catch((error) => {
          handleCreateError(error);
        });
    }
  };

  const showVersionErrors = (errors: string[]) => {
    setVersionErrors(errors);
    setVersionErrorDialogOpen(true);
    setCreateVersionDialog((prevState) => ({
      ...prevState,
      open: false,
    }));
  };

  const handleVersionSubmit = async (versionType: string) => {
    try {
      const result = await measureServiceApi?.fetchMeasure(
        targetMeasure.current?.id
      );
      if (result) {
        const versionErrors = [
          ...getLibraryNameErrors(result.cqlLibraryName, result.model as Model),
          ...(await validateCompositeMeasure(result, measureServiceApi)),
        ];
        if (versionErrors.length > 0) {
          showVersionErrors(versionErrors);
          return;
        }
        checkCreateVersion(versionType);
      }
    } catch (e) {
      props.setToastMessage(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
      props.setToastOpen(true);
      props.setToastType("danger");
    }
  };

  const draftMeasure = async (measureName: string, model: Model) => {
    setLoading(true);
    await measureServiceApi
      .draftMeasure(targetMeasure.current?.id, model, measureName)
      .then(async () => {
        setLoading(false);
        handleDialogClose();
        props.setToastOpen(true);
        props.setToastType("success");
        props.setToastMessage("New draft created successfully.");
        doUpdateList();
      })
      .catch((error) => {
        setLoading(false);
        const errorOb = error?.response?.data;
        props.setToastOpen(true);
        if (errorOb?.message) {
          props.setToastMessage(errorOb.message);
        } else {
          props.setToastMessage(
            "An error occurred, please try again. If the error persists, please contact the help desk."
          );
        }
      });
  };

  const deleteMeasure = async () => {
    try {
      const result = await measureServiceApi.deleteMeasure(
        targetMeasure?.current.id
      );
      if (result.status === 200) {
        props.setToastType("success");
        props.setToastMessage("Measure successfully deleted");
        props.setToastOpen(true);
        doUpdateList(true);
        handleDialogClose();

        const values = queryString.parse(props.search);
        const currentLimit = values.limit === "All" ? 50 : values.limit;

        localStorage.setItem(
          "cqlLibraryPageOptions",
          JSON.stringify({
            page: values.page || 1,
            limit: currentLimit,
          })
        );
        navigate(
          `?tab=${props.activeTab}&page=${
            values.page || 1
          }&limit=${currentLimit}`
        );
      }
    } catch (e) {
      if (e?.response?.data) {
        const { message } = e.response.data;
        props.setToastMessage(message);
      } else {
        props.setToastMessage(e.toString());
      }
      props.setToastType("danger");
      props.setToastOpen(true);
      handleDialogClose();
    }
  };

  const associateCmsId = () => {
    setOpenAssociateCmsIdDialog(true);
  };

  const handleCmsIdAssociation = (
    qiCoreMeasureId: string,
    qdmMeasureId: string,
    copyMetaData: boolean
  ) => {
    measureServiceApi
      .associateCmsId(qiCoreMeasureId, qdmMeasureId, copyMetaData)
      .then((measureSet) => {
        doUpdateList();

        table.toggleAllRowsSelected(false);
        props.setToastOpen(true);
        props.setToastType("success");
        props.setToastMessage(
          `Measures successfully associated with CMS ID ${padCmsId(
            measureSet?.cmsId
          )}${copyMetaData ? " and meta data is copied over" : ""}.`
        );
        handleDialogClose();
      })
      .catch((err) => {
        const errorOb = err?.response?.data;
        props.setToastOpen(true);
        if (errorOb?.message) {
          props.setToastMessage(errorOb.message);
        } else {
          props.setToastMessage(
            "An error occurred, please try again. If the error persists, please contact the help desk."
          );
        }
      });
  };

  return (
    <div style={{ overflow: "auto", maxHeight: "703px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 16,
          backgroundColor: "#fff",
          alignItems: "end",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <SearchAndFilter
          filterBy={filterBy}
          searchField={searchField}
          onFilterChange={handleFilter}
          onSearchChange={handleSearch}
          onSearchTrigger={handleSearchTrigger}
          onSearchClear={handleSearchClear}
          filterByOpts={filterByOpts}
          textFieldID={"measure"}
        />
        <div>
          <ActionCenter
            updateTargetMeasure={updateTargetMeasure}
            exportMeasure={exportMeasure}
            measures={selectedMeasures}
            associateCmsId={associateCmsId}
            setCreateVersionDialog={setCreateVersionDialog}
            setDraftMeasureDialog={setDraftMeasureDialog}
            setDeleteMeasureDialog={setDeleteMeasureDialog}
            setShareDialog={setShareDialog}
            deleteMeasure={deleteMeasure}
            setViewHumanReadableModal={setViewHumanReadableModal}
            setViewMeasureHistoryDialog={setViewMeasureHistoryDialog}
            activeTab={props.activeTab}
            setTransferDialog={setTransferDialog}
            setCompareVersionsDialog={setCompareVersionsDialog}
            setReviewDialog={setReviewDialog}
          />
        </div>
      </div>
      <MadieTable
        table={table}
        currentSort={props.currentSort}
        currentDirection={props.currentDirection}
        handleSort={handleSort}
        id="measureListTable"
        dataTestId="measure-list-tbl"
        renderExpandedRow={(row) =>
          selectedIdForExpansion === row.original.actions?.measureSetId &&
          expandedSectionData?.map((subRow) => (
            <tr key={subRow.id} className="expanded-row">
              {expandedcolumns.map((column: any) =>
                column?.accessorKey === "expandArrow" ? (
                  <td key={`${subRow.id}-expand`}></td>
                ) : (
                  <td key={column?.accessorKey || column.id}>
                    {flexRender(column.cell ?? column.accessorKey, {
                      row: { original: subRow },
                      getValue: () => subRow[column.accessorKey],
                    })}
                  </td>
                )
              )}
            </tr>
          ))
        }
      />
      <CreatVersionDialog
        currentVersion={targetMeasure?.current?.version}
        open={createVersionDialog.open}
        onClose={handleDialogClose}
        onSubmit={handleVersionSubmit}
        versionHelperText={versionHelperText}
        loading={loading}
        measureId={targetMeasure?.current?.id}
      />
      <VersioningErrorDialog
        open={versionErrorDialogOpen}
        onClose={handleDialogClose}
        measureName={targetMeasure?.current?.measureName}
        errors={versionErrors}
      />
      <InvalidTestCaseDialog
        open={invalidTestCaseOpen}
        onContinue={createVersion}
        onClose={handleDialogClose}
        versionType={versionType}
        loading={loading}
      />
      <DraftMeasureDialog
        open={draftMeasureDialog.open}
        onClose={handleDialogClose}
        onSubmit={draftMeasure}
        loading={loading}
        measure={targetMeasure.current}
      />
      <ExportDialog
        failureMessage={failureMessage}
        measureName={targetMeasure?.current?.measureName}
        downloadState={downloadState}
        open={Boolean(downloadState)}
        handleContinueDialog={handleContinueDialog}
        handleCancelDialog={handleCancelDialog}
      />
      <ShareDialog
        measures={selectedMeasures}
        open={shareDialog.open}
        option={shareDialog.option}
        onClose={handleShareDialogClose}
        onSave={handleShareDialogSave}
        isAdmin={userRoles?.isAdmin}
      />
      <MadieDeleteDialog
        open={deleteMeasureDialog}
        onClose={handleDialogClose}
        onContinue={deleteMeasure}
        dialogTitle="Delete Measure"
        statement
        customDialogBody={
          <>
            Are you sure you want to delete draft of{" "}
            <span className="strong">
              {targetMeasure?.current?.measureName}
            </span>
          </>
        }
      />
      <AssociateCmsIdDialog
        measures={selectedMeasures}
        onClose={handleDialogClose}
        open={openAssociateCmsIdDialog}
        handleCmsIdAssociationContinueDialog={handleCmsIdAssociation}
      />
      <ViewHRModal
        open={viewHumanReadableModal.open}
        onClose={handleViewDialogClose}
        measureId={targetMeasure?.current?.id}
        exportMeasure={exportMeasure}
      />
      <TransferDialog
        measures={selectedMeasures}
        open={transferDialog.open}
        onClose={handleTransferDialogClose}
        setStatusHandler={props.setStatusHandler}
        isAdminTransfer={transferDialog.isAdminTransfer}
      />
      <ViewMeasureHistoryDialog
        measures={selectedMeasures}
        open={viewMeasureHistoryDialog}
        onClose={handleViewDialogClose}
      />
      <CompareVersionsDialog
        measures={selectedMeasures}
        open={compareVersionsDialog}
        onClose={handleCompareVersionsDialogClose}
      />
      {userRoles?.isReviewer ? (
        <ManageReviewDialog
          open={reviewDialog.open}
          entityType="measure"
          entityId={selectedMeasures[0]?.id}
          entitySetId={selectedMeasures[0]?.measureSetId}
          onClose={handleReviewDialogClose}
          onSuccess={() => {
            doUpdateList(true);
            table.resetRowSelection();
            setSelectedExpandedMeasuresIds([]);
            setIsRowExpanded(false);
            setExpandedSectionData([]);
            setSelectedIdForExpansion(null);
          }}
        />
      ) : (
        <ReviewDialog
          open={reviewDialog.open}
          measure={selectedMeasures[0]}
          onClose={handleReviewDialogClose}
          onSuccess={() => {
            doUpdateList(true);
            table.resetRowSelection();
            setSelectedExpandedMeasuresIds([]);
            setIsRowExpanded(false);
            setExpandedSectionData([]);
            setSelectedIdForExpansion(null);
          }}
        />
      )}
    </div>
  );
}
