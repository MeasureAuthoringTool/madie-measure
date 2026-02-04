import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";
import {
  Button,
  MadieDialog,
  Pagination,
  Select,
  Toast,
  MadieDeleteDialog,
  TextField,
} from "@madie/madie-design-system/dist/react";
import {
  Typography,
  MenuItem,
  IconButton,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { measureStore, useMeasureServiceApi } from "@madie/madie-util";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import MeasureMetaDataRow from "../MeasureMetaDataRow";
import { MeasureReferencesValidator } from "./MeasureReferencesValidator";
import { Measure, Model, Reference, MeasureLock } from "@madie/madie-models";
import SearchIcon from "@mui/icons-material/Search";

import ClearIcon from "@mui/icons-material/Clear";
import _ from "lodash";

import "../MeasureMetaDataTable.scss";
import TextEditor from "../../populationCriteria/groups/TextEditor";

interface MeasureReferencesProps {
  setErrorMessage: Function;
  measureCanEdit: boolean;
  lockingFeatureEnabled?: boolean;
}

const MeasureReferences = (props: MeasureReferencesProps) => {
  const { setErrorMessage, measureCanEdit, lockingFeatureEnabled } = props;
  const { search } = useLocation();
  let navigate = useNavigate();
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<Measure>(measureStore.state);

  const REFERENCE_TYPES = useMemo(
    () => [
      "Citation",
      "Justification",
      ...(measure?.model === Model.QDM_5_6 ? ["Unknown"] : []),
    ],
    [measure?.model]
  );

  const REFERENCE_OPTIONS = useMemo(
    () =>
      REFERENCE_TYPES.map((ref) => (
        <MenuItem key={ref} data-testid={`${ref}-option`} value={ref}>
          {ref}
        </MenuItem>
      )),
    [REFERENCE_TYPES]
  );

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  const [selectedReference, setSelectedReference] = useState<Reference>(null);
  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("danger");
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };
  // Form utilities
  const INITIAL_VALUES = {
    id: selectedReference?.id,
    referenceType:
      selectedReference?.referenceType !== "Documentation"
        ? selectedReference?.referenceType
        : "",
    referenceText: selectedReference?.referenceText,
  } as Reference;
  const [measureReferences, setMeasureReferences] = useState<Reference[]>(
    measure?.measureMetaData?.references || []
  );
  // we ideally will always make a new copy of the measure. Lets just listen for that update and then write our definitions to local state.
  useEffect(() => {
    if (measure?.measureMetaData?.references) {
      const copiedReferences = [...measure?.measureMetaData?.references];
      setMeasureReferences(copiedReferences);
    }
  }, [setMeasureReferences, measure]);

  const handleSubmit = (values: Reference) => {
    const originalMeasure = _.cloneDeep(measure);
    //  we want to first sort by referenceType then by referenceText
    const sortByTypeThenReferences = (references: Reference[]): Reference[] => {
      const sorterFunction = (a: Reference, b: Reference) => {
        const type1 = a.referenceType ? a.referenceType.toLowerCase() : "";
        const type2 = b.referenceType ? b.referenceType.toLowerCase() : "";
        const reference1 = a.referenceText.toLowerCase();
        const reference2 = b.referenceText.toLowerCase();
        if (type1 < type2) {
          return -1;
        }
        if (type2 > type1) {
          return 1;
        }
        if (type1 === type2) {
          if (reference1 < reference2) {
            return -1;
          }
          if (reference2 > reference1) {
            return 1;
          }
        }
        return 0;
      };
      return references.sort(sorterFunction);
    };

    const currentReferences = measure?.measureMetaData?.references || [];
    let newReferences: Reference[];

    if (!selectedReference) {
      newReferences = [...currentReferences, values];
    } else {
      newReferences = currentReferences
        .filter((reference) => reference.id !== selectedReference.id)
        .concat(values);
    }
    newReferences = sortByTypeThenReferences(newReferences);

    const modifiedMeasure: Measure = {
      ...measure,
      measureMetaData: {
        ...measure.measureMetaData,
        references: newReferences,
      },
    };

    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((res) => {
        //@ts-ignore
        const { status, data } = res;
        if (status === 200) {
          setErrorMessage("");
          handleToast("success", `Measure Reference Saved Successfully`, true);
          updateMeasure(data);
          toggleOpen();
          formik.resetForm();
        }
      })
      .catch((reason) => {
        let message = `Error updating measure "${measure.measureName}"`;
        if (lockingFeatureEnabled && reason?.status === 423) {
          message = reason?.response?.data?.message;
          updateMeasure({
            ...originalMeasure,
            measureLock: {
              lockedBy: reason?.response?.data?.message?.replace(
                "Unable to update measure. Measure is locked by ",
                ""
              ),
            } as unknown as MeasureLock,
          });
        }

        const validationErrors = reason?.response?.data?.validationErrors || {};
        const referenceErrorKeys = Object.keys(validationErrors).filter((key) =>
          key.startsWith("measureMetaData.references")
        );

        if (referenceErrorKeys.length > 0) {
          message += ": All References must have a valid type and text.";
        }

        handleToast("danger", message, true);
        setErrorMessage(message);

        setOpen(false);
        formik.resetForm();
      });
  };

  // To do: hook up a key handler to allow for escape selecting the sidenav as previously mentioned by 508 tester..
  // const goBackToNav = (e) => {
  //   if (e.shiftKey && e.keyCode == 9) {
  //     e.preventDefault();
  //     // document.getElementById("sideNavMeasure" + measureMetadataId).focus();
  //   }
  // };

  const formik = useFormik({
    initialValues: { ...INITIAL_VALUES, searchValue: "" },
    enableReinitialize: true,
    validationSchema: MeasureReferencesValidator,
    onSubmit: async (values: any) => await handleSubmit(values),
  });
  useFormikResetOnEvent(formik);

  function formikErrorHandler(name: string) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }
  const [open, setOpen] = useState<boolean>(false);
  const [deleteDialogModalOpen, setDeleteDialogModalOpen] =
    useState<boolean>(false);
  const toggleOpen = () => {
    setOpen(!open);
    setSelectedReference(null);
  };

  // Pagination controls: Hook queries into the UI so hyper links work
  const values = queryString.parse(search);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(
    (values.limit && Number(values.limit)) || 10
  );
  const [currentPage, setCurrentPage] = useState<number>(
    (values.page && Number(values.page)) || 1
  );
  const [visibleReferences, setVisibleReferences] = useState<Reference[]>([]);

  const managePagination = useCallback(() => {
    if (measureReferences) {
      if (measureReferences.length < currentLimit) {
        setOffset(0);
        setVisibleReferences([...measureReferences]);
        setVisibleItems(measureReferences.length);
        setTotalItems(measureReferences.length);
        setTotalPages(1);
      } else {
        const start = (currentPage - 1) * currentLimit;
        const end = start + currentLimit;
        const newVisibleReferences = [...measureReferences].slice(start, end);
        setOffset(start);
        setVisibleReferences(newVisibleReferences);
        setVisibleItems(newVisibleReferences.length);
        setTotalItems(measureReferences.length);
        setTotalPages(Math.ceil(measureReferences.length / currentLimit));
      }
    }
  }, [
    currentLimit,
    currentPage,
    measureReferences,
    setOffset,
    setVisibleReferences,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
  ]);

  useEffect(() => {
    managePagination();
  }, [measureReferences, currentPage, currentLimit]);

  const canGoNext = (() => {
    return currentPage < totalPages;
  })();
  const canGoPrev = Number(values?.page) > 1;
  const handlePageChange = (e, v) => {
    setCurrentPage(v);
    navigate(`?page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    setCurrentPage(1);
    navigate(`?page=${1}&limit=${e.target.value}`);
  };

  const handleClick = (id, operation) => {
    if (operation === "delete") {
      setDeleteDialogModalOpen(true);
    } else {
      setOpen(true);
    }
    setSelectedReference(
      measure?.measureMetaData?.references.find((reference) => {
        return id === reference.id;
      })
    );
  };

  const handleSearch = () => {
    const filtered = measure?.measureMetaData?.references?.filter(
      (ref) =>
        ref.referenceType
          .toLowerCase()
          .includes(formik.values.searchValue.toLowerCase()) ||
        ref.referenceText
          .toLowerCase()
          .includes(formik.values.searchValue.toLowerCase())
    );
    setMeasureReferences(filtered);
  };
  const handleClearSearch = () => {
    if (formik.values.searchValue) {
      formik.resetForm();
      setCurrentPage(1);
      setMeasureReferences(measure?.measureMetaData?.references);
    }
  };

  const deleteMeasureReference = (id) => {
    const modifiedMetaData = measure?.measureMetaData?.references?.filter(
      (reference) => reference?.id !== id
    );
    const modifiedMeasure: Measure = {
      ...measure,
      measureMetaData: {
        ...measure.measureMetaData,
        references: modifiedMetaData,
      },
    };

    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((res) => {
        //@ts-ignore
        const { status, data } = res;
        if (status === 200) {
          handleToast(
            "success",
            `Measure reference deleted successfully`,
            true
          );
          updateMeasure(data);
          setDeleteDialogModalOpen(false);
          formik.resetForm();
        }
      })
      .catch((reason) => {
        let message = `Error updating measure "${measure.measureName}"`;
        if (reason?.status === 423) {
          message = reason?.response?.data?.message;
          updateMeasure({
            ...measure,
            measureLock: {
              lockedBy: reason?.response?.data?.message?.replace(
                "Unable to update measure. Measure is locked by ",
                ""
              ),
            } as unknown as MeasureLock,
          });
          setDeleteDialogModalOpen(false);
          formik.resetForm();
        }
        handleToast("danger", message, true);
        setErrorMessage(message);
      });
  };

  return (
    <div
      id="measure-details-form"
      data-testid={`measure-references`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>References</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>

        <table>
          <tbody>
            <tr>
              <td>
                <TextField
                  id="search"
                  style={{ width: "280px", paddingBottom: "32px" }}
                  label="Search"
                  placeholder="Search"
                  inputProps={{
                    "data-testid": "measure-reference-search-input",
                  }}
                  data-testid="measure-reference-list-search"
                  name="searchValue"
                  value={formik.values.searchValue}
                  onChange={formik.handleChange}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment
                          position="start"
                          data-testid="measure-reference-search"
                          onClick={handleSearch}
                          style={{ cursor: "pointer" }}
                        >
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment
                          data-testid="measure-reference-clear-search"
                          position="end"
                          style={{ cursor: "pointer" }}
                          onClick={handleClearSearch}
                        >
                          <IconButton>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </td>
              <td>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row-reverse",
                    paddingBottom: "15px",
                  }}
                >
                  <Button
                    id="create-reference"
                    disabled={!measureCanEdit}
                    variant="outline-filled"
                    className="page-header-action-button"
                    data-testid="create-reference-button"
                    onClick={toggleOpen}
                  >
                    <AddIcon className="page-header-action-icon" />
                    Add Reference
                  </Button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div id="measure-meta-data-table">
          <table className="meta-data-table">
            <thead>
              <tr>
                <th scope="col" className="col-header">
                  Type
                </th>
                <th scope="col" className="col-header">
                  References
                </th>
                <th scope="col" className="col-header"></th>
              </tr>
            </thead>
            <tbody data-testId="measure-references-table-body">
              {visibleReferences?.length > 0 ||
              measure?.measureMetaData?.references?.length > 0 ? (
                visibleReferences.map((reference, index) => (
                  <MeasureMetaDataRow
                    name={reference.referenceType}
                    description={reference.referenceText}
                    handleClick={handleClick}
                    id={reference.id}
                    key={`${reference.referenceType}-${index}`}
                    canEdit={measureCanEdit}
                    type="reference"
                  />
                ))
              ) : (
                <p data-testId="empty-references">
                  There are currently no references. Click the (Add Reference)
                  button above to add one.
                </p>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <Pagination
            totalItems={totalItems}
            visibleItems={visibleItems}
            limitOptions={[10, 25, 50]}
            offset={offset}
            handlePageChange={handlePageChange}
            handleLimitChange={handleLimitChange}
            page={Number(values?.page) || 1}
            limit={Number(values?.limit) || 10}
            count={totalPages}
            shape="rounded"
            hideNextButton={!canGoNext}
            hidePrevButton={!canGoPrev}
          />
        </div>
      </div>

      <Toast
        toastKey="measure-information-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `measure-references-error`
            : `measure-references-success`
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
      />
      <MadieDialog
        form={true}
        title={selectedReference ? "Edit Reference" : "New References"}
        dialogProps={{
          open,
          onClose: toggleOpen,
          id: "add-measure-meta-data-dialog",
          onSubmit: formik.handleSubmit,
        }}
        cancelButtonProps={{
          cancelText: "Discard Changes",
          "data-testid": "cancel-button",
        }}
        continueButtonProps={{
          continueText: "Save",
          "data-testid": "save-button",
          disabled: !(formik.isValid && formik.dirty),
        }}
        children={
          <div>
            <Select
              id={`measure-referenceType`}
              label="Type"
              placeHolder={{ name: "Select", value: "" }}
              inputProps={{
                "data-testid": `measure-referenceType-input`,
              }}
              data-testid={`measure-referenceType`}
              readOnly={!measureCanEdit}
              required
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              {...formik.getFieldProps("referenceType")}
              options={REFERENCE_OPTIONS}
            />

            <TextEditor
              label="Reference"
              required
              data-testid="measure-referenceText"
              setFieldValue={formik.setFieldValue}
              readOnly={!measureCanEdit}
              error={
                formik.touched.referenceText &&
                Boolean(formik.errors.referenceText)
              }
              helperText={formikErrorHandler("referenceText")}
              {...formik.getFieldProps("referenceText")}
            />
          </div>
        }
      />

      <MadieDeleteDialog
        open={deleteDialogModalOpen}
        onContinue={() => {
          deleteMeasureReference(selectedReference.id);
        }}
        onClose={() => {
          setDeleteDialogModalOpen(false);
        }}
        dialogTitle="Delete Measure Reference"
        name={selectedReference?.referenceText}
      />
    </div>
  );
};

export default MeasureReferences;
