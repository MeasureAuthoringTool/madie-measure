import React, { useState, useEffect, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  Button,
  MadieDialog,
  Pagination,
  Select,
  TextArea,
  Toast,
  MadieDeleteDialog,
} from "@madie/madie-design-system/dist/react";
import { Typography, MenuItem } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { measureStore, checkUserCanEdit } from "@madie/madie-util";
import { useFormik } from "formik";
import MeasureMetaDataRow from "../MeasureMetaDataRow";
import { MeasureReferencesValidator } from "./MeasureReferencesValidator";
import { Measure, Reference } from "@madie/madie-models";

import "../MeasureMetaDataTable.scss";

const REFERENCE_TYPES = [
  "Citation",
  "Documentation",
  "Justification",
  "Unknown",
];
const REFERENCE_OPTIONS = REFERENCE_TYPES.map((ref, i) => (
  <MenuItem key={`${ref}-${i}`} data-testid={`${ref}-option`} value={ref}>
    {ref}
  </MenuItem>
));

interface MeasureReferencesProps {
  setErrorMessage: Function;
}

const MeasureReferences = (props: MeasureReferencesProps) => {
  const { setErrorMessage } = props;
  const { search } = useLocation();
  const history = useHistory();
  const measureServiceApi = useMeasureServiceApi();
  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
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
  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
  const INITIAL_VALUES = {
    id: selectedReference?.id,
    referenceType: selectedReference?.referenceType,
    referenceText: selectedReference?.referenceText,
  } as Reference;
  const [measureReferences, setMeasureReferences] = useState<Reference[]>(
    measure?.measureMetaData?.references || []
  );
  // we ideally will always make a new copy of the measure. Lets just listen for that update and then write our definitions to local state.
  useEffect(() => {
    if (measure?.measureMetaData?.references) {
      const copiedDefinitions = [...measure?.measureMetaData?.references];
      setMeasureReferences(copiedDefinitions);
    }
  }, [setMeasureReferences, measure]);

  const handleSubmit = (values: Reference) => {
    //  we want to first sort by referenceType then by referenceText
    const sortByTypeThenReferences = (references: Reference[]): Reference[] => {
      const sorterFunction = (a: Reference, b: Reference) => {
        const type1 = a.referenceType.toLowerCase();
        const type2 = b.referenceType.toLowerCase();
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
    const copiedMetaData = { ...measure?.measureMetaData };
    if (
      copiedMetaData.hasOwnProperty("references") &&
      Array.isArray(copiedMetaData.references)
    ) {
      if (!selectedReference) {
        // if it does exist we push to it
        copiedMetaData.references.push(values);
        copiedMetaData.references = sortByTypeThenReferences(
          copiedMetaData.references
        );
      } else {
        const newReferences: Array<Reference> =
          copiedMetaData.references.filter(
            (reference) => reference.id !== selectedReference.id
          );
        newReferences.push(values);
        copiedMetaData.references = sortByTypeThenReferences(newReferences);
      }
    } else {
      // if none exist, we will init our the array
      copiedMetaData.references = [values];
    }
    const modifiedMeasure = {
      ...measure,
      measureMetaData: copiedMetaData,
    };
    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((res) => {
        //@ts-ignore
        const { status, data } = res;
        if (status === 200) {
          handleToast("success", `Measure Reference Saved Successfully`, true);
          updateMeasure(data);
          toggleOpen();
          formik.resetForm();
        }
      })
      .catch((reason) => {
        const message = `Error updating measure "${measure.measureName}"`;
        handleToast("danger", message, true);
        // to do: some sort of error handling
        // console.warn(`Error updating measure : ${reason}`);
        setErrorMessage(message);
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
    initialValues: { ...INITIAL_VALUES },
    enableReinitialize: true,
    validationSchema: MeasureReferencesValidator,
    onSubmit: async (values: Reference) => await handleSubmit(values),
  });

  function formikErrorHandler(name: string, isError: boolean) {
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
    history.push(`?page=${v}&limit=${values?.limit || 10}`);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    setCurrentPage(1);
    history.push(`?page=${1}&limit=${e.target.value}`);
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

    console.log("here");
    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((res) => {
        //@ts-ignore
        const { status, data } = res;
        if (status === 200) {
          console.log("here");
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
        const message = `Error updating measure "${measure.measureName}"`;
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
        <div id="measure-meta-data-table">
          <div className="top-row">
            <Button
              id="create-reference"
              disabled={!canEdit}
              variant="outline-filled"
              className="page-header-action-button"
              data-testid="create-reference-button"
              onClick={toggleOpen}
            >
              <AddIcon className="page-header-action-icon" />
              Add Reference
            </Button>
          </div>
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
              {visibleReferences?.length > 0 ? (
                visibleReferences.map((reference, index) => (
                  <MeasureMetaDataRow
                    name={reference.referenceType}
                    description={reference.referenceText}
                    handleClick={handleClick}
                    id={reference.id}
                    key={`${reference.referenceType}-${index}`}
                    canEdit={canEdit}
                  />
                ))
              ) : (
                <p data-testId="empty-references">
                  There are currently no definitions. Click the (Add Reference)
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
              disabled={!canEdit}
              required
              SelectDisplayProps={{
                "aria-required": "true",
              }}
              {...formik.getFieldProps("referenceType")}
              options={REFERENCE_OPTIONS}
            />

            <TextArea
              required
              disabled={!canEdit}
              label="Reference"
              placeholder="Enter"
              readOnly={!canEdit}
              id="measure-referenceText"
              data-testid="measure-referenceText"
              inputProps={{
                "data-testid": "measure-referenceText-input",
                "aria-describedby": "measure-referenceText-helper-text",
              }}
              error={
                formik.touched.referenceText &&
                Boolean(formik.errors.referenceText)
              }
              helperText={formikErrorHandler("referenceText", true)}
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
