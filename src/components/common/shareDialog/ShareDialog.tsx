import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Backdrop, Checkbox, Typography } from "@mui/material";
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
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Measure } from "@madie/madie-models";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import "../../measureLanding/MeasureLanding.scss";
import tw from "twin.macro";
import "styled-components/macro";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;
const icon = <CheckBoxOutlineBlankIcon fontSize="large" />;
const checkedIcon = <CheckBoxIcon fontSize="large" />;
const keyboardArrowStyles = {
  color: "#0073C8",
  width: 40,
  height: 40,
};

interface ShareDialogProps {
  measures: Measure[];
  open: boolean;
  option: string;
  onClose: Function;
}

interface SharedMeasure {
  measureId: string;
  measureName: string;
  userId: string;
  dateShared: string;
  subRows: SharedMeasure[];
}

const ShareDialog = ({ measures, open, option, onClose }: ShareDialogProps) => {
  const measureSearchApi = useRef(useMeasureServiceApi());

  const [sharedMeasures, setSharedMeasures] = useState<SharedMeasure[]>([]);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const getSharedMeasure = useCallback(() => {
    if ((measures && measures?.length === 0) || !open) {
      return;
    }

    setSharedMeasures([]);
    setErrorMessage("");
    setLoading(true);

    const measureMap = new Map(
      measures.map((measure) => [measure.id, measure])
    );
    const measureIds = Array.from(measureMap.keys());

    measureSearchApi.current
      .getSharedWithUserIds(measureIds)
      .then((response) => {
        setSharedMeasures(
          measureIds.map((measureId) => ({
            measureId,
            measureName: measureMap.get(measureId).measureName,
            userId: "",
            dateShared: "",
            subRows: response[measureId].map((userId) => ({
              measureId,
              userId,
              dateShared: "-",
            })),
          }))
        );
      })
      .catch((error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open]);

  useEffect(() => {
    getSharedMeasure();
  }, [getSharedMeasure]);

  const columns = useMemo<ColumnDef<SharedMeasure>[]>(() => {
    let columnDefs = [];

    if (option === "Share With") {
      columnDefs.push({
        header: "Measure",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.measureName}`}
          />
        ),
        accessorKey: "measureName",
      });
    } else if (option === "Unshare") {
      columnDefs.push({
        header: "Measure",
        cell: (info) =>
          info.row.original.measureName ? (
            <TruncateText
              text={info.row.original.measureName}
              maxLength={120}
              dataTestId={`measure-name-${info.row.original.measureName}`}
            />
          ) : (
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              checked={true}
              data-testid={`unshare-checkbox-${info.row.original.measureId}-${info.row.original.userId}`}
            />
          ),
        accessorKey: "measureName",
      });
    }

    columnDefs = [
      ...columnDefs,
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
      },
      {
        cell: ({ row }) => (
          <>
            {row.getCanExpand() ? (
              <button
                data-testid={`expand-button-${row.original.measureId}`}
                onClick={row.getToggleExpandedHandler()}
                style={{ cursor: "pointer" }}
              >
                {row.getIsExpanded() ? (
                  <KeyboardArrowDownIcon sx={keyboardArrowStyles} />
                ) : (
                  <KeyboardArrowRightIcon sx={keyboardArrowStyles} />
                )}
              </button>
            ) : null}
          </>
        ),
        id: "expand-button",
      },
    ];

    return columnDefs;
  }, [measures]);

  const table = useReactTable({
    data: sharedMeasures,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
  });

  return (
    <MadieDialog
      form={false}
      title={option}
      dialogProps={{
        onClose,
        open,
        maxWidth: "lg",
        "data-testid": "share-dialog",
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
      <div id="measure-landing" data-testid="measure-landing">
        {option === "Share With" && (
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
        )}

        <div className="measure-table no-margin-top">
          <div className="table" style={{ overflow: "auto" }}>
            <table
              tw="min-w-full"
              data-testid="share-measure-tbl"
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
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
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
    </MadieDialog>
  );
};

export default ShareDialog;
