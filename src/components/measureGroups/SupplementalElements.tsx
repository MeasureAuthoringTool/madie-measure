import React, { useState, useEffect } from "react";
import {
  Button,
  MadieDiscardDialog,
  Toast,
  AutoComplete,
} from "@madie/madie-design-system/dist/react";
import useMeasureServiceApi from "../../api/useMeasureServiceApi";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { useFormik } from "formik";
import { Typography } from "@mui/material";
import "../editMeasure/measureDetails/MeasureDetails.scss";
import tw from "twin.macro";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";

const asterisk = { color: "#D92F2F", marginRight: 3 };
const FormFieldInner = tw.div`lg:col-span-3`;
const FieldLabel = tw.label`block capitalize text-sm font-medium text-slate-90`;
const FieldSeparator = tw.div`mt-1`;
const TextArea = tw.textarea`disabled:bg-slate shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-500! rounded-md!`;

interface SupplementalElementsProps {
  title: string;
  dataTestId: string;
  setErrorMessage?: Function;
}

export default function SupplementalElements(props: SupplementalElementsProps) {
  const { setErrorMessage } = props;
  const measureServiceApi = useMeasureServiceApi();
  const [supplementalDataElementList, setSupplementalDataElementList] =
    useState<string[]>([]);
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const { updateMeasure } = measureStore;

  const [selectedSupplementalDataList, setSelectedSupplementalDataList] =
    useState<string[]>([]);

  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastType("success");
    setToastMessage("");
    setToastOpen(false);
  };
  const handleToast = (type, message, open) => {
    setToastType(type);
    setToastMessage(message);
    setToastOpen(open);
  };

  const canEdit = checkUserCanEdit(
    measure?.createdBy,
    measure?.acls,
    measure?.measureMetaData?.draft
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      supplementalDataElements: [],
      descriptions: [],
    },
    onSubmit: (values) => {
      submitForm(values);
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure.cql).parse()
        .expressionDefinitions;
      const defines = definitions
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((opt, i) => opt.name.replace(/"/g, ""));
      setSupplementalDataElementList(defines);
    } else if (measure?.cql !== undefined) {
      handleToast(
        "danger",
        `Please complete the CQL Editor process before continuing`,
        true
      );
    }
  }, [measure]);

  const submitForm = (values) => {
    const submitMeasure = {
      ...measure,
    };

    //to-do: update measure with new supplemental data elements
    measureServiceApi
      .updateMeasure(submitMeasure)
      .then(() => {
        handleToast(
          "success",
          `Supplement Data Element Information Saved Successfully`,
          true
        );
        updateMeasure(submitMeasure);
      })
      .catch(() => {
        const message = `Error updating measure "${measure.measureName}"`;
        setErrorMessage(message);

        handleToast(
          "danger",
          `Error updating measure "${measure.measureName}"`,
          true
        );
      });
  };

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Route handle store will give warning message
  // if form is dirty and user ties to navigate across SPAs
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  const handleDesciptionChange = (field, value, index) => {
    selectedSupplementalDataList.filter((selected) => {
      if (selected === field) {
        formik.setFieldValue(field, value);
      }
    });
  };

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid="supplemental-data-form"
    >
      <div className="content">
        <div className="subTitle">
          <h2>Supplemental Data</h2>
          <div className="required">
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={asterisk}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>
        <div>
          {supplementalDataElementList && (
            <>
              <div tw="mb-4 w-1/2">
                <div className="left-box">
                  <AutoComplete
                    multiple
                    id="supplementalDataElements"
                    data-testid="supplementalDataElements"
                    label="Definition"
                    placeholder=""
                    required={false}
                    disabled={!canEdit}
                    error={
                      formik.touched.supplementalDataElements &&
                      formik.errors["supplementalDataElements"]
                    }
                    helperText={
                      formik.touched.supplementalDataElements &&
                      formik.errors["supplementalDataElements"]
                    }
                    options={supplementalDataElementList}
                    {...formik.getFieldProps("supplementalDataElements")}
                    onChange={(
                      _event: any,
                      selectedValues: string[] | null
                    ) => {
                      formik.setFieldValue(
                        "supplementalDataElements",
                        selectedValues
                      );
                      setSelectedSupplementalDataList(selectedValues);
                    }}
                  />
                </div>
              </div>
              <div id="description" className="right-box">
                {selectedSupplementalDataList.map((element, i) => {
                  return (
                    <div
                      key={element}
                      id={element}
                      style={{ paddingBottom: 15 }}
                    >
                      <FormFieldInner>
                        <FieldLabel htmlFor={element + " - Description"}>
                          {element + " - Description"}
                        </FieldLabel>
                        <FieldSeparator>
                          <TextArea
                            style={{ height: "100px", width: "100%" }}
                            value={formik.values.descriptions[i]}
                            name={element}
                            id={element}
                            autoComplete={element}
                            disabled={!canEdit}
                            placeholder=""
                            data-testid={element}
                            onChange={(e) =>
                              handleDesciptionChange(element, e.target.value, i)
                            }
                          />
                          {formik.values.descriptions[i]}
                        </FieldSeparator>
                      </FormFieldInner>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            variant="outline"
            data-testid="cancel-button"
            disabled={!formik.dirty}
            onClick={() => {
              setDiscardDialogOpen(true);
            }}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            disabled={!(formik.isValid && formik.dirty)}
            variant="cyan"
            data-testid={`supplementalDataElement-save`}
            style={{ marginTop: 20, float: "right" }}
            onClick={() => {
              submitForm(formik.values);
            }}
          >
            Save
          </Button>
        </div>
      )}
      <Toast
        toastKey="supplementalDataElement-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `supplementalDataElement-error`
            : `supplementalDataElement-success`
        }
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={6000}
        closeButtonProps={{
          "data-testid": "close-error-button",
        }}
      />
      <MadieDiscardDialog
        open={discardDialogOpen}
        onContinue={() => {
          resetForm();
          setSelectedSupplementalDataList([]);
          setDiscardDialogOpen(false);
        }}
        onClose={() => {
          setDiscardDialogOpen(false);
          setSelectedSupplementalDataList(selectedSupplementalDataList);
        }}
      />
    </form>
  );
}
