import React, { useEffect, useRef, useState, useMemo } from "react";
import { Measure } from "@madie/madie-models";
import {
  MadieDialog,
  Pagination,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import tw from "twin.macro";
import "styled-components/macro";

interface ViewMeasureHistoryDialogProps {
  measures: Measure[];
  open: boolean;
  onClose: Function;
}

export interface MeasureHistoryActions {
  performedAt: any;
  actionType: string;
  performedBy: string;
  additionalActionMessage?: string;
}

export default function ViewMeasureHistoryDialog(
  props: ViewMeasureHistoryDialogProps
) {
  const { measures, open, onClose } = props;
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [historyData, setHistoryData] = useState<MeasureHistoryActions[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (open && measures?.length === 1) {
      setLoading(true);
      measureServiceApi
        .getMeasureHistoryLogs(measures[0]?.id)
        .then((res: MeasureHistoryActions[]) => {
          const processed = (res || []).map((item) => ({
            ...item,
            additionalActionMessage:
              item.additionalActionMessage === "[]"
                ? ""
                : item.additionalActionMessage,
          }));
          const sorted = processed.sort(
            (a, b) =>
              new Date(b.performedAt).getTime() -
              new Date(a.performedAt).getTime()
          );
          setHistoryData(sorted);
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setHistoryData([]);
      setPage(0);
    }
  }, [open, measures, measureServiceApi]);

  // Memoize paginated data
  const paginatedData = useMemo(
    () => historyData.slice(page * limit, page * limit + limit),
    [historyData, page, limit]
  );

  const columns = useMemo<ColumnDef<MeasureHistoryActions>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "performedAt",
        cell: (info) => (
          <TruncateText
            text={
              info.row.original.performedAt
                ? new Date(info.row.original.performedAt)
                    .toLocaleString()
                    .replace(",", "")
                : ""
            }
            maxLength={120}
            dataTestId={`measure-history-performedAt_${info.row.index}`}
          />
        ),
      },
      {
        header: "User Action",
        accessorKey: "actionType",
        cell: (info) => (
          <TruncateText
            text={info.row.original.actionType}
            maxLength={120}
            dataTestId={`measure-history-action_${info.row.index}`}
          />
        ),
      },
      {
        header: "HarpID",
        accessorKey: "performedBy",
        cell: (info) => (
          <TruncateText
            text={info.row.original.performedBy}
            maxLength={120}
            dataTestId={`measure-history-performedBy_${info.row.index}`}
          />
        ),
      },
      {
        header: "Additional Info",
        accessorKey: "additionalActionMessage",
        cell: (info) => (
          <TruncateText
            text={info.row.original.additionalActionMessage || "-"}
            maxLength={120}
            dataTestId={`measure-history-additionalInfo_${info.row.index}`}
          />
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: { pagination: { pageIndex: page, pageSize: limit } },
  });

  const totalItems = historyData.length;

  return (
    <MadieDialog
      form
      title="Measure History"
      dialogProps={{
        onClose,
        open,
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Close",
        "data-testid": "measure-history-close-button",
      }}
      continueButtonProps={null}
      maxWidth={"lg"}
    >
      <div style={{ margin: "0 32px 40px 32px" }}>
        <p
          style={{
            fontFamily: "Rubik",
            fontWeight: 500,
            fontStyle: "normal",
            fontSize: "17px",
            lineHeight: "24px",
            verticalAlign: "middle",
          }}
          data-testid="measure-history-measure-name"
        >
          {measures[0]?.measureName || ""}
        </p>
      </div>

      <div className="measure-table no-margin-top">
        <div className="table" style={{ overflow: "auto" }}>
          <table
            tw="min-w-full"
            data-testid="measure-history-table"
            className="ml-table"
            style={{
              borderSpacing: "0 2em !important",
              borderBottom: "1px solid rgb(140, 140, 140)",
            }}
          >
            <thead tw="bg-slate">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="header-cell"
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontWeight: "bold",
                        fontSize: "1rem",
                      }}
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
            <tbody className="table-body" style={{ padding: 20 }}>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} tw="text-center p-2">
                    No history found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
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
                      <td
                        key={cell.id}
                        data-testid={`measure-history-cell-${cell.id}`}
                        style={{ padding: "1rem" }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            totalItems={totalItems}
            visibleItems={paginatedData.length}
            limitOptions={[10, 25, 50]}
            offset={page * limit}
            page={page + 1}
            limit={limit}
            handlePageChange={(e, v) => setPage(v - 1)}
            handleLimitChange={(e) => {
              setLimit(e.target.value);
              setPage(0);
            }}
            count={Math.ceil(totalItems / limit)}
            shape="rounded"
            hideNextButton={!(page + 1 < Math.ceil(totalItems / limit))}
            hidePrevButton={!(page > 0)}
          />
        </div>
      </div>
    </MadieDialog>
  );
}
