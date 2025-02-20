import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Backdrop, Typography } from "@mui/material";
import {
  TextField,
  MadieDialog,
  Button,
  TruncateText,
  MadieSpinner,
} from "@madie/madie-design-system/dist/react";
import "./ShareDialog.scss";
import * as _ from "lodash";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Measure } from "@madie/madie-models";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import "../../measureLanding/MeasureLanding.scss";
import tw from "twin.macro";
import "styled-components/macro";
import { customSort } from "../../editMeasure/testCases/components/testCaseLanding/common/Hooks/UseTestCases";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;

interface ShareDialogProps {
  measure: Measure;
  open: boolean;
  onClose: Function;
}

interface SharedMeasure {
  measureId: string;
  measureName: string;
  userId: string;
  dateShared: string;
}

const ShareDialog = ({ measure, open, onClose }: ShareDialogProps) => {
  const measureSearchApi = useRef(useMeasureServiceApi());

  const [sharedMeasures, setSharedMeasures] = useState<SharedMeasure[]>([]);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const getSharedMeasure = useCallback(() => {
    if (!measure || !open) {
      return;
    }

    setSharedMeasures([]);
    setErrorMessage("");
    setLoading(true);

    measureSearchApi.current
      .getSharedWithUserIds(measure.id)
      .then((response: string[]) => {
        setSharedMeasures(
          response.map((userId) => ({
            measureId: measure.id,
            measureName: measure.measureName,
            userId,
            dateShared: "-",
          }))
        );
      })
      .catch((error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [measure, open]);

  useEffect(() => {
    getSharedMeasure();
  }, [getSharedMeasure]);

  const columns = useMemo<ColumnDef<SharedMeasure>[]>(() => {
    return [
      {
        header: "Measure",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.measureName}`}
          />
        ),
        accessorKey: "measureName",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.measureName, rowB.original.measureName),
      },
      {
        header: "User",
        cell: (info) => (
          <TruncateText
            text={info.row.original.userId}
            maxLength={120}
            dataTestId={`user-${info.row.original.userId}`}
          />
        ),
        accessorKey: "userId",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.userId, rowB.original.userId),
      },
      {
        header: "Date Shared",
        cell: (info) => (
          <TruncateText
            text={info.row.original.dateShared}
            maxLength={120}
            dataTestId={`date-shared-${info.row.original.dateShared}`}
          />
        ),
        accessorKey: "dateShared",
        sortingFn: (rowA, rowB) =>
          customSort(rowA.original.dateShared, rowB.original.dateShared),
      },
    ];
  }, [measure]);

  const table = useReactTable({
    data: sharedMeasures,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <MadieDialog
      form={false}
      title="Shared With"
      dialogProps={{
        onClose,
        open,
        maxWidth: "lg",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Cancel",
        "data-testid": "share-cancel-button",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        continueText: "Save",
        "data-testid": "share-save-button",
      }}
    >
      <div data-testid="share-dialog">
        <div id="measure-landing" data-testid="measure-landing">
          <div id="add-user-id-search">
            <div>
              <TextField
                label="HARP ID"
                id="harp-id-field"
                name="harpId"
                inputProps={{
                  "data-testid": "harp-id-input",
                }}
              />
            </div>
            <div>
              <Button
                data-testid={`add-user-btn`}
                variant="outline"
                disabled={true}
                style={{ marginTop: 20 }}
              >
                Add User
              </Button>
            </div>
          </div>

          <div className="measure-table no-margin-top">
            <div className="table" style={{ overflow: "auto" }}>
              <table
                tw="min-w-full"
                data-testid="shared-measure-list-tbl"
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
                                    ? header.column.getNextSortingOrder() ===
                                      "asc"
                                      ? "Sort ascending"
                                      : header.column.getNextSortingOrder() ===
                                        "desc"
                                      ? "Sort descending"
                                      : "Clear sort"
                                    : undefined
                                }
                              >
                                <span className="arrowDisplay">
                                  {header.column.getCanSort() &&
                                    isHovered &&
                                    !header.column.getIsSorted() && (
                                      <UnfoldMoreIcon />
                                    )}
                                  {{
                                    asc: <KeyboardArrowUpIcon />,
                                    desc: <KeyboardArrowDownIcon />,
                                  }[header.column.getIsSorted() as string] ??
                                    null}
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
                  {errorMessage ? (
                    <tr>
                      <td colSpan={columns.length}>{errorMessage}</td>
                    </tr>
                  ) : _.isEmpty(sharedMeasures) ? (
                    <tr>
                      <td colSpan={columns.length}>
                        This measure is not yet shared with anyone. Enter the
                        HARP ID of the user you'd like to share it with and
                        click the (Add User) button above to share the measure.
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
                            data-testid={`measure-name-${cell.id}`}
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
            </div>
          </div>
        </div>
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
          <Typography color="inherit">Loading shared measures...</Typography>
        </Backdrop>
      </div>
    </MadieDialog>
  );
};

export default ShareDialog;
