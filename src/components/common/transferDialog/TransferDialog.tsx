import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  MadieDialog,
  Pagination,
  TruncateText,
  TextField,
  ReadOnlyTextField,
  FormControlLabel,
} from "@madie/madie-design-system/dist/react";
import tw from "twin.macro";
import "styled-components/macro";
import { Measure } from "@madie/madie-models";
import { useFormik } from "formik";
import * as _ from "lodash";
import { Checkbox, Divider } from "@mui/material";
import "./TransferDialog.scss";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import * as Yup from "yup";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";

export const TRANSFER_MEASURE_SUCCESS =
  "The measure(s) were successfully transferred. If you chose to retain share access, you will still be able to edit the measures.";
export const TRANSFER_MEASURE_FAILURE =
  "Unable to transfer the selected measure(s) to the harpId. If the error persists, please contact the help desk.";

// Define the data type for rows
interface RowData {
  measureName: string;
  model: string;
  cmsId: number;
}
const TH = tw.th`p-3 text-left text-sm`;
const TD = tw.td`p-3 text-left text-sm break-keep`;

const TransferredMeasures = ({ measures }: { measures: Measure[] }) => {
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
      })),
    [visibleMeasures]
  );

  // Column definitions
  const columns: ColumnDef<RowData>[] = useMemo(
    () => [
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
    ],
    []
  );

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
        <tbody data-testId="transfer-measure-tbl-body">
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
        <div className="pagination-container">
          <Pagination
            data-testid="trasfer-measure-pagination"
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

interface TransferDialogProps {
  measures: Measure[];
  open: boolean;
  onClose: Function;
}

const TransferDialog = ({ measures, open, onClose }: TransferDialogProps) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const handleSave = async () => {
    const measureIds = measures.map((m) => m.id);
    try {
      await measureServiceApi.transferMeasures(
        measureIds,
        formik.values.harpId,
        formik.values.retainShareAccess
      );
      onClose({
        toastType: "success",
        toastMessage: TRANSFER_MEASURE_SUCCESS,
        toastOpen: true,
      });
    } catch (error) {
      console.error("TransferDialog: handleSave: error = ", error);
      onClose({
        toastType: "danger",
        toastMessage: TRANSFER_MEASURE_FAILURE,
        toastOpen: true,
      });
    }
  };

  const formik = useFormik({
    initialValues: {
      currentUser: measures?.[0]?.measureSet?.owner,
      harpId: "",
      retainShareAccess: false,
    },
    enableReinitialize: true,
    validationSchema: Yup.object().shape({
      harpId: Yup.string().required("New Measure Owner is required."),
    }),
    onSubmit: handleSave,
  });

  return (
    <>
      <MadieDialog
        form
        title="Transfer Measure(s)"
        dialogProps={{
          onClose,
          open,
          onSubmit: formik.handleSubmit,
          maxWidth: "lg",
          "data-testid": "transfer-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "transfer-cancel-button",
        }}
        continueButtonProps={{
          variant: "danger-primary",
          type: "submit",
          continueText: "Transfer",
          "data-testid": "transfer-save-button",
          disabled: !formik.dirty,
        }}
      >
        <div className="transfer-dialog-info-text">
          <div>
            You are about to Transfer the following measure(s). All versions and
            drafts will be transferred, so only the most recent measure name
            appears here.
          </div>
          <div className="warning-message">
            <ErrorOutlineIcon color="error" fontSize="small" />
            This action cannot be undone.
          </div>
        </div>
        <div data-testid="transferred-measures-list">
          <TransferredMeasures measures={measures} />
        </div>
        <div className="owner">Owner</div>
        <Divider sx={{ borderColor: "#8c8c8c", paddingBottom: "16px" }} />

        <div id="transfer-measure">
          <div className="current-owner">
            <ReadOnlyTextField
              label="Current Measure Owner"
              inputProps={{
                "data-testid": "current-owner",
              }}
              size="large"
              {...formik.getFieldProps("currentUser")}
            />
          </div>
          <div>
            <TextField
              label="New Measure Owner"
              id="harp-id-input"
              required={true}
              inputProps={{
                "data-testid": "harp-id-input",
              }}
              error={formik.touched.harpId && Boolean(formik.errors.harpId)}
              helperText={formik.touched.harpId && formik.errors.harpId}
              {...formik.getFieldProps("harpId")}
            />
          </div>
          <div className="retainShareAccess">
            <FormControlLabel
              control={
                <Checkbox
                  {...formik.getFieldProps("retainShareAccess")}
                  checked={formik.values.retainShareAccess}
                  name="retainShareAccess"
                  id="retainShareAccess"
                  data-testid="retainShareAccess"
                />
              }
              label="Retain Share Access after Transfer"
            />
          </div>
        </div>
      </MadieDialog>
    </>
  );
};

export default TransferDialog;
