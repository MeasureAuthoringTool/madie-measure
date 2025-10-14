import React, { useEffect, useState } from "react";
import "twin.macro";
import "styled-components/macro";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../../common/useFormikResetOnEvent";
import useMeasureServiceApi from "../../../../../api/useMeasureServiceApi";
import {
  checkUserCanEdit,
  measureStore,
  routeHandlerStore,
  useFeatureFlags,
} from "@madie/madie-util";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import MetaDataWrapper from "../../../details/MetaDataWrapper";
import MultipleSelectDropDown from "../../MultipleSelectDropDown";
import {
  MadieDiscardDialog,
  Toast,
} from "@madie/madie-design-system/dist/react";
import {
  Measure,
  MeasureReportType,
  RiskAdjustment as RiskAdjustmentModel,
} from "@madie/madie-models";
import * as Yup from "yup";
import * as _ from "lodash";
import TextEditor from "../../groups/TextEditor";

const measureReportTypeOptions = [];
for (let t in MeasureReportType) {
  measureReportTypeOptions.push(MeasureReportType[t]);
}

const schema = Yup.object().shape({
  riskAdjustment: Yup.array().of(
    Yup.object().shape({
      definition: Yup.string(),
      includeInReportType: Yup.array()
        .of(Yup.string().optional())
        .optional()
        .nullable(),
    })
  ),
  riskAdjustmentDescription: Yup.string().optional(),
});

export interface RiskAdjustmentProps {
  isTestCaseLocked: boolean;
  checkTestCasesLockStatus: Function;
  setAlertMessage: Function;
}
const RiskAdjustment = (props: RiskAdjustmentProps) => {
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
    );

  // Fetching definitions from CQL to populate dropdown
  useEffect(() => {
    if (measure?.cql) {
      const definitions = new CqlAntlr(measure?.cql).parse()
        .expressionDefinitions;
      const mappedDefinitions = definitions.map(({ name }) => {
        // avoid trying to parse when no quotes for function
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
      riskAdjustments: measure?.riskAdjustments || [],
      riskAdjustmentDescription: measure?.riskAdjustmentDescription || "",
    },
    validationSchema: schema,
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
      return;
    }

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

  const sortedRiskAdjustments = _.cloneDeep(formik.values.riskAdjustments).sort(
    (a, b) =>
      definitions?.indexOf(a.definition) - definitions?.indexOf(b.definition)
  );
  const MAX_LENGTH = 128;
  return (
    <MetaDataWrapper
      header="Risk Adjustment"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <div tw="flex flex-col" data-testid="risk-adjustment">
        <TextEditor
          label="Description"
          setFieldValue={formik.setFieldValue}
          readOnly={!canEdit}
          {...formik.getFieldProps("riskAdjustmentDescription")}
        />
      </div>
      <div tw="flex mt-6 gap-x-3 w-full">
        <div tw="w-full">
          <MultipleSelectDropDown
            formControl={formik.getFieldProps("riskAdjustments")}
            value={formik.values.riskAdjustments?.map((ra) => ra?.definition)}
            id="risk-adjustment"
            label="Definition"
            placeHolder={{ name: "", value: "" }}
            required={false}
            readOnly={!canEdit}
            error={false}
            helperText=""
            multipleSelect={true}
            limitTags={1}
            options={definitions}
            getOptionDisabled={() =>
              formik?.values?.riskAdjustments?.length >= MAX_LENGTH
            }
            onClose={() => {}}
            onChange={(e, v, r) => {
              if (r === "removeOption") {
                const copiedValues = formik.values.riskAdjustments.slice();
                // find out what v is not present in copiedValues
                const filteredValues = copiedValues.filter((val) => {
                  return v.includes(val.definition);
                });
                formik.setFieldValue("riskAdjustments", filteredValues);
              }
              if (r === "selectOption") {
                if (v?.length <= MAX_LENGTH) {
                  const copiedValues = formik.values.riskAdjustments.slice();
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
                    includeInReportType: [...measureReportTypeOptions],
                  });
                  formik.setFieldValue("riskAdjustments", copiedValues);
                }
              }
              if (r === "clear") {
                formik.setFieldValue("riskAdjustments", []);
              }
            }}
          />
        </div>

        <div
          tw="w-full flex flex-col"
          data-testid="includeInReportType-container"
        >
          {sortedRiskAdjustments?.map((riskAdjustment: RiskAdjustmentModel) => {
            const idx = formik.values.riskAdjustments?.indexOf(riskAdjustment);
            return (
              <MultipleSelectDropDown
                key={riskAdjustment.definition}
                value={riskAdjustment.includeInReportType ?? []}
                id={`${riskAdjustment.definition}-include-in-report-type`}
                label={`${riskAdjustment.definition} - Include in Report Type`}
                placeHolder={[{ code: "", display: "" }]}
                readOnly={!canEdit}
                error={false}
                helperText=""
                multipleSelect={true}
                tw="mb-5"
                limitTags={2}
                textFieldInputProps={{
                  "aria-label": `${riskAdjustment.definition} - Include in Report Type`,
                }}
                options={measureReportTypeOptions}
                onClose={() => {}}
                defaultValue={[]}
                onChange={(e, v, r) => {
                  const copied = _.cloneDeep(formik.values.riskAdjustments);
                  const current = copied.find(
                    (sd) => sd.definition === riskAdjustment.definition
                  );

                  if (r === "clear") {
                    current.includeInReportType = [];
                  } else {
                    current.includeInReportType = v;
                  }
                  formik.setFieldValue("riskAdjustments", copied);
                }}
              />
            );
          })}
        </div>
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
