import React, { useState, useEffect } from "react";
import {
  Button,
  MadieDiscardDialog,
  Toast,
  AutoComplete,
  InputLabel,
  TextArea,
} from "@madie/madie-design-system/dist/react";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { useFormik } from "formik";
import tw, { styled } from "twin.macro";
import "../../../details/MeasureDetails.scss";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import { Measure } from "@madie/madie-models";
import MetaDataWrapper from "../../../details/MetaDataWrapper";
import MultipleSelectDropDown from "../../MultipleSelectDropDown";
import "./QdmSupplementalElements.scss";

const QdmSupplementalElements = () => {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const [definitions, setDefinitions] = useState([]);
  const { updateMeasure } = measureStore;
  const measureServiceApi = useMeasureServiceApi();

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

  // Fetching definitions from CQL to populate dropdown
  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure?.cql).parse()
        .expressionDefinitions;
      const mappedDefinitions = definitions.map(({ name }) => {
        return JSON.parse(name);
      });
      setDefinitions(mappedDefinitions);
    }
  }, [measure]);

  const formik = useFormik({
    initialValues: {
      supplementalData: measure?.supplementalData || [],
      supplementalDataDescription: measure?.supplementalDataDescription || "",
    },
    enableReinitialize: true,
    validateOnChange: true,
    onSubmit: (values) => handleSubmit(values),
  });
  const { resetForm } = formik;

  const handleSubmit = (values) => {
    const modifiedMeasure = {
      ...measure,
      supplementalData: values.supplementalData,
      supplementalDataDescription: values.supplementalDataDescription,
    };

    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((response: any) => {
        const { data, status } = response;
        if (status === 200 || status === 201) {
          updateMeasure(data);
          handleToast(
            "success",
            `Measure Supplemental Data have been Saved Successfully`,
            true
          );
        }
      })
      .catch((reason) => {
        const message = `Error updating measure "${modifiedMeasure.measureName}": ${reason}`;
        handleToast("danger", message, true);
      });
  };

  // toast utilities
  // toast is only used for success messages
  // creating and updating PC
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
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  const onCancel = () => {
    setDiscardDialogOpen(true);
  };

  return (
    <MetaDataWrapper
      header="Supplemental Data"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <div id="measure-supplemental-data-wrapper">
        <div className="left">
          <MultipleSelectDropDown
            formControl={formik.getFieldProps("supplementalData")}
            value={formik.values.supplementalData?.map((sd) => sd?.definition)}
            id="supplemental-data"
            label="Definition"
            placeHolder={{ name: "", value: "" }}
            required={true}
            disabled={!canEdit}
            error={false}
            helperText=""
            multipleSelect={true}
            limitTags={1}
            options={definitions}
            onClose={() => {}}
            onChange={(e, v, r) => {
              if (r === "removeOption") {
                const copiedValues = formik.values.supplementalData.slice();
                // find out what v is not present in copiedValues
                const filteredValues = copiedValues.filter((val) => {
                  return v.includes(val.definition);
                });
                formik.setFieldValue("supplementalData", filteredValues);
              }
              if (r === "selectOption") {
                const copiedValues = formik.values.supplementalData.slice();
                // we don't seem to have a good way of knowing exactly what was selected, but we can compare
                const selectedOption = v.filter((v) => {
                  for (let i = 0; i < copiedValues.length; i++) {
                    if (copiedValues[i].definition === v) {
                      return false;
                    }
                  }
                  return true;
                });
                copiedValues.push({
                  definition: selectedOption[0],
                  description: "",
                });
                formik.setFieldValue("supplementalData", copiedValues);
              }
              if (r === "clear") {
                formik.setFieldValue("supplementalData", []);
              }
            }}
          />
        </div>
        <div className="right">
          <InputLabel
            htmlFor="supplementalDataDescription"
            required={true}
            style={{ placeContent: "flex-end" }}
          >
            Description
          </InputLabel>
          <TextArea
            {...formik.getFieldProps("supplementalDataDescription")}
            name="supplementalDataDescription"
            id="supplementalDataDescription"
            disabled={!canEdit}
            placeholder="Description"
            data-testid="supplementalDataDescription"
            className="supplemental-data-description"
          />
        </div>
      </div>
      <Toast
        toastKey="supplemental-data-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `supplemental-data-error`
            : `supplemental-data-success`
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
          setDiscardDialogOpen(false);
        }}
        onClose={() => setDiscardDialogOpen(false)}
      />
    </MetaDataWrapper>
  );
};

export default QdmSupplementalElements;
