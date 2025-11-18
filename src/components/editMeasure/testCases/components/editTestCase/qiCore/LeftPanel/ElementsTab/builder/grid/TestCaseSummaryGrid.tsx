import React from "react";
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

export interface GridDataEntry {
  title: string;
  entry: BundleEntry;
}
interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  gridData: GridDataEntry[];
  testCaseCanEdit: boolean;
}

const TestCaseSummaryGrid = ({
  gridData,
  onRowEdit,
  onRowDelete,
  testCaseCanEdit,
}: TestCaseSummaryGridProps) => {
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

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Profile",
        id: "resourceType",
        cell: ({ row }) => <div>{row.original.title}</div>,
      },
      {
        header: "ID",
        id: "id",
        cell: ({ row }) => <div>{row.original.entry.resource.id}</div>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionCenter
            actions={testCaseCanEdit ? actions : viewAction}
            testId={row.original.entry.resource.id}
            target={row.original.entry}
          />
        ),
      },
    ],
    [actions]
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
              {headerGroup.headers.map((header, idx) => (
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
                <td key={cell.id}>
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
