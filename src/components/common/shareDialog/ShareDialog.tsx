import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import GlobalStyles from "../../../styles/GlobalStyles";
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
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import "../../measureLanding/MeasureLanding.scss";
import tw from "twin.macro";
import "styled-components/macro";
import useMeasureServiceApi from "../../../api/useMeasureServiceApi";
import { useFormik } from "formik";
import * as Yup from "yup";

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;
const icon = <CheckBoxOutlineBlankIcon fontSize="large" />;
const checkedIcon = <CheckBoxIcon fontSize="large" />;
const keyboardArrowStyles = {
  color: "#0073C8",
  width: 40,
  height: 40,
};

//Convert date string to format of mm/dd/yyyy with no leading zeroes in month
const convertDate = (date: string) => {
  if (!date) {
    return "";
  }
  const dateObj = new Date(date);
  const year = dateObj.getUTCFullYear().toString();
  const month = String(dateObj.getUTCMonth() + 1);
  const day = String(dateObj.getUTCDate()).padStart(2, "0");
  return `${month}/${day}/${year}`;
};

const sortSharedMeasures = (a: SharedMeasure, b: SharedMeasure) => {
  //Move SharedMeasure(s) with dateShared of "-" to end of list
  if (a.dateShared === "-" || b.dateShared === "-") {
    return 1;
  }

  return new Date(b.dateShared).getTime() - new Date(a.dateShared).getTime();
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
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [sharedMeasures, setSharedMeasures] = useState<SharedMeasure[]>([]);
  const [hoveredHeader, setHoveredHeader] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sharedWithAllSelectedMeasures, setSharedWithAllSelectedMeasures] =
    useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);

  const harpIdCheck = (isSharedWithAllSelectedMeasures: boolean) => {
    return {
      message: `The selected measure(s) are already shared with this user.`,
      test: () => {
        return !isSharedWithAllSelectedMeasures;
      },
    };
  };

  const handleAdd = () => {
    // Remove all spaces from harpId
    const harpId = formik.getFieldProps("harpId").value.replace(/\s/g, "");

    // If no harpId is passed in (string with all whitespace), only clear out the harpId field
    if (!harpId) {
      formik.setFieldValue("harpId", "");
      return;
    }

    let sharedWithAllSelectedMeasures = true;

    let updatedSharedMeasures = sharedMeasures.map((measure) => {
      if (
        measure.subRows.length &&
        measure.subRows.some((subRow) => subRow.userId === harpId)
      ) {
        return { ...measure };
      } else {
        sharedWithAllSelectedMeasures = false;

        return {
          ...measure,
          subRows: [
            {
              measureId: measure.measureId,
              measureName: "",
              userId: harpId,
              dateShared: new Date().toLocaleDateString(),
              subRows: null,
            },
            ...measure.subRows,
          ],
        };
      }
    });

    setSharedMeasures(updatedSharedMeasures);

    if (!sharedWithAllSelectedMeasures) {
      setSaveDisabled(false);
      formik.resetForm();
    }

    setSharedWithAllSelectedMeasures(sharedWithAllSelectedMeasures);
    formik.validateForm();
  };

  const formik = useFormik({
    initialValues: {
      harpId: "",
    },
    validationSchema: Yup.object().shape({
      harpId: Yup.string().test(harpIdCheck(sharedWithAllSelectedMeasures)),
    }),
    onSubmit: handleAdd,
  });

  const getSharedMeasure = useCallback(async () => {
    if ((measures && measures?.length === 0) || !open) {
      return;
    }

    setSharedMeasures([]);
    setErrorMessage("");
    setLoading(true);

    const uniqueMeasureSets = [
      ...new Map(measures.map((item) => [item.measureSetId, item])).values(),
    ];

    try {
      const responses = await measureServiceApi.getRecentMeasuresByMeasureSetId(
        uniqueMeasureSets.map((measureSet) => measureSet.measureSetId)
      );
      const measureIds = responses.map((measure) => measure.id);
      const measureMap = new Map(
        responses.map((measure) => [measure.id, measure])
      );

      const sharedWithUserIds = await measureServiceApi.getSharedWithUserIds(
        measureIds
      );
      setSharedMeasures(
        measureIds
          .map((measureId) => ({
            measureId,
            //@ts-ignore
            measureName: measureMap.get(measureId).measureName,
            userId: "",
            dateShared: "",
            subRows: sharedWithUserIds[measureId].map((userId) => ({
              measureId,
              userId,
              dateShared: "-",
            }))
            .sort(sortSharedMeasures),
        }))
      );
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    getSharedMeasure();
  }, [getSharedMeasure]);

  useEffect(() => {
    setSaveDisabled(true);
    table.resetExpanded();
    formik.resetForm();
  }, [onClose]);

  const columns = useMemo<ColumnDef<SharedMeasure>[]>(() => {
    let columnDefs = [];

    if (option === "Share With") {
      columnDefs.push({
        header: "Measure",
        cell: (info) => (
          <TruncateText
            text={info.row.original.measureName}
            maxLength={120}
            dataTestId={`measure-name-${info.row.original.measureName}_${info.row.original.measureId}`}
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
              dataTestId={`measure-name-${info.row.original.measureName}_${info.row.original.measureId}`}
            />
          ) : (
            <Checkbox
              icon={icon}
              checkedIcon={checkedIcon}
              checked={true}
              data-testid={`unshare-checkbox-${info.row.original.userId}_${info.row.original.measureId}`}
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
            dataTestId={`user-${info.row.original.userId}_${info.row.original.measureId}`}
          />
        ),
        accessorKey: "userId",
      },
      {
        header: "Date Shared",
        cell: (info) => (
          <TruncateText
            text={
              info.row.original.dateShared === "-"
                ? "-"
                : info.row.original.dateShared
                ? convertDate(info.row.original.dateShared)
                : ""
            }
            maxLength={120}
            dataTestId={`date-shared-${info.row.original.dateShared}_${info.row.original.measureId}`}
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
    <>
      <GlobalStyles />
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
          disabled: saveDisabled,
        }}
      >
        <div id="measure-landing" data-testid="measure-landing">
          {option === "Share With" && (
            <div id="add-user-id-search">
              <div>
                <TextField
                  label="HARP ID"
                  id="harp-id-input"
                  inputProps={{
                    "data-testid": "harp-id-input",
                  }}
                  error={Boolean(formik.errors.harpId)}
                  helperText={formik.errors.harpId}
                  onFocus={() => setSharedWithAllSelectedMeasures(false)}
                  {...formik.getFieldProps("harpId")}
                />
              </div>
              <div>
                <Button
                  id="add-user-btn"
                  data-testid="add-user-btn"
                  variant="outline"
                  disabled={!formik.getFieldProps("harpId").value}
                  onClick={formik.handleSubmit}
                >
                  Add User
                </Button>
              </div>
            </div>
          )}
          <div style={{ marginLeft: 32, marginRight: 32 }}>
            When sharing a measure, all versions and drafts are shared, so only
            the most recent measure name appears here.
          </div>
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
                        className={
                          row.original.measureName
                            ? String.raw`ml-tr`
                            : String.raw`ml-tr subtr`
                        }
                        data-testid={`row-item`}
                        style={{
                          borderTop: "solid 1px #8c8c8c",
                          borderSpacing: "0 2em !important",
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            data-testid={`${cell.id}_${cell.row.original.measureId}`}
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
    </>
  );
};

export default ShareDialog;
