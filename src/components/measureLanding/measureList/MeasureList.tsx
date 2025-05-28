import React, {
  Dispatch,
  HTMLProps,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import tw from "twin.macro";
import "styled-components/macro";
import { Measure, Model } from "@madie/madie-models";
import { useNavigate } from "react-router-dom";
import { Chip } from "@mui/material";
import {
  Button,
  Toast,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import {
  useReactTable,
  ColumnDef,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";

import InvalidTestCaseDialog from "../../common/invalidTestCaseDialog/InvalidTestCaseDialog";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";
import CreatVersionDialog from "../../common/createVersionDialog/CreateVersionDialog";
import DraftMeasureDialog from "../../common/draftMeasureDialog/DraftMeasureDialog";
import versionErrorHelper from "../../../utils/versionErrorHelper";
import ExportDialog from "./exportDialog/ExportDialog";
import InvalidMeasureNameDialog from "./InvalidMeasureNameDialog/InvalidMeasureNameDialog";
import getLibraryNameErrors from "./InvalidMeasureNameDialog/getLibraryNameErrors";
import AssociateCmsIdDialog from "./associateCmsIdDialog/AssociateCmsIdDialog";
import ActionCenter from "./actionCenter/ActionCenter";
import DeleteDialog from "../../editMeasure/DeleteDialog";
import ViewHRModal from "../../common/viewHumanReadableModal/ViewHRModal";
import ShareDialog from "../../common/shareDialog/ShareDialog";
import {
  ExpandIcon,
  CollapseIcon,
} from "../../../icons/MeasureListTableRightArrowIcons";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { exportMeasure as downloadMeasureExport } from "../../../utils/exportUtil";
import { MeasureSearchCriteria } from "../MeasureLanding";
import Search from "./measureSearch/search";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";

const searchInputStyle = {
  borderRadius: "3px",
  height: 40,
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: "3px",
    borderColor: "#8C8C8C",
    "& legend": {
      width: 0,
    },
  },
  "& .MuiOutlinedInput-root": {
    "&&": {
      borderRadius: "3px",
    },
  },
  "& .MuiInputBase-input": {
    height: 40,
    fontFamily: "Rubik",
    fontSize: 14,
    borderRadius: "3px",
    padding: "9px 14px",
    "&::placeholder": {
      opacity: 1,
      color: "#717171",
    },
  },
};

export default function MeasureList(props: {
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
  setMeasureCounts;
  currentSort;
  setCurrentSort;
  currentDirection;
  setCurrentDirection;
  setErrMsg;
}) {
  const { searchCriteria, setSearchCriteria } = { ...props };
  const measureServiceApi = useRef(useMeasureServiceApi()).current; //needs to be ref or triggers jest. throws warn
  // CanDraftLookup will be an object who's keys are measureSetIds, to check weather we can draft M
  const [canDraftLookup, setCanDraftLookup] = useState<object>({});
  const canDraftRef = useRef<object>();
  canDraftRef.current = canDraftLookup;
  const [hoveredHeader, setHoveredHeader] = useState<string>("");

  const navigate = useNavigate();
  // Popover utilities
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [selectedMeasure, setSelectedMeasure] = useState<Measure>(null);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // if user can edit and it is a version, then draft button

  const targetMeasure = useRef<Measure>();

  const [createVersionDialog, setCreateVersionDialog] = useState({
    open: false,
    measureId: "",
  });
  const [invalidLibraryDialogOpen, setInvalidLibraryDialogOpen] =
    useState<boolean>(false);
  const [invalidLibraryErrors, setInvalidLibraryErrors] = useState<string[]>(
    []
  );

  const [viewHumanReadableModal, setViewHumanReadableModal] = useState({
    open: false,
    measureId: "",
  });

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
  const featureFlags = useFeatureFlags();

  const buildLookup = useCallback(
    async (measureList) => {
      const measureSetList = measureList.map((m) => m.measureSetId);
      try {
        const results = await measureServiceApi.fetchMeasureDraftStatuses(
          measureSetList
        );
        if (results) {
          setCanDraftLookup(results);
        }
      } catch (e) {
        console.warn("Error fetching draft statuses: ", e);
      }
    },
    [measureServiceApi]
  );
  const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;
  const transFormData = (measureList): TCRow[] => {
    return measureList.map((measure) => ({
      id: measure?.id,
      measureName: measure?.measureName,
      version: measure?.version,
      model: measure?.model,
      actions: measure,
      hasAssociatedMeasures: measure?.hasAssociatedMeasures,
    }));
  };

  type TCRow = {
    id: string;
    // select: any;
    measureName: string;
    version: string;
    model: string;
    actions: any;
    hasAssociatedMeasures: boolean;
  };

  function customSort(a: string, b: string) {
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

  const [data, setData] = useState<TCRow[]>([]);
  const [expandedSectionData, setExpandedSectionData] = useState<TCRow[]>([]);
  useEffect(() => {
    if (props.measureList && measureServiceApi) {
      buildLookup(props.measureList);
      setData(transFormData(props.measureList));
    }
  }, [props.measureList, measureServiceApi]);

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
        className={className + " cursor-pointer"}
        onChange={onChange}
        {...rest}
      />
    );
  }

  const columnsToBeAdded = [
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
            maxLength={60}
            dataTestId={`measure-version-${info.row.original.id}`}
          />

          {`${info.row.original.actions.measureMetaData?.draft}` === "true" && (
            <Chip tw="ml-6" className="chip-draft" label="Draft" />
          )}
        </>
      ),
      accessorKey: "version",
      sortingFn: (rowA, rowB) =>
        customSort(rowA.original.version, rowB.original.version),
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
    {
      header: "",
      cell: (info) => (
        <Button
          variant="outline-filled"
          data-testid={`measure-action-${info.row.original.id}`}
          aria-label={`Measure ${info.row.original.measureName} version ${info.row.original.version} draft status ${info.row.original.actions.measureMetaData?.draft} Select`}
          onClick={() =>
            navigate(`/measures/${info.row.original.id}/edit/details`)
          }
          role="button"
        >
          {checkUserCanEdit(
            info.row.original.actions?.measureSet?.owner,
            info.row.original.actions?.measureSet?.acls
          ) && info.row.original.actions.measureMetaData?.draft
            ? "Edit"
            : "View"}
        </Button>
      ),
      accessorKey: "actions",
      enableSorting: false,
    },
  ];
  const columnsBehindFlag = [
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
        <>
          {`${info.row.original.actions.measureMetaData?.draft}` === "true" && (
            <Chip className="chip-draft" label="Draft" />
          )}
        </>
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
    {
      header: "CMS ID",
      cell: (info) => (
        <TruncateText
          text={info.row.original.actions?.measureSet?.cmsId?.toString() || ""}
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
      cell: (info) => (
        <Button
          variant="outline-filled"
          data-testid={`measure-action-${info.row.original.id}`}
          aria-label={`Measure ${info.row.original.measureName} version ${info.row.original.version} draft status ${info.row.original.actions.measureMetaData?.draft} Select`}
          onClick={() =>
            navigate(`/measures/${info.row.original.id}/edit/details`)
          }
          role="button"
        >
          {checkUserCanEdit(
            info.row.original.actions?.measureSet?.owner,
            info.row.original.actions?.measureSet?.acls
          ) && info.row.original.actions.measureMetaData?.draft
            ? "Edit"
            : "View"}
        </Button>
      ),
      accessorKey: "actions",
      enableSorting: false,
    },
  ];

  const columns = useMemo<ColumnDef<TCRow>[]>(() => {
    const t = [
      {
        id: "select", // retain ID so we have the column for checkboxes but the header is blank
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
      ...(featureFlags?.MeasureSearch ? columnsBehindFlag : columnsToBeAdded),
    ];
    if (featureFlags?.MeasureSearch) {
      t.push({
        header: "",
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
    }
    return t;
  }, [featureFlags?.MeasureSearch, selectedIdForExpansion, isRowExpanded]);

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
      ...(featureFlags?.MeasureSearch ? columnsBehindFlag : columnsToBeAdded),
      {
        header: "",
        cell: (info) => <></>,
        accessorKey: "",
      },
    ];
  }, [selectedExpandedMeasuresIds, isRowExpanded]);

  const handleRowClick = async (actions) => {
    if (!isRowExpanded || selectedIdForExpansion !== actions?.measureSetId) {
      setSelectedIdForExpansion(actions?.measureSetId);
      const results = await measureServiceApi.getMeasuresByMeasureSetId(
        actions?.measureSetId,
        true
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
    setInvalidLibraryDialogOpen(false);
    setInvalidTestCaseOpen(false);
    setCreateVersionDialog({
      open: false,
      measureId: "",
    });
    setDraftMeasureDialog({
      open: false,
    });
    setInvalidLibraryErrors([]);
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
  };

  const handleShareDialogClose = ({
    toastType = "danger",
    toastMessage = "",
    toastOpen = false,
  } = {}) => {
    if (toastType === "success") {
      doUpdateList();
    }
    setShareDialog({
      open: false,
      option: "",
    });

    handleToast(toastType, toastMessage, toastOpen);
  };

  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };

  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  // const handleClearClick = async (event) => {
  //   props.setLoading(true);
  //   abortController.current = new AbortController();
  //   props.setSearchCriteria("");
  //   measureServiceApi
  //     .fetchMeasures(
  //       props.activeTab === 0,
  //       props.currentLimit,
  //       0,
  //       "",
  //       "",
  //       abortController.current.signal
  //     )
  //     .then((data) => {
  //       setPageProps(data);
  //     })
  //     .catch((error: Error) => {
  //       props.setErrMsg("");
  //     });
  //   navigate(`?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`);
  // };

  // const doSearch = () => {
  //   abortController.current = new AbortController();
  //   props.setErrMsg();
  //   measureServiceApi
  //     .searchMeasuresByCriteria(
  //       props.activeTab === 0,
  //       props.currentLimit,
  //       0,
  //       {
  //         searchField: props.searchCriteria,
  //       },
  //       abortController.current.signal
  //     )
  //     .then((data) => {
  //       setPageProps(data);
  //     })
  //     .catch((error: Error) => {
  //       props.setLoading(false);
  //       props.setErrMsg(error.message);
  //     });
  // };

  const handleSort = async (sort: string) => {
    props.setLoading(true);
    abortController.current = new AbortController();
    // props.setSearchCriteria(null);
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
    // measureServiceApi
    //   .fetchMeasures(
    //     props.activeTab === 0,
    //     props.currentLimit,
    //     0,
    //     sortChange,
    //     directionChange,
    //     abortController.current.signal
    //   )
    //   .then((data) => {
    //     setPageProps(data);
    //   })
    //   .catch((error: Error) => {
    //     props.setErrMsg("");
    //   });
    // navigate(`?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`);
  };

  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   if (props.searchCriteria) {
  //     props.setLoading(true);
  //     doSearch();
  //   }
  //
  //   navigate(`?tab=${props.activeTab}&page=${1}&limit=${props.currentLimit}`);
  // };
  const setPageProps = (data) => {
    if (data) {
      const { content, totalPages, totalElements, numberOfElements, pageable } =
        data;
      table.toggleAllRowsSelected(false);
      props.setTotalPages(totalPages);
      props.setTotalItems(totalElements);
      props.setVisibleItems(numberOfElements);

      props.setMeasureList(content);
      props.setOffset(pageable.offset);
      props.setLoading(false);
    }
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
        setToastOpen,
        setToastType,
        setToastMessage,
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

  const doUpdateList = () => {
    abortController.current = new AbortController();
    measureServiceApi
      .fetchMeasures(
        props.activeTab === 0,
        props.currentLimit,
        props.currentPage,
        "",
        "",
        abortController.current.signal
      )
      .then((data) => {
        props.setMeasureCounts();
        setPageProps(data);
      })
      .catch((error: Error) => {
        props.setLoading(false);
        props.setErrMsg(error.message);
      });
  };

  const [invalidTestCaseOpen, setInvalidTestCaseOpen] =
    useState<boolean>(false);
  // we need to preserver version type as invalid test case dialog will not be aware of it
  const [versionType, setVersionType] = useState<string>(null);

  const handleCreateError = (error) => {
    const errorData = error?.response;
    const message = errorData?.data?.message;

    setToastOpen(true);
    setLoading(false);
    if (errorData?.status === 400) {
      setToastMessage("Requested measure cannot be versioned");
    } else if (errorData?.status === 403) {
      setToastMessage("User is unauthorized to create a version");
    } else {
      setToastMessage(
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
        setToastOpen(true);
        setToastType("success");
        setLoading(false);
        setToastMessage("New version of measure is Successfully created");
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
  // intermediary validation step before we check if we can create version
  const checkValidCqlLibraryName = async (versionType: string) => {
    try {
      const result = await measureServiceApi?.fetchMeasure(
        targetMeasure.current?.id
      );
      if (result) {
        const { cqlLibraryName, model } = result;
        const errorResults = getLibraryNameErrors(
          cqlLibraryName,
          model as Model
        );
        if (errorResults.length > 0) {
          setInvalidLibraryErrors(errorResults);
          setInvalidLibraryDialogOpen(true);
          setCreateVersionDialog((prevState) => ({
            ...prevState,
            open: false,
          }));
        } else {
          checkCreateVersion(versionType);
        }
      }
    } catch (e) {
      setToastMessage(
        "An error occurred, please try again. If the error persists, please contact the help desk."
      );
    }
  };

  const draftMeasure = async (measureName: string, model: Model) => {
    setLoading(true);
    await measureServiceApi
      .draftMeasure(targetMeasure.current?.id, model, measureName)
      .then(async () => {
        setLoading(false);
        handleDialogClose();
        setToastOpen(true);
        setToastType("success");
        setToastMessage("New draft created successfully.");
        doUpdateList();
      })
      .catch((error) => {
        setLoading(false);
        const errorOb = error?.response?.data;
        setToastOpen(true);
        if (errorOb?.message) {
          setToastMessage(errorOb.message);
        } else {
          setToastMessage(
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
        setToastType("success");
        setToastMessage("Measure successfully deleted");
        setToastOpen(true);
        doUpdateList();
        handleDialogClose();
      }
    } catch (e) {
      if (e?.response?.data) {
        const { message } = e.response.data;
        setToastMessage(message);
      } else {
        setToastMessage(e.toString());
      }
      setToastType("danger");
      setToastOpen(true);
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
      .associateCmdId(qiCoreMeasureId, qdmMeasureId, copyMetaData)
      .then((measureSet) => {
        doUpdateList();

        table.toggleAllRowsSelected(false);
        setToastOpen(true);
        setToastType("success");
        setToastMessage(
          `Measures successfully associated with CMS ID ${measureSet?.cmsId}${
            copyMetaData ? " and meta data is copied over" : ""
          }.`
        );
        handleDialogClose();
      })
      .catch((err) => {
        const errorOb = err?.response?.data;
        setToastOpen(true);
        if (errorOb?.message) {
          setToastMessage(errorOb.message);
        } else {
          setToastMessage(
            "An error occurred, please try again. If the error persists, please contact the help desk."
          );
        }
      });
  };

  return (
    <div style={{ overflow: "auto" }}>
      <div tw="grid grid-cols-4 gap-4 m-4">
        <Search
          searchCriteria={searchCriteria}
          setSearchCriteria={setSearchCriteria}
        />
        <div tw="col-start-4 justify-self-end p-3">
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
          />
        </div>
      </div>
      <table
        tw="min-w-full"
        data-testid="measure-list-tbl"
        className="ml-table"
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
                    onClick={() => header.column.getToggleSortingHandler()}
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
                        disabled={
                          !featureFlags?.MeasureSearch ||
                          !header.column.getCanSort()
                        }
                        onClick={() => handleSort(header.id.replace("_", "."))}
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
                        {/*TODO Sorting functionality is disabled as per MAT-7532, Will be enabled in future */}
                        {/*<span className="arrowDisplay">*/}
                        {/*  {header.column.getCanSort() &&*/}
                        {/*    isHovered &&*/}
                        {/*    !header.column.getIsSorted() && <UnfoldMoreIcon />}*/}

                        {/*  {{*/}
                        {/*    asc: <KeyboardArrowUpIcon />,*/}
                        {/*    desc: <KeyboardArrowDownIcon />,*/}
                        {/*  }[header.column.getIsSorted() as string] ?? null}*/}
                        {/*</span>*/}
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
        <tbody className="table-body measures-list" style={{ padding: 20 }}>
          {table.getRowModel().rows.map((row) => (
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
                  <td key={cell.id} data-testid={`measure-name-${cell.id}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {featureFlags?.MeasureSearch &&
                selectedIdForExpansion === row.original.actions?.measureSetId &&
                expandedSectionData?.map((subRow) => (
                  <tr key={subRow.id} className="expanded-row">
                    {expandedcolumns.map((column: any) =>
                      column?.accessorKey === "expandArrow" ? (
                        <td></td>
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
                ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <Toast
        toastKey="measure-action-toast"
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
      <CreatVersionDialog
        currentVersion={targetMeasure?.current?.version}
        open={createVersionDialog.open}
        onClose={handleDialogClose}
        onSubmit={checkValidCqlLibraryName}
        versionHelperText={versionHelperText}
        loading={loading}
        measureId={targetMeasure?.current?.id}
      />
      <InvalidMeasureNameDialog
        invalidLibraryDialogOpen={invalidLibraryDialogOpen}
        onInvalidLibraryNameDialogClose={handleDialogClose}
        measureName={targetMeasure?.current?.measureName}
        invalidLibraryErrors={invalidLibraryErrors}
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
      />
      <DeleteDialog
        open={deleteMeasureDialog}
        onClose={handleDialogClose}
        measureName={targetMeasure?.current?.measureName}
        deleteMeasure={deleteMeasure}
      />
      <AssociateCmsIdDialog
        measures={selectedMeasures}
        onClose={handleDialogClose}
        open={openAssociateCmsIdDialog}
        handleCmsIdAssociationContinueDialog={handleCmsIdAssociation}
      />
      <ViewHRModal
        open={viewHumanReadableModal.open}
        onClose={handleDialogClose}
        measureId={targetMeasure?.current?.id}
        exportMeasure={exportMeasure}
      />
    </div>
  );
}
