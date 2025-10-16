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

interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  entry: any;
}

const TestCaseSummaryGrid = ({
  entry,
  onRowEdit,
  onRowDelete,
}: TestCaseSummaryGridProps) => {
  const data = React.useMemo(() => entry ?? [], [entry]);

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

  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Resource & Value Set",
        id: "resourceType",
        cell: ({ row }) => <div>{row.original.resource.resourceType}</div>,
      },
      {
        header: "ID",
        id: "id",
        cell: ({ row }) => <div>{row.original.resource.id}</div>,
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionCenter
            actions={actions}
            testId={row.original.resource.id}
            target={row.original}
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
