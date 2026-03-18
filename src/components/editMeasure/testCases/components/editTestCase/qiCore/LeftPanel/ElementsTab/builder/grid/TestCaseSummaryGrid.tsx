import React, { useContext } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "../../../../../../../../../common/EditIcon";
import ActionCenter, {
  ActionItemDef,
} from "../../../../../../../../../common/actionCenter/ActionCenter";
import "../../../../../styles/DataElementsTable.scss";
import { BundleEntry } from "fhir/r4";
import ViewHeadlineIcon from "@mui/icons-material/ViewHeadline";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ResourceContext from "../ResourceContext";
import { Button } from "@madie/madie-design-system/dist/react";
import { ResourceIdentifier } from "../../../../../../../api/models/ResourceIdentifier";
import { Box } from "@mui/material";

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
  gridData: GridDataEntry[];
  testCaseCanEdit: boolean;
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
  testCaseCanEdit,
  selectedRowId,
  readOnly,
}: TestCaseSummaryGridProps) => {
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder

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
        onClick: (targetContext: any) => onRowEdit(targetContext),
      },
      {
        name: "Remove",
        icon: <DeleteOutlinedIcon sx={{ color: "#D92F2F" }} />,
        onClick: (targetContext: any) => onRowDelete(targetContext),
      },
    ],
    [onRowEdit, onRowDelete]
  );

  const viewAction = React.useMemo<ActionItemDef[]>(
    () => [
      {
        name: "View",
        icon: <ViewHeadlineIcon />,
        onClick: (targetContext: any) => onRowEdit(targetContext),
      },
    ],
    [onRowEdit]
  );

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Profile",
        id: "resourceType",
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
        header: "ID",
        id: "id",
        cell: ({ row }) => <div>{row.original.entry.resource.id}</div>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => {
          const entry = row.original.entry;
          const validationResult = row.original.validationResult;
          // For edit action, disable if unsupported
          const rowActions = testCaseCanEdit
            ? actions.map((action) =>
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
            <ActionCenter
              actions={rowActions}
              testId={entry.resource.id}
              target={entry}
            />
          );
        },
      },
    ],
    [testCaseCanEdit, actions, viewAction, readOnly, onRowEdit]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="table-scroll-container">
      <table className="data-elements-table test-case-summary-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ position: "relative", width: header.getSize() }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
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
    </div>
  );
};

export default TestCaseSummaryGrid;
