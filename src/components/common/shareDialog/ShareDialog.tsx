import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import GlobalStyles from "../../../styles/GlobalStyles";
import { Backdrop, Checkbox, Link, Typography } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import ExportIcon from "./ExportIcon.svg";
import {
  TextField,
  MadieDialog,
  Button,
  TruncateText,
  MadieSpinner,
  Toast,
} from "@madie/madie-design-system/dist/react";
import "./ShareDialog.scss";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Measure, UserDetails, UserStatus } from "@madie/madie-models";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import "../../measureLanding/MeasureLanding.scss";
import tw from "twin.macro";
import "styled-components/macro";
import {
  useMeasureServiceApi,
  useOktaTokens,
  useUserServiceApi,
} from "@madie/madie-util";
import { useFormik } from "formik";
import * as Yup from "yup";
import FileSaver from "file-saver";
import { generateTimestampedFileName } from "../../../utils/exportUtil";
import MultiChipInput from "./MultiInputTextField";

export const MEASURE_SHARING_EXPORT_SUCCESS =
  "Measure Sharing Report exported successfully.";
export const MEASURE_SHARING_EXPORT_ERROR =
  "Unable to export the user list. Please try again. If the issue persists, please contact the help desk.";
export const INVALID_HARP_ID_MESSAGE =
  "The provided HARP ID is not associated with an active MADiE user.";
export const HARP_ID_VALIDATION_FAILURE =
  "Unable to validate the provided HARP ID. If the error persists, please contact the help desk.";

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
  const userServiceApi = useRef(useUserServiceApi()).current;

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
  const [harpIds, setHarpIds] = useState<string[]>([]);
  const [harpInputValue, setHarpInputValue] = useState<string>("");

  // Toast state
  const [toast, setToast] = useState({
    open: false,
    type: "danger",
    message: "",
  });

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
      message: `The selected measure(s) are already shared with the entered user(s).`,
      test: () => {
        return !isSharedWithAllSelectedMeasures;
      },
    };
  };

  const handleHarpInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (val.includes(",")) {
        const parts = val.split(",");
        const newChips = parts
          .slice(0, -1)
          .map((p) => p.replace(/\s/g, ""))
          .filter(Boolean);
        if (newChips.length > 0) {
          setHarpIds((prev) => {
            const toAdd = newChips.filter((chip) => !prev.includes(chip));
            return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
          });
        }
        setHarpInputValue(parts[parts.length - 1]);
      } else {
        setHarpInputValue(val);
      }
    },
    []
  );

  const handleHarpInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !harpInputValue && harpIds.length > 0) {
      setHarpIds((prev) => prev.slice(0, -1));
    }
  };

  const handleDeleteChip = (chipToDelete: string) => {
    setHarpIds((prev) => prev.filter((id) => id !== chipToDelete));
  };

  const handleAddUser = async () => {
    const allIds = [...harpIds];
    const remaining = harpInputValue.replace(/\s/g, "");
    if (remaining) {
      allIds.push(remaining);
    }
    const uniqueIds = [...new Set(allIds)];

    if (uniqueIds.length === 0) {
      setHarpInputValue("");
      return;
    }

    const existingUserIds = new Set(
      sharedMeasures.flatMap((measure) =>
        measure.subRows.map((subRow) => subRow.userId)
      )
    );

    const newIds = uniqueIds.filter((id) => !existingUserIds.has(id));
    if (newIds.length === 0) {
      formik.setFieldError(
        "harpId",
        `The selected measure(s) are already shared with the entered user(s).`
      );
      return;
    }

    try {
      const userDetails = await userServiceApi.getBulkUserDetails(newIds);

      const validUsers: string[] = [];
      const invalidUsers: string[] = [];

      Object.entries(userDetails).forEach(
        ([harpId, details]: [string, any]) => {
          if (details.userStatus && String(details.userStatus) === "ACTIVE") {
            validUsers.push(harpId);
          } else {
            invalidUsers.push(harpId);
          }
        }
      );

      if (invalidUsers.length > 0) {
        if (invalidUsers.length === 1) {
          formik.setFieldError(
            "harpId",
            `The provided HARP ID ${invalidUsers[0]} is not associated with an active MADiE user.`
          );
        } else {
          formik.setFieldError(
            "harpId",
            `The provided HARPIDs (${invalidUsers.join(
              ", "
            )}) are not associated with an active MADiE user.`
          );
        }
      }

      if (validUsers.length === 0) {
        return;
      }

      let updatedMeasures = [...sharedMeasures];
      validUsers.forEach((harpId) => {
        updatedMeasures = updatedMeasures.map((measure) => {
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
        });
      });

      setSharedMeasures(updatedMeasures);
      setSaveDisabled(false);
      setHarpIds([]);
      setHarpInputValue("");

      if (invalidUsers.length === 0) {
        formik.resetForm();
      }
    } catch (error) {
      if (error?.response?.status === 400) {
        formik.setFieldError("harpId", INVALID_HARP_ID_MESSAGE);
      } else {
        setToast({
          open: true,
          type: "danger",
          message: HARP_ID_VALIDATION_FAILURE,
        });
      }
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
    setHarpIds([]);
    setHarpInputValue("");
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
    enableReinitialize: true,
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
          ) : null,
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
        id: "userId",
        header: ({ table: t }) =>
          option === "Unshare" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                checked={t.getIsAllRowsSelected()}
                indeterminate={
                  t.getIsSomeRowsSelected() && !t.getIsAllRowsSelected()
                }
                onChange={t.getToggleAllRowsSelectedHandler()}
                data-testid="unshare-select-all-checkbox"
              />
              Shared With
            </div>
          ) : (
            "Shared With"
          ),
        cell: (info) =>
          option === "Unshare" && !info.row.original.measureName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                checked={info.row.getIsSelected()}
                onChange={info.row.getToggleSelectedHandler()}
                data-testid={`unshare-checkbox-${info.row.original.userId}_${info.row.original.measureId}`}
              />
              <TruncateText
                text={info.row.original.userId}
                maxLength={120}
                dataTestId={`user-${info.row.original.userId}_${info.row.original.measureId}`}
              />
            </div>
          ) : (
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
    ];

    return columnDefs;
  }, [measures, option]);

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
    initialState: {
      expanded: true,
    },
    enableRowSelection: (row) => !row.original.measureName,
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

  // export user list in Excel format for admin users
  const handleExportUserList = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ids = sharedMeasures.map((m) => m.measureId);
      const blob = await measureServiceApi.getSharedAccessReportForMeasures(
        ids
      );
      const fileName = generateTimestampedFileName(
        "MeasureSharingExport",
        "xlsx"
      );
      FileSaver.saveAs(blob, fileName);
      setToast({
        open: true,
        type: "success",
        message: MEASURE_SHARING_EXPORT_SUCCESS,
      });
    } catch (error) {
      console.error(error);
      setToast({
        open: true,
        type: "danger",
        message: MEASURE_SHARING_EXPORT_ERROR,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlobalStyles />
      <MadieDialog
        form
        title={
          option === "Share With"
            ? "Share With..."
            : option === "Unshare"
            ? "Unshare From..."
            : option
        }
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
              ? saveDisabled || executing
              : table.getIsAllRowsSelected() || executing,
        }}
      >
        <div id="measure-landing" data-testid="measure-landing">
          {option === "Share With" && (
            <div id="add-user-id-search">
              <div className="harp-id-input-row">
                <div className="harp-id-text-field">
                  <MultiChipInput
                    id="harp-id-input"
                    label="HARP ID"
                    value={harpIds}
                    onChipsChange={setHarpIds}
                    inputValue={harpInputValue}
                    onInputValueChange={setHarpInputValue}
                    error={Boolean(formik.errors.harpId)}
                    helperText={formik.errors.harpId as string}
                    onFocus={() => setSharedWithAllSelectedMeasures(false)}
                    onBlur={formik.handleBlur("harpId")}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: "#666", mt: 0.5, display: "block" }}
                    data-testid="harp-id-helper-text"
                  >
                    Hit comma (,) to add multiple
                  </Typography>
                </div>
                <Button
                  id="add-user-btn"
                  data-testid="add-user-btn"
                  variant="outline"
                  disabled={
                    (harpIds.length === 0 && !harpInputValue.trim()) ||
                    !formik.isValid
                  }
                  onClick={handleAddUser}
                >
                  Add User(s)
                </Button>
              </div>
            </div>
          )}
          <div className="share-unshare-dialog-info-text">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <span>
                  <strong>Please note: </strong>
                </span>
                When sharing a measure, all versions and drafts are shared, but
                only the most recent measure name appears below.
              </div>
              {option === "Unshare" && (
                <div style={{ marginTop: "10px" }}>
                  To unshare this measure,{" "}
                  <span>
                    <strong>
                      deselect the usernames with whom you want to unshare the
                      measure(s) with,{" "}
                    </strong>
                  </span>
                  then click the 'Unshare' button.
                </div>
              )}
            </div>
            {isAdmin && (
              <div style={{ marginLeft: "auto", flexShrink: 0 }}>
                <Link
                  component="button"
                  onClick={handleExportUserList}
                  className="export-user-list-btn"
                  underline="none"
                >
                  <img src={ExportIcon} alt="ExportIcon" />
                  Export User List
                </Link>
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
      <Toast
        toastKey="export-user-list-toast"
        testId="export-user-list-toast"
        toastType={toast.type}
        open={toast.open}
        message={toast.message}
        onClose={() =>
          setToast({
            open: false,
            type: "danger",
            message: "",
          })
        }
        autoHideDuration={8000}
      />
    </>
  );
};

export default ShareDialog;
