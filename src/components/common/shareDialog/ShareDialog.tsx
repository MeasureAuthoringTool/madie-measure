import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import GlobalStyles from "../../../styles/GlobalStyles";
import { Backdrop, Checkbox, Link, Typography } from "@mui/material";
import ExportIcon from "./ExportIcon.svg";
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
import { useMeasureServiceApi, useOktaTokens } from "@madie/madie-util";
import { useFormik } from "formik";
import * as Yup from "yup";

interface ShareDialogProps {
  measures: Measure[];
  open: boolean;
  option: string;
  onClose: Function;
  onSave: Function;
  isAdmin?: boolean;
}

interface SharedMeasure {
  measureId: string;
  measureName: string;
  userId: string;
  dateShared: string;
  subRows: SharedMeasure[];
}

export interface SharedUser {
  userId: string;
  performedAt: Date;
}

const TH = tw.th`p-3 text-left text-sm font-bold capitalize`;
const icon = <CheckBoxOutlineBlankIcon fontSize="large" />;
const checkedIcon = <CheckBoxIcon fontSize="large" />;
const keyboardArrowStyles = {
  color: "#0073C8",
  width: 40,
  height: 40,
};

//Convert date string to format of mm/dd/yyyy with no leading zeroes in month
export const convertDate = (date: string) => {
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
    return -1;
  }

  return new Date(b.dateShared).getTime() - new Date(a.dateShared).getTime();
};

const getErrorMessage = (error, baseMessage: string) => {
  let toastMessage;

  if (error?.response?.data?.message) {
    toastMessage = error.response.data.message;
  } else {
    toastMessage = baseMessage;
  }

  return toastMessage;
};

const ShareDialog = ({
  measures,
  open,
  option,
  onClose,
  onSave,
  isAdmin,
}: ShareDialogProps) => {
  const { getUserName } = useOktaTokens();
  const userName = getUserName();

  const showShareDialog = option === "Share With" || option === "Unshare";

  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [loading, setLoading] = useState<boolean>(false);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [measureMap, setMeasureMap] = useState(new Map<string, Measure>());
  const [sharedMeasures, setSharedMeasures] = useState<SharedMeasure[]>([]);
  const [sharedWithAllSelectedMeasures, setSharedWithAllSelectedMeasures] =
    useState<boolean>(false);
  const [shareMeasuresRequest, setShareMeasuresRequest] = useState(
    new Map<string, string[]>()
  );
  const [unshareMeasuresRequest, setUnshareMeasuresRequest] = useState(
    new Map<string, string[]>()
  );

  const [rowSelection, setRowSelection] = useState({});
  const [initialRowIdsSelected, setInitialRowIdsSelected] = useState([]);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);

  const updateSharedMeasuresRequest = (measureId, harpId) => {
    setShareMeasuresRequest((map) => {
      const current = map.get(measureId) || [];
      current.push(harpId);

      return map.set(measureId, current);
    });
  };

  const updateUnsharedMeasuresRequest = (measureId, harpId) => {
    setUnshareMeasuresRequest((map) => {
      const current = map.get(measureId) || [];
      current.push(harpId);

      return map.set(measureId, current);
    });
  };

  const harpIdCheck = (isSharedWithAllSelectedMeasures: boolean) => {
    return {
      message: `The selected measure(s) are already shared with this user.`,
      test: () => {
        return !isSharedWithAllSelectedMeasures;
      },
    };
  };

  const handleAddUser = () => {
    // Remove all spaces from harpId
    const harpId = formik.getFieldProps("harpId").value.replace(/\s/g, "");

    // If no harpId is passed in (string with all whitespace), only clear out the harpId field
    if (!harpId) {
      formik.setFieldValue("harpId", "");
      return;
    }

    let sharedWithAllSelectedMeasures = true;

    const updateSharedMeasures = sharedMeasures.map((measure) => {
      if (
        measure.subRows.length &&
        measure.subRows.some((subRow) => subRow.userId === harpId)
      ) {
        return { ...measure };
      } else {
        sharedWithAllSelectedMeasures = false;

        updateSharedMeasuresRequest(measure.measureId, harpId);

        return {
          ...measure,
          subRows: [
            {
              measureId: measure.measureId,
              measureName: "",
              userId: harpId,
              dateShared: new Date().toLocaleString(),
              subRows: null,
            },
            ...measure.subRows,
          ],
        };
      }
    });

    setSharedMeasures(updateSharedMeasures);
    setSharedWithAllSelectedMeasures(sharedWithAllSelectedMeasures);

    if (!sharedWithAllSelectedMeasures) {
      setSaveDisabled(false);
      formik.resetForm();
    }
  };

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

      const measureMap = new Map<string, Measure>(
        responses.map((measure) => [measure.id, measure])
      );
      setMeasureMap(measureMap);

      const sharedMeasures = await measureServiceApi.getSharedMeasures(
        measureIds
      );

      setSharedMeasures(
        measureIds.map((measureId: string) => ({
          measureId,
          //@ts-ignore
          measureName: measureMap.get(measureId).measureName,
          userId: "",
          dateShared: null,
          subRows: sharedMeasures[measureId]
            .map((sharedUser: SharedUser) => ({
              measureId,
              userId: sharedUser.userId,
              dateShared: sharedUser.performedAt
                ? sharedUser.performedAt.toLocaleString()
                : "-",
            }))
            .sort(sortSharedMeasures),
        }))
      );

      table.toggleAllRowsSelected(true);
      setInitialRowIdsSelected(Object.keys(table.getState().rowSelection));
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to retrieve users that the selected measure(s) is shared with. If the error persists, please contact the help desk."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [open]);

  // Resets state and closes the Share/Unshare dialog
  const handleShareDialogClose = () => {
    setSaveDisabled(true);
    setShareMeasuresRequest(new Map<string, string[]>());
    setUnshareMeasuresRequest(new Map<string, string[]>());
    setInitialRowIdsSelected([]);
    table.resetRowSelection();
    table.resetExpanded();
    formik.resetForm();

    onClose();
  };

  // Closes the confirmation dialog
  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);

    // Also close underlying Share/Unshare dialog
    if (option === "UnshareFromMe") {
      onClose();
    }
  };

  const handleSave = async () => {
    setConfirmationDialogOpen(false);
    setExecuting(true);

    if (option === "Share With") {
      try {
        await measureServiceApi.shareMeasures(shareMeasuresRequest);

        onSave({
          toastType: "success",
          toastMessage: "The measure(s) were successfully shared.",
          toastOpen: true,
        });
      } catch (error) {
        onSave({
          toastType: "danger",
          toastMessage: getErrorMessage(
            error,
            "Unable to share the selected measure(s) with the added users. If the error persists, please contact the help desk."
          ),
          toastOpen: true,
        });
      } finally {
        setExecuting(false);
      }
    } else if (option === "Unshare" || option === "UnshareFromMe") {
      try {
        await measureServiceApi.unshareMeasures(unshareMeasuresRequest);

        onSave({
          toastType: "success",
          toastMessage: "The measure(s) were successfully unshared.",
          toastOpen: true,
        });
      } catch (error) {
        onSave({
          toastType: "danger",
          toastMessage: getErrorMessage(
            error,
            "Unable to unshare the selected measure(s) with the users who were unchecked. If the error persists, please contact the help desk."
          ),
          toastOpen: true,
        });
      } finally {
        setExecuting(false);
      }
    }
  };

  const onRowSelectionChange = useCallback(async () => {
    if (option !== "Unshare") return;

    if (initialRowIdsSelected.length) {
      const rowIdsSelected = Object.keys(rowSelection);

      const rowIdsUnselected: string[] = initialRowIdsSelected.filter(
        (element) => !rowIdsSelected.includes(element)
      );

      setUnshareMeasuresRequest(new Map<string, string[]>());

      rowIdsUnselected.map((rowId) => {
        const [measureId, userId] = rowId.split(" ");
        updateUnsharedMeasuresRequest(measureId, userId);
      });
    }
  }, [
    option,
    initialRowIdsSelected,
    rowSelection,
    updateUnsharedMeasuresRequest,
  ]);

  const confirmationDialogWarningContent = () => {
    return (
      <div>
        <div className="confirmation-dialog-content">
          You are about to unshare
        </div>
        {Array.from(unshareMeasuresRequest).map(([measureId, userIds]) => (
          <>
            <div className="confirmation-dialog-content">
              <div className="measure-name">
                {measureMap.get(measureId)
                  ? measureMap.get(measureId).measureName
                  : measureId}
              </div>
              <div> with the following users:</div>
              <ul>
                {userIds.map((userId) => (
                  <li>{userId}</li>
                ))}
              </ul>
            </div>
          </>
        ))}
      </div>
    );
  };

  const formik = useFormik({
    initialValues: {
      harpId: "",
    },
    validationSchema: Yup.object().shape({
      harpId: Yup.string().test(harpIdCheck(sharedWithAllSelectedMeasures)),
    }),
    onSubmit: handleSave,
  });

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
              checked={info.row.getIsSelected()}
              onChange={info.row.getToggleSelectedHandler()}
              data-testid={`unshare-checkbox-${info.row.original.userId}_${info.row.original.measureId}`}
            />
          ),
        accessorKey: "measureName",
      });
    }

    const formattedDateShared = (info) => {
      const result =
        info.row.original.dateShared === "-"
          ? "-"
          : info.row.original.dateShared
          ? convertDate(info.row.original.dateShared)
          : "";
      return result;
    };
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
            text={formattedDateShared(info)}
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
                type="button"
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
        id: "expandButton",
      },
    ];

    return columnDefs;
  }, [measures]);

  const table = useReactTable({
    data: sharedMeasures,
    getRowId: (row) => `${row.measureId}${row.userId ? ` ${row.userId}` : ""}`,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.subRows,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  useEffect(() => {
    getSharedMeasure();
  }, [getSharedMeasure]);

  useEffect(() => {
    formik.validateForm();
  }, [sharedWithAllSelectedMeasures]);

  useEffect(() => {
    onRowSelectionChange();
  }, [rowSelection]);

  useEffect(() => {
    // Only trigger when dialog is open and the option is UnshareFromMe
    if (option === "UnshareFromMe" && open) {
      // Prepare the unshare request
      const directUnshareRequest = new Map<string, string[]>();
      measures.forEach((measure) => {
        directUnshareRequest.set(measure.id, [userName]);
      });
      setUnshareMeasuresRequest(directUnshareRequest);

      // Open the confirmation dialog
      setConfirmationDialogOpen(true);
    }
  }, [option, open, measures, userName]);

  const handleExportUserList = (e) => {
    e.preventDefault();
  };

  const renderExportLink = () => (
    <Link
      component="button"
      onClick={handleExportUserList}
      className="export-user-list-btn"
      underline="none"
    >
      <img src={ExportIcon} alt="ExportIcon" />
      Export User List(.CSV)
    </Link>
  );

  return (
    <>
      <GlobalStyles />
      <MadieDialog
        form
        title={option}
        dialogProps={{
          onClose: handleShareDialogClose,
          open: showShareDialog && open,
          onSubmit: () => {
            option === "Share With"
              ? formik.handleSubmit()
              : setConfirmationDialogOpen(true);
          },
          maxWidth: "lg",
          "data-testid": "share-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          "data-testid": "share-cancel-button",
          disabled: executing,
        }}
        continueButtonProps={{
          variant: "cyan",
          type: "submit",
          continueText: "Save",
          "data-testid": "share-save-button",
          disabled:
            option === "Share With"
              ? saveDisabled || !formik.isValid || executing
              : table.getIsAllRowsSelected() || executing,
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
                  disabled={
                    !formik.getFieldProps("harpId").value || !formik.isValid
                  }
                  onClick={handleAddUser}
                >
                  Add User
                </Button>
              </div>
            </div>
          )}
          <div className="share-unshare-dialog-info-text">
            <div>
              When sharing a measure, all versions and drafts are shared, so
              only the most recent measure name appears here.
              {isAdmin && option !== "Unshare" && renderExportLink()}
            </div>
            {option === "Unshare" && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "380px" }}
              >
                Deselect the users with whom you want to unshare the measure(s).
                {isAdmin && renderExportLink()}
              </div>
            )}
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
                        return (
                          <TH
                            key={header.id}
                            scope="col"
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
                          <td key={cell.id} data-testid={`${cell.id}`}>
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
          open={loading || executing}
        >
          <MadieSpinner style={{ height: 50, width: 50 }} />
          {loading && (
            <Typography color="inherit">Loading shared measures...</Typography>
          )}
          {executing && <Typography color="inherit">Saving...</Typography>}
        </Backdrop>
      </MadieDialog>

      <MadieDialog
        title="Are you sure?"
        dialogProps={{
          open: confirmationDialogOpen,
          onClose: handleConfirmationDialogClose,
          "data-testid": "share-confirmation-dialog",
        }}
        cancelButtonProps={{
          onClick: handleConfirmationDialogClose,
          cancelText: "Cancel",
          "data-testid": "share-confirmation-dialog-cancel-button",
        }}
        continueButtonProps={{
          type: "submit",
          continueText: "Accept",
          onClick: formik.handleSubmit,
          "data-testid": "share-confirmation-dialog-accept-button",
        }}
      >
        <div id="discard-changes-dialog-body">
          <section className="dialog-warning-body">
            {confirmationDialogWarningContent()}
          </section>
        </div>
      </MadieDialog>
    </>
  );
};

export default ShareDialog;
