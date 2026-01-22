import React, { useMemo, useState } from "react";
import {
  TruncateText,
  MadieDialog,
} from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Measure } from "@madie/madie-models";
import { customSort } from "../../../../../measureLanding/measureList/MeasureList";
import * as _ from "lodash";
import tw from "twin.macro";
import "styled-components/macro";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

export default function AddComponentsDialog({ open, onClose }) {
  const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

  const [hoveredHeader, setHoveredHeader] = useState<string>("");

  const columns = useMemo<ColumnDef<Measure>[]>(() => {
    const columnDefs = [
      {
        header: "Measure Name",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.id}`}
          />
        ),
        accessorKey: "measureName",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.measureName, rowB.original.measureName),
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
        accessorKey: "version",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.version, rowB.original.version),
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
        sortingFn: (rowA, rowB) =>
          customSort(
            _.toString(rowA.original.measureSet.cmsId),
            _.toString(rowB.original.measureSet.cmsId)
          ),
      },
      {
        header: "Updated",
        cell: (info) => (
          <TruncateText
            text={_.toString(info.row.original?.measureSet?.cmsId)}
            maxLength={20}
            dataTestId={`measure-lastModifiedAt-${info.row.original.id}`}
          />
        ),
        accessorKey: "lastModifiedAt",
        sortingFn: (rowA, rowB) =>
          customSort(
            _.toString(rowA.original.lastModifiedAt),
            _.toString(rowB.original.lastModifiedAt)
          ),
      },
    ];

    return columnDefs;
  }, []);

  const table = useReactTable({
    data: [],
    columns,
    getRowId: (row) => row.id,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleDialogClose = () => {
    onClose();
  };

  const handleDialogSubmit = (e) => {
    e.preventDefault();
    console.log("here");
  };

  return (
    <MadieDialog
      title="Select Composite Measure Components"
      dialogProps={{
        onClose: handleDialogClose,
        open,
        onSubmit: handleDialogSubmit,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "select-composite-measure-components-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "select-composite-measure-components-continue-button",
        continueText: "Save",
      }}
      maxWidth={"lg"}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                              : header.column.getNextSortingOrder() === "desc"
                              ? "Sort descending"
                              : "Clear sort"
                            : undefined
                        }
                      >
                        <span className="arrowDisplay">
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
                    )}
                  </TH>
                );
              })}
            </tr>
          ))}
        </thead>
      </table>
    </MadieDialog>
  );
}
