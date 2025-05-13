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
import {
  getLastPart,
  getIndexFromPathWithoutBrackets,
  stripArrayIndices,
} from "../../../../../../../api/fhirDefinitionServiceUtilities";

interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  bundle: any;
}

interface GenerateAttributeHTMLProps {
  value: any;
  keyPrefix?: string;
  root?: boolean;
}

const GenerateAttributeHTML: React.FC<GenerateAttributeHTMLProps> = ({
  value,
  keyPrefix = "",
}) => {
  let lastPart = stripArrayIndices(getLastPart(keyPrefix));
  const index = getIndexFromPathWithoutBrackets(getLastPart(keyPrefix));
  if (index !== undefined && index !== null) {
    lastPart = `${lastPart} ${Number(index) + 1}`;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    // Base case, just printing whatever it is.
    return (
      <div key={keyPrefix} className="recursive-attribute-container">
        <b>{lastPart}:</b> {value.toString()}
      </div>
    );
    // It's an array
  } else if (Array.isArray(value)) {
    return (
      <div key={keyPrefix} className="recursive-attribute-container">
        <b>{lastPart}:</b>
        {value.map((item, index) => (
          <GenerateAttributeHTML
            key={`${keyPrefix}[${index}]`}
            value={item}
            keyPrefix={`${keyPrefix}[${index}]`}
          />
        ))}
      </div>
    );
    // It's an object with it's own properties that we need to recurse over
  } else if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    return (
      <div key={keyPrefix} className="recursive-attribute-container">
        <b>{lastPart}:</b>
        {entries.map(([childKey, childValue]) => (
          <GenerateAttributeHTML
            key={keyPrefix ? `${keyPrefix}.${childKey}` : childKey}
            value={childValue}
            keyPrefix={keyPrefix ? `${keyPrefix}.${childKey}` : childKey}
          />
        ))}
      </div>
    );
  }

  return null;
};

const TestCaseSummaryGrid = ({
  bundle,
  onRowEdit,
  onRowDelete,
}: TestCaseSummaryGridProps) => {
  const data = React.useMemo(() => bundle?.entry ?? [], [bundle]);
  const maxAttributes = Math.max(
    ...data.map(
      (entry) =>
        Object.entries(entry.resource || {}).filter(
          ([key, value]) =>
            key !== "resourceType" &&
            key !== "id" &&
            value != null &&
            value !== ""
        ).length
    )
  );

  const attributeColumns: ColumnDef<any>[] = Array.from(
    { length: maxAttributes },
    (_, index) => ({
      header: `Attribute ${index + 1}`,
      accessorFn: (row) => {
        const attributes = Object.keys(row.resource || {}).filter(
          (key) => key !== "resourceType" && key !== "id"
        );
        const attributeKey = attributes[index];
        const value = row.resource[attributeKey];
        return { attributeKey, value };
      },
      cell: (params) => {
        //@ts-ignore
        const { value, attributeKey } = params.getValue();
        return value ? (
          <GenerateAttributeHTML
            value={value}
            keyPrefix={attributeKey}
            root={true}
          />
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
        accessorFn: (row) => row.resource.resourceType,
        id: "resourceType",
        cell: ({ row }) => {
          return <div>{row.original.resource.resourceType}</div>;
        },
      },
      {
        header: "ID",
        accessorFn: (row) => row.resource.id,
        id: "id",
        cell: ({ row }) => {
          return <div>{row.original.resource.id}</div>;
        },
      },
      ...attributeColumns,
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionCenter
            actions={actions}
            testId={row.id}
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
