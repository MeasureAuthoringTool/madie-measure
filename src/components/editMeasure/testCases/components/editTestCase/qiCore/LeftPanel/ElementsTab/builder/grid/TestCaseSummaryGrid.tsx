import React, { useContext } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "../../../../../../../../../common/EditIcon";
import { ActionItemDef } from "../../../../../../../../../common/actionCenter/ActionCenter";
import "../../../../../styles/DataElementsTable.scss";
import { BundleEntry } from "fhir/r4";
import ViewHeadlineIcon from "@mui/icons-material/ViewHeadline";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ResourceContext from "../ResourceContext";
import {
  Button,
  MadieDeleteDialog,
} from "@madie/madie-design-system/dist/react";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import { Box, IconButton } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import getHl7ProfileLink, {
  normalizeProfileId,
} from "../../../../../../../../../../utils/hl7Links";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export const UI_BUILDER_VIEW_MESSAGE =
  "Viewing this in the UI builder is unsupported.";
export const UI_BUILDER_EDIT_MESSAGE =
  "Fixing this in the UI builder is unsupported. You can utilize the JSON workspace to edit it. Please contact the help desk if you have additional questions.";
export const UNSUPPORTED_PROFILE_ERROR = "Unsupported Profile";
export const RESOURCE_TYPE_MISMATCH_ERROR =
  "Profile and Resource Type do not match";
export const UNSUPPORTED_RESOURCE_ERROR = "Unsupported Resource";

const getUnsupportedResourceMessage = (canEdit: boolean) => {
  if (canEdit) {
    return `${UNSUPPORTED_RESOURCE_ERROR}. ${UI_BUILDER_EDIT_MESSAGE}`;
  }
  return `${UNSUPPORTED_RESOURCE_ERROR}. ${UI_BUILDER_VIEW_MESSAGE}`;
};

const getUnsupportedProfileMessage = (canEdit: boolean) => {
  if (canEdit) {
    return `${UNSUPPORTED_PROFILE_ERROR}. ${UI_BUILDER_EDIT_MESSAGE}`;
  }
  return `${UNSUPPORTED_PROFILE_ERROR}. ${UI_BUILDER_VIEW_MESSAGE}`;
};

const getResourceTypeMismatchMessage = (canEdit: boolean) => {
  if (canEdit) {
    return `${RESOURCE_TYPE_MISMATCH_ERROR}. ${UI_BUILDER_EDIT_MESSAGE}`;
  }
  return `${RESOURCE_TYPE_MISMATCH_ERROR}. ${UI_BUILDER_VIEW_MESSAGE}`;
};

interface ProfileValidationResult {
  isValid: boolean;
  error: string;
  message: string;
}

export interface GridDataEntry {
  title: string;
  entry: BundleEntry;
  validationResult?: ProfileValidationResult;
}

interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  onRowClone?: (row: any) => void;
  gridData: GridDataEntry[];
  testCaseCanEdit: boolean;
  measureModel: any;
  selectedRowId?: string;
  readOnly: boolean;
}

const isValidResourceType = (
  allResourceProfiles: ResourceIdentifier[],
  type: string
): boolean => {
  return (
    allResourceProfiles.find((resource) => resource.type === type) !== undefined
  );
};

export const validateProfiles = (
  entry: BundleEntry,
  allResourceProfiles: ResourceIdentifier[],
  canEdit: boolean
): ProfileValidationResult => {
  // get list of profiles for a test case resource from the meta
  const profiles = entry?.resource?.meta?.profile || [];
  // if no profiles, then check if resource type is valid
  if (profiles.length === 0) {
    const type = entry?.resource?.resourceType;
    if (type && isValidResourceType(allResourceProfiles, type)) {
      return { error: "", message: "", isValid: true };
    }
    return {
      error: UNSUPPORTED_RESOURCE_ERROR,
      message: getUnsupportedResourceMessage(canEdit),
      isValid: false,
    };
  }

  // find list of profiles from allResourceProfiles that match test case resource profiles
  const supportedProfiles = Array.from(
    allResourceProfiles
      .filter((resource) => profiles.includes(resource.profile))
      .reduce((map, resource) => map.set(resource.id, resource), new Map()) // dedup
      .values()
  );

  // if count doesn't match, then some profiles are unsupported
  if (
    supportedProfiles.length === 0 ||
    supportedProfiles.length !== profiles.length
  ) {
    return {
      isValid: false,
      error: UNSUPPORTED_PROFILE_ERROR,
      message: getUnsupportedProfileMessage(canEdit),
    };
  }

  // make sure all profiles have same resource type as the test case resource
  const resourceTypeMatch = supportedProfiles.every(
    (profile) => profile.type === entry?.resource.resourceType
  );
  if (!resourceTypeMatch) {
    return {
      isValid: false,
      error: RESOURCE_TYPE_MISMATCH_ERROR,
      message: getResourceTypeMismatchMessage(canEdit),
    };
  }
  return { error: "", message: "", isValid: true };
};

const TestCaseSummaryGrid = ({
  gridData,
  onRowEdit,
  onRowDelete,
  onRowClone,
  testCaseCanEdit,
  measureModel,
  selectedRowId,
  readOnly,
}: TestCaseSummaryGridProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [hoveredHeader, setHoveredHeader] = React.useState<string | null>(null);
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder
  const [deleteTarget, setDeleteTarget] = React.useState<any>(null);
  const [deleteAction, setDeleteAction] = React.useState<ActionItemDef | null>(
    null
  );
  const data = React.useMemo(
    () =>
      gridData?.map((gridItem) => ({
        ...gridItem,
        validationResult: validateProfiles(
          gridItem.entry,
          allResourceProfiles,
          testCaseCanEdit
        ),
      })) ?? [],
    [gridData, allResourceProfiles, testCaseCanEdit]
  );

  const actions = React.useMemo<ActionItemDef[]>(
    () => [
      {
        name: "Edit",
        icon: <EditIcon color="#0073C8" />,
        onClick: (targetContext: any) =>
          onRowEdit(targetContext?.entry || targetContext),
      },
      {
        name: "Clone",
        icon: <ContentCopyIcon sx={{ color: "#0073C8" }} />,
        onClick: (targetContext: any) => onRowClone?.(targetContext),
      },
      {
        name: "Remove",
        icon: <DeleteOutlinedIcon sx={{ color: "#D92F2F" }} />,
        onClick: (targetContext: any) =>
          onRowDelete(targetContext?.entry || targetContext),
      },
    ],
    [onRowEdit, onRowDelete, onRowClone]
  );

  const viewAction = React.useMemo<ActionItemDef[]>(
    () => [
      {
        name: "View",
        icon: <ViewHeadlineIcon />,
        onClick: (targetContext: any) =>
          onRowEdit(targetContext?.entry || targetContext),
      },
    ],
    [onRowEdit]
  );

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Profile",
        id: "resourceType",
        accessorFn: (row) => row.title,
        cell: ({ row }) => {
          const validationResult = row.original.validationResult;
          return (
            <div>
              <div>{row.original.title}</div>
              {validationResult && !validationResult.isValid && (
                <Tooltip
                  title={validationResult.message}
                  placement="bottom-start"
                  arrow
                  enterTouchDelay={0}
                  aria-label="Unsupported profile"
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
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#D92F2F",
                      fontWeight: 500,
                      display: "block",
                      mt: 0.5,
                    }}
                    tabIndex={0}
                    aria-label={validationResult.error}
                  >
                    {validationResult.error}
                  </Typography>
                </Tooltip>
              )}
            </div>
          );
        },
      },
      {
        header: "HL7",
        id: "hl7",
        enableSorting: false,
        size: 90,
        minSize: 90,
        maxSize: 90,
        cell: ({ row }) => {
          const { original } = row;
          const resourceProfiles = original.entry.resource.meta?.profile || [];
          const firstProfile = resourceProfiles[0];

          const profileMatch = allResourceProfiles?.find((resource) =>
            resourceProfiles.includes(resource.profile)
          );
          const resourceIdentifier = allResourceProfiles?.find(
            (resource) =>
              resource.title === original.title ||
              resource.type === original.entry.resource.resourceType
          );
          const hl7ProfileId =
            profileMatch?.id ||
            resourceIdentifier?.id ||
            normalizeProfileId(firstProfile);
          const link = getHl7ProfileLink(hl7ProfileId, measureModel);
          const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (link) {
              window.open(link, "_blank");
            }
          };
          return (
            <IconButton
              data-testid={`hl7-link-${
                hl7ProfileId || original.entry.resource.id
              }`}
              aria-label={`Open HL7 profile for ${
                hl7ProfileId || original.entry.resource.id
              }`}
              onClick={handleClick}
            >
              <OpenInNewIcon />
            </IconButton>
          );
        },
      },
      {
        header: "ID",
        id: "id",
        enableSorting: false,
        cell: ({ row }) => <div>{row.original.entry.resource.id}</div>,
      },
      {
        header: "Actions",
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => {
          const entry = row.original.entry;
          const validationResult = row.original.validationResult;
          const isPatientProfile = entry?.resource?.resourceType === "Patient";
          // For edit action, disable if unsupported
          // For Patient profiles, remove the Clone action
          const rowActions = testCaseCanEdit
            ? actions
                .filter(
                  (action) => !(action.name === "Clone" && isPatientProfile)
                )
                .map((action) =>
                  action.name === "Edit"
                    ? {
                        ...action,
                        disabled: !validationResult.isValid,
                        tooltip: !validationResult.isValid
                          ? validationResult.message
                          : undefined,
                      }
                    : action
                )
            : viewAction;
          return readOnly ? (
            <Tooltip
              title={validationResult.message}
              placement="bottom-start"
              arrow
              enterTouchDelay={0}
              aria-label={validationResult.message}
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
              <Box component="span" sx={{ display: "inline-block" }}>
                <Button
                  disabled={!validationResult.isValid}
                  variant="outline-filled"
                  data-testid={`view-profile-${entry.resource.id}`}
                  onClick={() => {
                    onRowEdit(entry);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile ${row.original.title} id ${entry.resource.id}`}
                >
                  View
                </Button>
              </Box>
            </Tooltip>
          ) : (
            <div style={{ display: "flex", gap: "8px" }}>
              {rowActions.map((action) => (
                <Tooltip
                  key={action.name}
                  title={
                    action.disabled && action.tooltip
                      ? action.tooltip
                      : action.name
                  }
                  placement="top"
                >
                  <span>
                    <IconButton
                      data-testid={`action-${entry.resource.id}-${action.name}`}
                      aria-label={action.name}
                      disabled={action.disabled}
                      onClick={() => {
                        if (action.disabled) return;

                        if (action.name === "Remove") {
                          setDeleteTarget(row.original);
                          setDeleteAction(action);
                        } else {
                          action.onClick(row.original);
                        }
                      }}
                    >
                      {action.disabled && React.isValidElement(action.icon)
                        ? React.cloneElement(action.icon as any, {
                            color: "#8C8C8C",
                            htmlColor: "#8C8C8C",
                          })
                        : action.icon}
                    </IconButton>
                  </span>
                </Tooltip>
              ))}
            </div>
          );
        },
      },
    ],
    [
      allResourceProfiles,
      measureModel,
      testCaseCanEdit,
      actions,
      viewAction,
      readOnly,
      onRowEdit,
      onRowDelete,
      onRowClone,
    ]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    // stabalize state to prevent animations from triggering on every rerender.
    state: {
      sorting,
    },
    meta: {
      testCaseCanEdit,
      readOnly,
      actions,
      viewAction,
      onRowEdit,
    },
  });

  return (
    <div className="table-scroll-container">
      <table className="data-elements-table test-case-summary-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isHovered = hoveredHeader === header.id;

                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={
                      header.column.id === "id"
                        ? "hl7-id-divider"
                        : header.column.id === "hl7"
                        ? "hl7-column"
                        : ""
                    }
                    style={{
                      position: "relative",
                      width: header.getSize(),
                    }}
                    onMouseEnter={() => setHoveredHeader(header.id)}
                    onMouseLeave={() => setHoveredHeader(null)}
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        header.column.toggleSorting();
                      }}
                      title={
                        header.column.getCanSort()
                          ? header.column.getNextSortingOrder() === "asc"
                            ? "Sort ascending"
                            : header.column.getNextSortingOrder() === "desc"
                            ? "Sort descending"
                            : "Clear sort"
                          : undefined
                      }
                      style={{
                        background: "none",
                        border: "none",
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                        fontWeight: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {header.column.getCanSort() &&
                          isHovered &&
                          !header.column.getIsSorted() && <UnfoldMoreIcon />}

                        {{
                          asc: <KeyboardArrowUpIcon />,
                          desc: <KeyboardArrowDownIcon />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </span>

                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={
                    cell.column.id === "id"
                      ? "hl7-id-divider"
                      : cell.column.id === "hl7"
                      ? "hl7-column"
                      : ""
                  }
                  style={{
                    backgroundColor:
                      row.original.entry.resource.id === selectedRowId
                        ? "#f8f8f8"
                        : "inherit",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <MadieDeleteDialog
        open={!!deleteTarget}
        onContinue={() => {
          deleteAction?.onClick(deleteTarget);
          setDeleteTarget(null);
          setDeleteAction(null);
        }}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteAction(null);
        }}
        dialogTitle="Remove Element"
        name={deleteTarget?.entry?.resource?.resourceType}
        hideWarning={true}
        alternateText="Remove"
      />
    </div>
  );
};

export default TestCaseSummaryGrid;
