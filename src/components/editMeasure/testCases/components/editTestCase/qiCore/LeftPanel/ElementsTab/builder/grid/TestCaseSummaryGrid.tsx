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

export interface GridDataEntry {
  title: string;
  entry: BundleEntry;
}
interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  gridData: GridDataEntry[];
  testCaseCanEdit: boolean;
  selectedRowId?: string;
}

const TestCaseSummaryGrid = ({
  gridData,
  onRowEdit,
  onRowDelete,
  testCaseCanEdit,
  selectedRowId,
}: TestCaseSummaryGridProps) => {
  const allResourceProfiles = useContext(ResourceContext); // get all profiles loaded from builder

  const data = React.useMemo(() => gridData ?? [], [gridData]);

  const actions = React.useMemo<ActionItemDef[]>(
    () => [
      {
        name: "Edit",
        icon: <EditIcon color="#0073C8" />,
        onClick: (targetContext: any) => onRowEdit(targetContext),
      },
      {
        name: "Delete",
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

  const isSupportedProfile = (entry: BundleEntry) => {
    const profiles = entry?.resource?.meta?.profile || [];
    return profiles.some((url: string) =>
      allResourceProfiles?.some((profileObj: any) => profileObj.profile === url)
    );
  };

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Profile",
        id: "resourceType",
        cell: ({ row }) => {
          const entry = row.original.entry;
          const supported = isSupportedProfile(entry);
          return (
            <div>
              <div>{row.original.title}</div>
              {!supported && (
                <Tooltip
                  title="This profile is unsupported in the UI builder. You can utilize the JSON workspace to edit it. Please contact the help desk if you have additional questions."
                  placement="bottom-start"
                  arrow
                  enterTouchDelay={0}
                  aria-label="Unsupported profile tooltip"
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
                    aria-label="Unsupported Profile"
                  >
                    Unsupported Profile
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
          const supported = isSupportedProfile(entry);
          // For edit action, disable if unsupported
          const rowActions = testCaseCanEdit
            ? actions.map((action) =>
                action.name === "Edit"
                  ? {
                      ...action,
                      disabled: !supported,
                      tooltip: !supported ? "Unsupported Profile" : undefined,
                    }
                  : action
              )
            : viewAction;
          return (
            <ActionCenter
              actions={rowActions}
              testId={row.original.entry.resource.id}
              target={row.original.entry}
            />
          );
        },
      },
    ],
    [actions, testCaseCanEdit, viewAction]
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
