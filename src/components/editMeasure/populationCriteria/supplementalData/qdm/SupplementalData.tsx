import React, { useState, useEffect } from "react";
import "twin.macro";
import "styled-components/macro";
import {
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";

import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
  useMeasureServiceApi,
  useFeatureFlags,
} from "@madie/madie-util";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../../common/useFormikResetOnEvent";
import "../../../details/MeasureDetails.scss";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import { Measure } from "@madie/madie-models";
import MetaDataWrapper from "../../../details/MetaDataWrapper";
import MultipleSelectDropDown from "../../MultipleSelectDropDown";
import TextEditor from "../../groups/TextEditor";

export interface SupplementalDataProps {
  isTestCaseLocked: boolean;
  checkTestCasesLockStatus: Function;
  setAlertMessage: Function;
  measureLockedByAnotherUser: boolean;
}

const SupplementalData = (props: SupplementalDataProps) => {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  const [definitions, setDefinitions] = useState([]);
  const { updateMeasure } = measureStore;
  const measureServiceApi = useMeasureServiceApi();
  const featureFlags = useFeatureFlags();

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit =
    !props.isTestCaseLocked &&
    checkUserCanEdit(
      measure?.measureSet?.owner,
      measure?.measureSet?.acls,
      measure?.measureMetaData?.draft
    ) &&
    !props.measureLockedByAnotherUser;

  // Fetching definitions from CQL to populate dropdown
  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure?.cql).parse()
        .expressionDefinitions;
      const mappedDefinitions = definitions.map(({ name }) => {
        // avoid trying to parse when no quotes
        const isQuoted = /^(['"]).*\1$/.test(name);
        if (!isQuoted) {
          return name;
        }
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
  useFormikResetOnEvent(formik);
  const { resetForm } = formik;

  const handleSubmit = async (values) => {
    if (featureFlags.Locking && (await props.checkTestCasesLockStatus())) {
      handleToast(
        "danger",
        "This measure cannot be saved because changes to the Population Criteria will update test cases and one or more test cases are locked by another user.",
        true
      );
      formik.resetForm();
      return;
    }

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
  const MAX_LENGTH = 128;
  return (
    <MetaDataWrapper
      header="Supplemental Data"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <div tw="flex flex-col">
        <TextEditor
          label="Description"
          setFieldValue={formik.setFieldValue}
          readOnly={!canEdit}
          {...formik.getFieldProps("supplementalDataDescription")}
        />
      </div>
      <div tw="flex mt-6 w-2/4">
        <MultipleSelectDropDown
          formControl={formik.getFieldProps("supplementalData")}
          value={formik.values.supplementalData?.map((sd) => sd?.definition)}
          id="supplemental-data"
          label="Definition"
          placeHolder={{ name: "", value: "" }}
          readOnly={!canEdit}
          error={false}
          helperText=""
          multipleSelect={true}
          limitTags={1}
          options={definitions}
          getOptionDisabled={() =>
            formik?.values?.supplementalData?.length >= MAX_LENGTH
          }
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
              if (v?.length <= MAX_LENGTH) {
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
            }
            if (r === "clear") {
              formik.setFieldValue("supplementalData", []);
            }
          }}
        />
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

export default SupplementalData;
