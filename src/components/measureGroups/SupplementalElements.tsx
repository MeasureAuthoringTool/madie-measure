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
import { SupplementalData } from "@madie/madie-models";
import cloneDeep from "lodash/cloneDeep";
import MeasureGroupAlerts from "./MeasureGroupAlerts";

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
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const { updateMeasure } = measureStore;

  const [allDefinitions, setAllDefinitions] = useState<string[]>([]);
  const [selectedDefinitions, setSelectedDefinitions] = useState<string[]>([]);
  const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>(
    []
  );
  const [selectedSupplementalData, setSelectedSupplementalData] = useState<
    SupplementalData[]
  >([]);

  const [alertMessage, setAlertMessage] = useState({
    type: undefined,
    message: undefined,
    canClose: false,
  });

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

  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure.cql).parse()
        .expressionDefinitions;
      const defines = definitions
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((opt, i) => opt.name.replace(/"/g, ""));
      setAllDefinitions(defines);
    } else if (measure?.cql !== undefined) {
      setAlertMessage({
        type: "error",
        message: "Please complete the CQL Editor process before continuing",
        canClose: false,
      });
    }
  }, [measure]);

  useEffect(() => {
    if (measure?.supplementalData) {
      setSelectedDefinitions(
        measure.supplementalData.map((supData) => {
          return supData.definition;
        })
      );
    }
  }, [measure]);

  useEffect(() => {
    if (measure?.supplementalData) {
      setSelectedDescriptions(
        measure.supplementalData.map((supData) => {
          return supData.description;
        })
      );
    }
  }, [measure]);

  useEffect(() => {
    if (measure?.supplementalData) {
      setSelectedSupplementalData(
        measure.supplementalData.map((supData) => {
          return supData;
        })
      );
    }
  }, [measure]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      selectedSupplementalDefinitions: selectedDefinitions || [],
      supplementalData: measure?.supplementalData || [],
      selectedDescriptions: selectedDescriptions || [],
    },
    onSubmit: (values) => {
      submitForm(values);
    },
  });
  const { resetForm } = formik;

  const submitForm = (values) => {
    const submitMeasure = {
      ...measure,
      supplementalData: formik.values.supplementalData,
    };

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

  const handleDefinitionChange = (selectedValues: string[]) => {
    const oldSelectedSupDataList = cloneDeep(selectedSupplementalData);

    const newList: SupplementalData[] = [];
    selectedValues.forEach((selectedDefinition) => {
      newList.push({
        definition: selectedDefinition,
        description: getDescriptionByDefinition(
          selectedDefinition,
          oldSelectedSupDataList
        ),
      });
    });

    setSelectedSupplementalData(newList);
    formik.setFieldValue("supplementalData", newList);
  };
  const getDescriptionByDefinition = (
    definition: string,
    oldSelectedSupDataList: SupplementalData[]
  ): string => {
    let description = "";
    oldSelectedSupDataList.forEach((selected) => {
      if (definition === selected.definition) {
        description = selected.description;
      }
    });
    return description;
  };

  const handleDesciptionChange = (definition, value, index) => {
    const supData = formik.values.supplementalData;
    for (let i = 0; i < supData.length; i++) {
      if (supData[i].definition === definition) {
        supData[i].description = value;
      }
    }
    formik.setFieldValue("supplementalData", supData);

    const descriptions = supData?.map((data) => {
      return data.description;
    });
    formik.setFieldValue("selectedDescriptions", descriptions);
  };

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid="supplemental-data-form"
    >
      <MeasureGroupAlerts {...alertMessage} />
      <div className="content">
        <div className="subTitle">
          <h2>Supplemental Data</h2>
          <div>
            <Typography
              style={{ fontSize: 14, fontWeight: 300, fontFamily: "Rubik" }}
            >
              <span style={asterisk}>*</span>
              Indicates required field
            </Typography>
          </div>
        </div>
        <div>
          {allDefinitions && (
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
                    value={formik.values.supplementalData.map(
                      (selected) => selected?.definition
                    )}
                    limitTags={2}
                    options={allDefinitions}
                    {...formik.getFieldProps("selectedSupplementalDefinitions")}
                    onChange={(
                      _event: any,
                      selectedValues: string[] | null
                    ) => {
                      formik.setFieldValue(
                        "selectedSupplementalDefinitions",
                        selectedValues
                      );

                      handleDefinitionChange(selectedValues);
                    }}
                  />
                </div>
              </div>
              <div id="description" className="right-box">
                {/* {selectedSupplementalData.map((supData, i) => { */}
                {formik.values.supplementalData?.map((supData, i) => {
                  return (
                    <div
                      key={`${supData.definition}-${i}`}
                      id={`${supData.definition}-${i}`}
                      style={{ paddingBottom: 15 }}
                    >
                      <FormFieldInner>
                        <FieldLabel
                          htmlFor={supData.definition + " - Description"}
                        >
                          {supData.definition + " - Description"}
                        </FieldLabel>
                        <FieldSeparator>
                          <TextArea
                            style={{ height: "100px", width: "100%" }}
                            value={
                              formik.values.supplementalData[i]?.description
                            }
                            name={supData.definition}
                            id={supData.definition}
                            disabled={!canEdit}
                            placeholder=""
                            data-testid={supData.definition}
                            onChange={(e) =>
                              handleDesciptionChange(
                                supData.definition,
                                e.target.value,
                                i
                              )
                            }
                          />
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
            disabled={!formik.dirty}
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
          setSelectedDefinitions(selectedDefinitions);
          setSelectedSupplementalData(
            measure?.supplementalData ? measure?.supplementalData : []
          );
          setDiscardDialogOpen(false);
        }}
        onClose={() => {
          setDiscardDialogOpen(false);
        }}
      />
    </form>
  );
}
