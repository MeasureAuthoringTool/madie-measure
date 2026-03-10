import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Pagination,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import tw from "twin.macro";
import "styled-components/macro";
import { Measure } from "@madie/madie-models";
import * as _ from "lodash";

const TH = tw.th`p-3 text-left text-sm`;
const TD = tw.td`p-3 text-left text-sm break-keep`;

interface TransferredMeasuresTableProps {
  measures: Measure[];
  showOwnerColumn?: boolean;
}

interface RowData {
  measureName: string;
  model: string;
  cmsId: number;
  owner?: string;
}

export const TransferredMeasuresTable = ({
  measures,
  showOwnerColumn = false,
}: TransferredMeasuresTableProps) => {
  const [visibleMeasures, setVisibleMeasures] = useState<Measure[]>([]);
  // pagination utilities
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const managePagination = useCallback(() => {
    if (measures.length < currentLimit) {
      setOffset(0);
      setVisibleMeasures([...measures]);
      setVisibleItems(measures.length);
      setTotalItems(measures.length);
      setTotalPages(1);
    } else {
      const start = (currentPage - 1) * currentLimit;
      const end = start + currentLimit;
      const newVisibleMeasures = measures.slice(start, end);
      setVisibleMeasures(newVisibleMeasures);
      setOffset(start);
      setVisibleItems(newVisibleMeasures.length);
      setTotalItems(measures.length);
      setTotalPages(Math.ceil(measures.length / currentLimit));
    }
  }, [
    currentLimit,
    currentPage,
    measures,
    setOffset,
    setVisibleMeasures,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
  ]);

  const canGoNext = (() => {
    return currentPage < totalPages;
  })();
  const canGoPrev = currentPage > 1;

  const handlePageChange = (e, v) => {
    setCurrentPage(v);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    managePagination();
  }, [measures, currentPage, currentLimit, managePagination]);

  // Table data
  const data: RowData[] = useMemo(
    () =>
      visibleMeasures.map((measure) => ({
        measureName: measure.measureName,
        model: measure.model,
        cmsId: measure.measureSet?.cmsId,
        owner: measure.measureSet?.owner,
      })),
    [visibleMeasures]
  );

  // Column definitions
  const columns: ColumnDef<RowData>[] = useMemo(() => {
    const baseColumns: ColumnDef<RowData>[] = [
      {
        accessorKey: "measureName",
        header: "Measure",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.measureName}`}
          />
        ),
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "cmsId",
        header: "CMS ID",
        cell: (info) =>
          _.toString(info.getValue()).concat(
            info.row.original.model.startsWith("QI-Core") && info.getValue()
              ? "FHIR"
              : ""
          ),
      },
    ];

    if (showOwnerColumn) {
      baseColumns.push({
        accessorKey: "owner",
        header: "Current Measure Owner",
        cell: (info) => info.getValue() || "",
      });
    }

    return baseColumns;
  }, [showOwnerColumn]);

  // Create the table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <table tw="min-w-full" data-testid="transfer-measure-tbl">
        <thead tw="bg-slate">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TH key={header.id} scope="col">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TH>
              ))}
            </tr>
          ))}
        </thead>
        <tbody data-testid="transfer-measure-tbl-body">
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className="transfer-measure-row"
              data-testid={`row-${index}`}
              style={{
                borderTop: "solid 1px #8c8c8c",
                paddingTop: "32px",
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TD key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TD>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {measures?.length > 0 && (
        <div
          className="pagination-container"
          data-testid="trasfer-measure-pagination"
        >
          <Pagination
            totalItems={totalItems}
            limitOptions={[5, 10, 25, 50]}
            visibleItems={visibleItems}
            offset={offset}
            handlePageChange={handlePageChange}
            handleLimitChange={handleLimitChange}
            page={currentPage}
            limit={currentLimit}
            count={totalPages}
            hideNextButton={!canGoNext}
            hidePrevButton={!canGoPrev}
            shape="rounded"
          />
        </div>
      )}
    </>
  );
};

export default TransferredMeasuresTable;
