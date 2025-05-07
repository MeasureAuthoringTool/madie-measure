import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import GridItemMenu from "./GridItemMenu";

interface TestCaseSummaryGridProps {
  onRowEdit: (row: any) => void;
  onRowDelete: (row: any) => void;
  bundle: any;
}
interface RecursionProps {
  value: any;
  keyPrefix?: string;
}



const WeOnlyDoRecursionNowIguess: React.FC<RecursionProps> = ({
  value,
  keyPrefix = "",
}) => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return (
      <div key={keyPrefix} style={{ marginLeft: "20px" }}>
        <b>{keyPrefix}:</b> {value.toString()}
      </div>
    );
  } else if (Array.isArray(value)) {
    return (
      <div key={keyPrefix} style={{ marginLeft: "20px" }}>
        <b>{keyPrefix}:</b> [
        {value.map((item, index) => (
          <WeOnlyDoRecursionNowIguess
            key={`${keyPrefix}[${index}]`}
            value={item}
            keyPrefix={`${keyPrefix}[${index}]`}
          />
        ))}
        ]
      </div>
    );
  } else if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);

    return (
      <div key={keyPrefix} style={{ marginLeft: "20px" }}>
        {keyPrefix && <b>{keyPrefix}:</b>}
        {entries.map(([childKey, childValue]) => (
          <WeOnlyDoRecursionNowIguess
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

// Given a bundle, we need to know the max number of attributes in order to make a column for each one, regardless of the minimum
const TestCaseSummaryGrid = ({
  bundle,
  onRowEdit,
  onRowDelete,
}: TestCaseSummaryGridProps) => {
  console.log("bundle is", bundle.entry);
  let addedAttributeCount = 0;

  bundle.entry.forEach((entry) => {
    const { resource } = entry;
    // probably filter this out since we dont care about it.
    const currentAttributeCount = Object.keys(resource).filter(
      (attr) => attr !== "resourceType" && attr !== "id"
    ).length;
    if (addedAttributeCount < currentAttributeCount) {
      addedAttributeCount = currentAttributeCount;
    }
  });

  const attributeColumns: GridColDef[] = Array.from(
    { length: addedAttributeCount },
    (_, index) => ({
      field: `attribute_${index + 1}`,
      headerName: `Attribute ${index + 1}`,
      width: 200,
      valueGetter: (_value, row) => {
        const attributeKeys =
          Object.keys(row.resource).filter(
            (key) => key !== "resourceType" && key !== "id"
          ) || null;
        const attributeKey = attributeKeys[index];
        const value = row.resource[attributeKey]; // Practitioner, Condition, Observation etc
        console.log("key", attributeKey, "value", value);
        if (value) {
          return { attributeKey, value };
        }
        return null;
      },
      renderCell: (params) => {
        const cellData = params.value;

        if (!cellData) return null;

        return (
          <div style={{ whiteSpace: "pre-wrap" }}>
          <WeOnlyDoRecursionNowIguess
            value={cellData.value}
            keyPrefix={cellData.attributeKey}
            />
            </div>
        );
      },
    })
  );

  const columns: GridColDef[] = [
    {
      field: "resourceType",
      headerName: "Resource & Value Set",
      width: 250,
      valueGetter: (_value, row) => {
        return row.resource.resourceType;
      },
    },
    {
      field: "id",
      headerName: "ID",
      width: 300,
      valueGetter: (_value, row) => row.resource.id,
    },
    ...attributeColumns,
    // eslint-disable-next-line no-console
    {
      field: "",
      headerName: "Actions",
      width: 150,
      renderCell: (params) => {
        return (
          <GridItemMenu
            onRowEdit={onRowEdit}
            onRowDelete={onRowDelete}
            row={params.row}
          />
        );
      },
    },
  ];

  return (
    <DataGrid
      rows={bundle?.entry ?? []}
      columns={columns}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 10 },
        },
      }}
      getRowId={(data) => data.resource.id}
      pageSizeOptions={[10, 20, 50]}
      checkboxSelection
      sx={{
        width: "100%",
        height: 450,
      }}
    />
  );
};

export default TestCaseSummaryGrid;
