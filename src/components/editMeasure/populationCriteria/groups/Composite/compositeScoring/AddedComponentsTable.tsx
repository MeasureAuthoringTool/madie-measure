import React, { useMemo, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table";
import {
  TruncateText,
  MadieDialog,
  Pagination,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import * as _ from "lodash";

import tw from "twin.macro";
import "styled-components/macro";
import { convertDate } from "../../../../testCases/components/testCaseLanding/common/TestCaseTable/TestCaseTable";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Measure } from "@madie/madie-models";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

export default function AddedComponentsTable({ components }) {
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const retrievedComponents = [];
  console.log('components are', components)
  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [
      {
        header: "Measure",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureName",
      },
      {
        header: "Version",
        cell: (info) => (
          <>
            <TruncateText
              text={info.row.original.version}
              maxLength={20}
              dataTestId={`measure-version-${info.row.original.id}`}
            />
          </>
        ),
        accessorKey: "CMS ID",
      },
      {
        header: "CMS ID",
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original?.measureSet?.cmsId)}
            maxLength={20}
            dataTestId={`measure-cmsId-${info.row.original.id}`}
          />
        ),
        accessorKey: "cmsId",
      },
      {
        header: "Updated",
        cell: (info) => {
          const converted = convertDate(info.row.original.lastModifiedAt);
          const { date } = converted;
          return <div style={{ marginLeft: "8px" }}>{date}</div>;
        },
        accessorKey: "lastModifiedAt",
      },
      {
        header: "",
        cell: (info) => {
          if (info.row.original?.hasAssociatedMeasures) {
            return (
              <span
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              ></span>
            );
          } else {
            return <></>;
          }
        },
        accessorKey: "expandArrow",
      },
    ];

    return columnDefs;
  }, []);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: components,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    enableRowSelection: true,
  });

  return (
    <div>
      <h2></h2>

      <div className="measure-table no-margin-top">
        <div className="table" style={{ overflow: "auto" }}>
          <table
            tw="min-w-full"
            data-testid="measure-list-tbl"
            className="ml-table"
            style={{
              borderSpacing: "0 2em !important",
              borderBottom: "1px solid rgb(140, 140, 140)",
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
                        onClick={header.column.getToggleSortingHandler()}
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
                            title={
                              header.column.getCanSort()
                                ? header.column.getNextSortingOrder() === "asc"
                                  ? "Sort ascending"
                                  : header.column.getNextSortingOrder() ===
                                    "desc"
                                  ? "Sort descending"
                                  : "Clear sort"
                                : undefined
                            }
                          >
                            <span className="arrowDisplay">
                              {header.column.columnDef.header !== "" &&
                                header.column.getCanSort() &&
                                isHovered &&
                                !header.column.getIsSorted() && (
                                  <UnfoldMoreIcon />
                                )}
                              {header.column.columnDef.header !== "" &&
                                ({
                                  asc: <KeyboardArrowUpIcon />,
                                  desc: <KeyboardArrowDownIcon />,
                                }[header.column.getIsSorted() as string] ??
                                  null)}
                            </span>
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
            <tbody className="table-body" style={{ padding: 20 }}>
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
