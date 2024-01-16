import React, { useState, useEffect, useCallback } from "react";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import {
  Button,
  MadieDialog,
  Pagination,
  TextField,
  TextArea,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { measureStore, checkUserCanEdit } from "@madie/madie-util";
import { useFormik } from "formik";
import MeasureMetaDataRow from "../MeasureMetaDataRow";
import { MeasureDefininitionsValidator } from "./MeasureDefinitionsValidator";

import "../MeasureMetaDataTable.scss";

export interface MeasureDefinition {
  id?: string;
  definition: string;
  term: string;
}

// This component should likely be reused for QICore. At that time it would make sense to pull conditionally import validation logic and whatever else may be different.
interface MeasureDefinitionsProps {
  setErrorMessage: Function;
}

const MeasureDefinitions = (props: MeasureDefinitionsProps) => {
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
  const [selectedDefinition, setSelectedDefinition] =
    useState<MeasureDefinition>(null);
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

  const termComparator = (a, b) => a.term.localeCompare(b.term);

  const INITIAL_VALUES = {
    id: selectedDefinition?.id,
    term: selectedDefinition?.term,
    definition: selectedDefinition?.definition,
  } as MeasureDefinition;
  const [measureDefinitions, setMeasureDefinitions] = useState<
    MeasureDefinition[]
  >(
    measure?.measureMetaData?.measureDefinitions
      ? measure?.measureMetaData?.measureDefinitions.sort(termComparator)
      : []
  );

  // we ideally will always make a new copy of the measure. Lets just listen for that update and then write our definitions to local state.
  useEffect(() => {
    if (measure?.measureMetaData?.measureDefinitions) {
      const copiedDefinitions = [
        ...measure?.measureMetaData?.measureDefinitions,
      ];
      setMeasureDefinitions(copiedDefinitions);
    }
  }, [setMeasureDefinitions, measure]);
  const handleSubmit = (values: MeasureDefinition) => {
    // make a copy of the metaData
    const copiedMetaData = { ...measure?.measureMetaData };
    // confirm it has the measureDefinitions key
    if (
      copiedMetaData.hasOwnProperty("measureDefinitions") &&
      Array.isArray(copiedMetaData.measureDefinitions)
    ) {
      //when adding a new definition
      if (!selectedDefinition) {
        // if it does exist we push to it
        copiedMetaData.measureDefinitions.push(values);
        copiedMetaData.measureDefinitions = [
          ...copiedMetaData.measureDefinitions?.sort(termComparator),
        ];
      } else {
        const newMeasureDefinitions: Array<MeasureDefinition> =
          copiedMetaData.measureDefinitions.filter(
            (measureDefinition) =>
              measureDefinition.id !== selectedDefinition.id
          );
        newMeasureDefinitions.push(values);
        copiedMetaData.measureDefinitions = [
          ...newMeasureDefinitions?.sort(termComparator),
        ];
      }
    } else {
      // if none exist, we will init our the array
      copiedMetaData.measureDefinitions = [values];
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
          handleToast("success", `Measure Definition Saved Successfully`, true);
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
    validationSchema: MeasureDefininitionsValidator,
    onSubmit: async (values: MeasureDefinition) => await handleSubmit(values),
  });

  function formikErrorHandler(name: string, isError: boolean) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }
  const [open, setOpen] = useState<boolean>(false);
  const toggleOpen = () => {
    setOpen(!open);
    setSelectedDefinition(null);
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
  const [visibleDefinitions, setVisibleDefinitions] = useState<
    MeasureDefinition[]
  >([]);

  const managePagination = useCallback(() => {
    if (measureDefinitions.length < currentLimit) {
      setOffset(0);
      setVisibleDefinitions([...measureDefinitions]);
      setVisibleItems(measureDefinitions.length);
      setTotalItems(measureDefinitions.length);
      setTotalPages(1);
    } else {
      const start = (currentPage - 1) * currentLimit;
      const end = start + currentLimit;
      const newVisibleDefinitions = [...measureDefinitions].slice(start, end);
      setOffset(start);
      setVisibleDefinitions(newVisibleDefinitions);
      setVisibleItems(newVisibleDefinitions.length);
      setTotalItems(measureDefinitions.length);
      setTotalPages(Math.ceil(measureDefinitions.length / currentLimit));
    }
  }, [
    currentLimit,
    currentPage,
    measureDefinitions,
    setOffset,
    setVisibleDefinitions,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
  ]);

  useEffect(() => {
    managePagination();
  }, [measureDefinitions, currentPage, currentLimit]);

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
  return (
    <div
      id="measure-details-form"
      data-testid={`measure-definition-terms`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Definition Terms</h2>
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
              id="create-definition"
              disabled={!canEdit}
              variant="outline-filled"
              className="page-header-action-button"
              data-testid="create-definition-button"
              onClick={toggleOpen}
            >
              <AddIcon className="page-header-action-icon" />
              Add Term
            </Button>
          </div>
          <table className="meta-data-table">
            <thead>
              <tr>
                <th scope="col" className="col-header">
                  Term
                </th>
                <th scope="col" className="col-header">
                  Definition
                </th>
                <th scope="col" className="col-header">
                  Action
                </th>
              </tr>
            </thead>
            <tbody data-testId="measure-definitions-table-body">
              {visibleDefinitions?.length > 0 ? (
                visibleDefinitions.map((measureDefinition, index) => (
                  <MeasureMetaDataRow
                    name={measureDefinition.term}
                    description={measureDefinition.definition}
                    measureDefinition={measureDefinition}
                    setOpen={setOpen}
                    setSelectedDefinition={setSelectedDefinition}
                    key={`${measureDefinition.term}-${index}`}
                  />
                ))
              ) : (
                <p data-testId="empty-definitions">
                  There are currently no definitions. Click the (Add Term)
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
            ? `measure-definitions-error`
            : `measure-definitions-success`
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
        title={selectedDefinition ? "Edit Term" : "New Term"}
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
            <TextField
              required
              disabled={!canEdit}
              label="Term"
              id="qdm-measure-term"
              data-testid="qdm-measure-term"
              inputProps={{
                "data-testid": "qdm-measure-term-input",
                "aria-describedby": "qdm-measure-term-helper-text",
              }}
              helperText={formikErrorHandler("term", true)}
              error={formik.touched.term && Boolean(formik.errors.term)}
              {...formik.getFieldProps("term")}
            />
            <TextArea
              required
              disabled={!canEdit}
              label="Definition"
              readOnly={!canEdit}
              id="qdm-measure-definition"
              data-testid="qdm-measure-definition"
              inputProps={{
                "data-testid": "qdm-measure-definition-input",
                "aria-describedby": "qdm-measure-definition-helper-text",
              }}
              placeholder=""
              error={
                formik.touched.definition && Boolean(formik.errors.definition)
              }
              helperText={formikErrorHandler("definition", true)}
              {...formik.getFieldProps("definition")}
            />
          </div>
        }
      />
    </div>
  );
};

export default MeasureDefinitions;
