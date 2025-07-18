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
import GenerateAttributeHTML from "./GenerateAttributeHTML";
import { getAttributes, getMaxAttributes } from "./TestCaseSummaryGridUtils";

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
  const maxAttributes = getMaxAttributes(data);
  const attributeColumns: ColumnDef<any>[] = Array.from(
    { length: maxAttributes },
    (_, index) => ({
      header: `Attribute ${index + 1}`,
      accessorFn: (row) => {
        const attributes = getAttributes(row);
        const attributeKey = attributes[index];
        const value = row.resource[attributeKey];
        return { attributeKey, value };
      },
      cell: (params) => {
        //@ts-ignore
        const { value, attributeKey } = params.getValue();
        return value ? (
          <GenerateAttributeHTML value={value} keyPrefix={attributeKey} />
        ) : (
          <div>-</div>
        );
      },
    })
  );

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
      ...attributeColumns,
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
    [actions, attributeColumns]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
