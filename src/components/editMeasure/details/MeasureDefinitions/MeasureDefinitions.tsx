import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import queryString from "query-string";

import {
  Button,
  Pagination,
  TextField,
  Toast,
  MadieDialog,
  MadieDeleteDialog,
} from "@madie/madie-design-system/dist/react";
import "twin.macro";
import SearchIcon from "@mui/icons-material/Search";

import ClearIcon from "@mui/icons-material/Clear";
import { Typography, IconButton, InputAdornment } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { measureStore, useMeasureServiceApi } from "@madie/madie-util";
import { useFormik } from "formik";
import { MeasureDefinition, Measure, MeasureLock } from "@madie/madie-models";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import MeasureMetaDataRow from "../MeasureMetaDataRow";
import { MeasureDefinitionValidator } from "./MeasureDefinitionValidator";
import "../MeasureMetaDataTable.scss";
import TextEditor from "../../populationCriteria/groups/TextEditor";

interface MeasureDefinitionsProps {
  setErrorMessage: Function;
  measureCanEdit: boolean;
}

const MeasureDefinitions = (props: MeasureDefinitionsProps) => {
  const { setErrorMessage, measureCanEdit } = props;
  const { search } = useLocation();
  let navigate = useNavigate();
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

  // Form utilities
  const values = queryString.parse(search);
  const INITIAL_VALUES = {
    id: selectedDefinition?.id,
    term: selectedDefinition?.term,
    definition: selectedDefinition?.definition,
  } as MeasureDefinition;
  const [measureDefinitions, setMeasureDefinitions] = useState<
    MeasureDefinition[]
  >(measure?.measureMetaData?.measureDefinitions || []);

  const formik = useFormik({
    initialValues: {
      ...INITIAL_VALUES,
      searchValue: "",
    },
    enableReinitialize: true,
    validationSchema: MeasureDefinitionValidator,
    onSubmit: async (values: any) => await handleSubmit(values),
  });

  function formikErrorHandler(name: string) {
    if (formik.touched[name] && formik.errors[name]) {
      return `${formik.errors[name]}`;
    }
  }

  useFormikResetOnEvent(formik);

  useEffect(() => {
    if (measure?.measureMetaData?.measureDefinitions) {
      const copiedDefinitions = [
        ...measure?.measureMetaData?.measureDefinitions,
      ];
      setMeasureDefinitions(copiedDefinitions);
    }
  }, [setMeasureDefinitions, measure]);

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
  //first sort by term then by definition
  const sortDefinitions = (
    definitions: MeasureDefinition[]
  ): MeasureDefinition[] => {
    const sortFunction = (a: MeasureDefinition, b: MeasureDefinition) => {
      const term1 = a.term ? a.term.toLowerCase() : "";
      const term2 = b.term ? b.term.toLowerCase() : "";
      const definition1 = a.definition.toLowerCase();
      const definition2 = b.definition.toLowerCase();
      if (term1 < term2) {
        return -1;
      }
      if (term1 > term2) {
        return 1;
      }
      if (term1 === term2) {
        if (definition1 < definition2) {
          return -1;
        }
        if (definition1 > definition2) {
          return 1;
        }
      }
      return 0;
    };
    return definitions.sort(sortFunction);
  };

  const handleSubmit = (values: MeasureDefinition) => {
    const copiedMetaData = { ...measure?.measureMetaData };
    // if metadata has measureDefinitions
    if (
      copiedMetaData.hasOwnProperty("measureDefinitions") &&
      Array.isArray(copiedMetaData.measureDefinitions)
    ) {
      if (!selectedDefinition) {
        // adding a new measure definition
        copiedMetaData.measureDefinitions.push(values);
        copiedMetaData.measureDefinitions = sortDefinitions(
          copiedMetaData.measureDefinitions
        );
      } else {
        //edit a measure defintion
        const newDefinitions: Array<MeasureDefinition> =
          copiedMetaData.measureDefinitions.filter(
            (definition) => definition.id !== selectedDefinition.id
          );
        newDefinitions.push(values);
        copiedMetaData.measureDefinitions = sortDefinitions(newDefinitions);
      }
    } else {
      // if metadata does not have measureDefinitions
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
          setErrorMessage("");
          handleToast("success", "Measure Definition saved Successfully", true);
          updateMeasure(data);
          toggleOpen();
          formik.resetForm();
        } else {
          let message = `Error updating measure ${measure.measureName}`;
          handleToast("danger", message, true);
          setErrorMessage(message);
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
          formik.resetForm();
        }
        handleToast("danger", message, true);
        setErrorMessage(message);
      });
  };

  const [open, setOpen] = useState<boolean>(false);
  const [deleteDialogModalOpen, setDeleteDialogModalOpen] =
    useState<boolean>(false);
  const toggleOpen = () => {
    setOpen(!open);
    setSelectedDefinition(null);
  };

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
    if (measureDefinitions) {
      if (measureDefinitions?.length < currentLimit) {
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
    setSelectedDefinition(
      measure?.measureMetaData?.measureDefinitions?.find((definition) => {
        return id === definition.id;
      })
    );
  };

  const handleSearch = () => {
    const filtered = measure?.measureMetaData?.measureDefinitions?.filter(
      (def) =>
        def.term
          .toLowerCase()
          .includes(formik.values.searchValue.toLowerCase()) ||
        def.definition
          .toLowerCase()
          .includes(formik.values.searchValue.toLowerCase())
    );
    setMeasureDefinitions(filtered);
  };
  const handleClearSearch = () => {
    if (formik.values.searchValue) {
      formik.resetForm();
      setCurrentPage(1);
      setMeasureDefinitions(measure?.measureMetaData?.measureDefinitions);
    }
  };

  const deleteMeasureDefinition = useCallback(
    (id) => {
      const modifiedMetaData =
        measure?.measureMetaData?.measureDefinitions?.filter(
          (definition) => definition?.id !== id
        );
      const modifiedMeasure: Measure = {
        ...measure,
        measureMetaData: {
          ...measure.measureMetaData,
          measureDefinitions: modifiedMetaData,
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
              "Measure definition deleted successfully",
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
    },
    [measure?.measureMetaData?.measureDefinitions, measureServiceApi]
  );

  return (
    <div
      id="measure-details-form"
      data-testid={`measure-definitions`}
      style={{ minHeight: 539 }}
    >
      <div className="content">
        <div className="subTitle">
          <h2>Definitions</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            ></Typography>
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
                    "data-testid": "measure-definition-search-input",
                  }}
                  data-testid="measure-definition-list-search"
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
                          data-testid="measure-definition-search"
                          onClick={handleSearch}
                          style={{ cursor: "pointer" }}
                        >
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment
                          data-testid="measure-definition-clear-search"
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
                    id="create-definition"
                    disabled={!measureCanEdit}
                    variant="outline-filled"
                    className="page-header-action-button"
                    data-testid="create-definition-button"
                    onClick={toggleOpen}
                    sx={{
                      display: "flex",
                      flexDirection: "row-reverse",
                    }}
                  >
                    <AddIcon className="page-header-action-icon" />
                    Add Term
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
                  Term
                </th>
                <th scope="col" className="col-header">
                  Definition
                </th>
                <th scope="col" className="col-header"></th>
              </tr>
            </thead>
            <tbody data-testId="measure-definitions-table-body">
              {visibleDefinitions?.length > 0 ||
              measure?.measureMetaData?.measureDefinitions?.length > 0 ? (
                visibleDefinitions.map((definition, index) => (
                  <MeasureMetaDataRow
                    name={definition.term}
                    description={definition.definition}
                    handleClick={handleClick}
                    id={definition.id}
                    key={`${definition.term}-${index}`}
                    canEdit={measureCanEdit}
                    type="definition"
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
        title={selectedDefinition ? "Edit Term" : "Add Term"}
        dialogProps={{
          open,
          onClose: toggleOpen,
          id: "add-measure-meta-data-dialog",
          onSubmit: formik.handleSubmit,
        }}
        cancelButtonProps={{
          cancelText: selectedDefinition ? "Discard Changes" : "Cancel",
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
              readOnly={!measureCanEdit}
              label="Term"
              placeholder="Placeholder"
              id="measure-definition-term"
              data-testid="measure-definition-term"
              inputProps={{
                "data-testid": "measure-definition-term-input",
                "aria-describedby": "measure-definition-term-helper-text",
              }}
              error={formik.touched.term && Boolean(formik.errors.term)}
              helperText={formikErrorHandler("term")}
              {...formik.getFieldProps("term")}
            />

            <TextEditor
              label="Definition"
              required
              data-testid="measure-definition"
              setFieldValue={formik.setFieldValue}
              readOnly={!measureCanEdit}
              error={
                formik.touched.definition && Boolean(formik.errors.definition)
              }
              helperText={formikErrorHandler("definition")}
              {...formik.getFieldProps("definition")}
            />
          </div>
        }
      />

      <MadieDeleteDialog
        open={deleteDialogModalOpen}
        onContinue={() => {
          deleteMeasureDefinition(selectedDefinition.id);
        }}
        onClose={() => {
          setDeleteDialogModalOpen(false);
        }}
        dialogTitle="Delete Measure Definition"
        name={selectedDefinition?.term}
      />
    </div>
  );
};

export default MeasureDefinitions;
