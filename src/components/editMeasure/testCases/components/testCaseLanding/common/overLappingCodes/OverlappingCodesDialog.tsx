import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  JSX,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { MadieDialog, Pagination, Toast } from "@madie/madie-design-system";
import tw from "twin.macro";
import "styled-components/macro";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { Box, Typography } from "@mui/material";
import {
  Measure,
  OverlappingCodeDto,
  OverlappingValueSetDto,
} from "@madie/madie-models";
import useExcelExportService from "../../../../api/useExcelExportService";
import getModelFamily from "../../../../util/measureModelHelpers";
import UseToast from "../../common/Hooks/UseToast";
import ExportDialog from "../../../../../../measureLanding/measureList/exportDialog/ExportDialog";

// Define the data type for rows
interface RowData {
  code: string;
  codeSystem: string;
  description: string | JSX.Element;
  version: string;
  subRows?: RowData[]; // Optional subRows for nested data
}
const TH = tw.th`p-3 text-left text-sm`;
const TD = tw.td`p-3 text-left text-sm break-keep`;

const Description = ({ valueSet }: { valueSet: OverlappingValueSetDto }) => {
  return (
    <>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight="bold">
          Value Set:
        </Typography>
        <Typography variant="body1">{valueSet.name}</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight="bold">
          {valueSet?.url ? "URL" : "OID"}:
        </Typography>
        <Typography variant="body1" tw="break-all">
          {valueSet?.url ? valueSet.url : valueSet.oid}
        </Typography>
      </Box>
    </>
  );
};
const OverlappingCodesReport = ({
  overlappingCodes,
}: {
  overlappingCodes: OverlappingCodeDto[];
}) => {
  const [visibleCodes, setVisibleCodes] = useState<OverlappingCodeDto[]>([]);
  // pagination utilities
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const managePagination = useCallback(() => {
    if (overlappingCodes.length < currentLimit) {
      setOffset(0);
      setVisibleCodes([...overlappingCodes]);
      setVisibleItems(overlappingCodes.length);
      setTotalItems(overlappingCodes.length);
      setTotalPages(1);
    } else {
      const start = (currentPage - 1) * currentLimit;
      const end = start + currentLimit;
      const newVisibleCodes = overlappingCodes.slice(start, end);
      setVisibleCodes(newVisibleCodes);
      setOffset(start);
      setVisibleItems(newVisibleCodes.length);
      setTotalItems(overlappingCodes.length);
      setTotalPages(Math.ceil(overlappingCodes.length / currentLimit));
    }
  }, [
    currentLimit,
    currentPage,
    overlappingCodes,
    setOffset,
    setVisibleCodes,
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
  }, [overlappingCodes, currentPage, currentLimit, managePagination]);

  // Table data
  const data: RowData[] = useMemo(
    () =>
      visibleCodes.map((code) => ({
        code: code.code,
        codeSystem: code.codeSystem,
        description: code.description,
        version: code.codeSystemVersion,
        subRows: code.valueSets.map((valueSet) => ({
          code: "",
          codeSystem: "",
          description: <Description valueSet={valueSet} />,
          version: "",
          subRows: null,
        })),
      })),
    [visibleCodes]
  );

  // Column definitions
  const columns: ColumnDef<RowData>[] = useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "codeSystem",
        header: "Code System",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "version",
        header: "Version",
        cell: (info) => info.getValue(),
      },
      {
        cell: ({ row }) => (
          <>
            {row.getCanExpand() ? (
              <button
                type="button"
                data-testid={`expand-button-${row.original.code}_${row.original.version}`}
                onClick={row.getToggleExpandedHandler()}
                style={{ cursor: "pointer" }}
              >
                {row.getIsExpanded() ? (
                  <KeyboardArrowDownIcon sx={{ color: "#0073C8" }} />
                ) : (
                  <KeyboardArrowRightIcon sx={{ color: "#0073C8" }} />
                )}
              </button>
            ) : null}
          </>
        ),
        id: "expandButton",
      },
    ],
    []
  );

  // Create the table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    enableRowSelection: true,
    getSubRows: (row) => row.subRows,
  });

  return (
    <>
      <table tw="min-w-full" data-testid="overlapping-codes-tbl">
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
        <tbody>
          {overlappingCodes?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={row.original.code ? "ml-tr" : "ml-tr subtr"}
                data-testid={`row-${index}`}
                style={{
                  borderTop: "solid 1px #8c8c8c",
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TD key={cell.id} data-testid={`${cell.id}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TD>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} tw="text-center p-2">
                There are no overlapping codes
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {overlappingCodes?.length > 0 && (
        <div className="pagination-container">
          <Pagination
            data-testid="overlapping-codes-pagination"
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

interface OverlappingCodesDialogProps {
  openDialog: boolean;
  setOpenDialog: (open: boolean) => void;
  handleClose: () => void;
  overlappingCodes: OverlappingCodeDto[];
  measure: Measure;
}

const OverlappingCodesDialog = ({
  openDialog,
  handleClose,
  overlappingCodes,
  measure,
  setOpenDialog,
}: OverlappingCodesDialogProps) => {
  const {
    toastOpen,
    setToastOpen,
    toastMessage,
    setToastMessage,
    toastType,
    setToastType,
    onToastClose,
  } = UseToast();
  const abortController = useRef(null);
  const excelExportService = useRef(useExcelExportService());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleContinueDialog = () => {
    setExportDialogOpen(false);
  };
  const handleCancelDialog = () => {
    abortController.current && abortController.current.abort();
    handleContinueDialog();
  };

  const exportOverlappingCodes = async () => {
    setExportDialogOpen(true);
    try {
      abortController.current = new AbortController();
      const response = await excelExportService.current.getOverlappingValueSets(
        overlappingCodes,
        abortController.current.signal
      );

      const excelData: Blob = response.data;
      var exportBlob = new Blob([excelData], {
        type: "application/vnd.ms-excel",
      });
      const url = window.URL.createObjectURL(exportBlob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${measure.ecqmTitle}-v${measure.version}-${getModelFamily(
          measure.model
        )}-OverlappingCodes.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportDialogOpen(false);
      setToastOpen(true);
      setToastType("success");
      setToastMessage("Overlapping Codes report exported successfully");
    } catch (err) {
      setExportDialogOpen(false);
      setToastOpen(true);
      setToastType("danger");
      setToastMessage(
        `Unable to export Overlapping Codes for ${measure?.measureName}. Please try again and contact the Help Desk if the problem persists.`
      );
    }
    setOpenDialog(false);
  };

  return (
    <>
      <MadieDialog
        title="Overlapping Codes"
        dialogProps={{
          onClose: handleClose,
          open: openDialog,
          maxWidth: "lg",
          fullWidth: true,
          "data-testid": "overlapping-codes-dialog",
        }}
        cancelButtonProps={{
          variant: "secondary",
          cancelText: "Close",
          "data-testid": "overlapping-codes-report-cancel-btn",
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          "data-testid": "overlapping-codes-report-export-btn",
          disabled: overlappingCodes?.length === 0 ? true : false,
          continueText: "Export",
          tooltipText: "This measure contains no overlapping codes",
          onClick: () => {
            exportOverlappingCodes();
          },
        }}
      >
        <div data-testid="overlapping-codes-report-contents">
          <OverlappingCodesReport overlappingCodes={overlappingCodes} />
        </div>
      </MadieDialog>

      <ExportDialog
        failureMessage={""}
        measureName={"Overlapping Codes"}
        open={exportDialogOpen}
        handleContinueDialog={handleContinueDialog}
        handleCancelDialog={handleCancelDialog}
      />
      <Toast
        toastKey="overlapping-codes-toast"
        aria-live="polite"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "overlapping-codes-generic-error-text"
            : "overlapping-codes-success-text"
        }
        closeButtonProps={{
          "data-testid": "close-overlapping-codes-error-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
      />
    </>
  );
};

export default OverlappingCodesDialog;
