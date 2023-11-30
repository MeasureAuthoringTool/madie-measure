import React, { useState, useEffect } from "react";
import "twin.macro";
import "styled-components/macro";
import { useFormik } from "formik";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import MetaDataWrapper from "../../../details/MetaDataWrapper";
import MultipleSelectDropDown from "../../MultipleSelectDropDown";
import {
  InputLabel,
  MadieDiscardDialog,
  Toast,
  TextArea,
} from "@madie/madie-design-system/dist/react";

const RiskAdjustment = () => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const [definitions, setDefinitions] = useState([]);
  const { updateMeasure } = measureStore;
  const measureServiceApi = useMeasureServiceApi();

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure?.cql).parse()
        .expressionDefinitions;
      const mappedDefinitions = definitions.map(({ name }) => {
        const parsedName = JSON.parse(name);
        return parsedName;
      });
      setDefinitions(mappedDefinitions);
    }
  }, [measure]);

  const formik = useFormik({
    initialValues: {
      riskAdjustments: measure?.riskAdjustments || [],
      riskAdjustmentDescription: measure?.riskAdjustmentDescription || "",
    },
    enableReinitialize: true,
    validateOnChange: true,
    onSubmit: (values) => handleSubmit(values),
  });

  const handleSubmit = (values) => {
    const modifiedMeasure = {
      ...measure,
      riskAdjustments: values.riskAdjustments,
      riskAdjustmentDescription: values.riskAdjustmentDescription,
    };

    measureServiceApi
      .updateMeasure(modifiedMeasure)
      .then((response: any) => {
        const { data, status } = response;
        if (status === 200 || status === 201) {
          updateMeasure(data);
          handleToast(
            "success",
            `Measure Risk Adjustments have been Saved Successfully`,
            true
          );
        }
      })
      .catch((reason) => {
        const message = `Error updating measure "${modifiedMeasure.measureName}": ${reason}`;
        handleToast("danger", message, true);
      });
  };

  const { resetForm } = formik;
  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );

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
      header="Risk Adjustment"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <div tw="flex flex-col" id="risk-adjustment" data-testid="risk-adjustment">
        <InputLabel htlmfor="riskAdjustmentDescription">Description</InputLabel>
        <TextArea
          {...formik.getFieldProps("riskAdjustmentDescription")}
          name="riskAdjustmentDescription"
          id="riskAdjustmentDescription"
          disabled={!canEdit}
          placeholder="Description"
          data-testid="riskAdjustmentDescription"
          className="risk-description"
        />
      </div>
      <div tw="flex mt-6 w-1/4">
        <MultipleSelectDropDown
          formControl={formik.getFieldProps("riskAdjustments")}
          value={formik.values.riskAdjustments.map((risk) => risk?.definition)}
          id="risk-adjustment"
          label="Definition"
          placeHolder={{ name: "", value: "" }}
          required={false}
          disabled={!canEdit}
          error={false}
          helperText=""
          multipleSelect={true}
          limitTags={1}
          options={definitions}
          onClose={() => {}}
          onChange={(e, v, r) => {
            if (r === "removeOption") {
              const copiedValues = formik.values.riskAdjustments.slice();
              const filteredValues = copiedValues.filter((val) => {
                return v.includes(val.definition);
              });
              formik.setFieldValue("riskAdjustments", filteredValues);
            }
            if (r === "selectOption") {
              const copiedValues = formik.values.riskAdjustments.slice();
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
              formik.setFieldValue("riskAdjustments", copiedValues);
            }
            if (r === "clear") {
              formik.setFieldValue("riskAdjustments", []);
            }
          }}
        />
      </div>
      <Toast
        toastKey="risk-adjustment-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `risk-adjustment-error`
            : `risk-adjustment-success`
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

export default RiskAdjustment;
