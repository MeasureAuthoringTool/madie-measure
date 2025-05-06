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
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  bundle: any;
}

const TestCaseSummaryGrid = ({
  bundle,
  onRowEdit,
  onRowDelete,
}: TestCaseSummaryGridProps) => {
  const data = React.useMemo(() => bundle?.entry ?? [], [bundle]);

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
        accessorFn: (row) => row.resource.resourceType,
        id: "resourceType",
      },
      {
        header: "ID",
        accessorFn: (row) => row.resource.id,
        id: "id",
      },
      {
        header: "ID 2",
        accessorFn: (row) => row.resource.id,
        id: "id1 2",
      },
      {
        header: "ID 3",
        accessorFn: (row) => row.resource.id,
        id: "id1 3",
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionCenter actions={actions} target={row.original} />
        ),
      },
    ],
    [actions]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      size: 100,
    },
    initialState: {
      columnPinning: {
        left: ["resourceType"],
        right: ["actions"],
      },
    },
  });

  return (
    <div className="table-scroll-container">
      <table className="data-elements-table">
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
              {row.getVisibleCells().map((cell, idx) => (
                <td key={cell.id}>
                  {idx === 0 ? (
                    <div className="first-column-with-icons">
                      <div className="icons">
                        <ArrowDropUpIcon
                          style={{
                            color: "#125496",
                            fontSize: "large",
                          }}
                        />
                        <ArrowDropDownIcon
                          style={{
                            color: "#8C8C8C",
                            fontSize: "large",
                          }}
                        />
                      </div>
                      <div className="cell-body">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    </div>
                  ) : (
                    flexRender(cell.column.columnDef.cell, cell.getContext())
                  )}
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
