import React, { useState, useEffect } from "react";
import "twin.macro";
import "styled-components/macro";
import {
  MadieDiscardDialog,
  Toast,
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
import "../../../details/MeasureDetails.scss";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import {
  Measure,
  MeasureReportType,
  SupplementalData as SupplementalDataModel,
} from "@madie/madie-models";
import MetaDataWrapper from "../../../details/MetaDataWrapper";
import MultipleSelectDropDown from "../../MultipleSelectDropDown";
import * as Yup from "yup";
import * as _ from "lodash";

const measureReportTypeOptions = [];
for (let t in MeasureReportType) {
  measureReportTypeOptions.push(MeasureReportType[t]);
}

const schema = Yup.object().shape({
  supplementalData: Yup.array().of(
    Yup.object().shape({
      definition: Yup.string(),
      includeInReportType: Yup.array()
        .of(Yup.string().optional())
        .optional()
        .nullable(),
    })
  ),
  supplementalDataDescription: Yup.string().optional(),
});

const SupplementalData = () => {
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
    validationSchema: schema,
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

  const sortedSupplementalData = _.cloneDeep(
    formik.values.supplementalData
  ).sort(
    (a, b) =>
      definitions?.indexOf(a.definition) - definitions?.indexOf(b.definition)
  );

  return (
    <MetaDataWrapper
      header="Supplemental Data"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={onCancel}
    >
      <div
        tw="flex flex-col"
        data-testid="supplementalDataDescriptionContainer"
      >
        <TextArea
          {...formik.getFieldProps("supplementalDataDescription")}
          name="supplementalDataDescription"
          id="supplementalDataDescription"
          disabled={!canEdit}
          placeholder="Description"
          data-testid="supplementalDataDescription"
          className="supplemental-data-description"
          label="Description"
        />
      </div>
      <div tw="flex mt-6 gap-x-3 w-full">
        <div tw="w-full">
          <MultipleSelectDropDown
            formControl={formik.getFieldProps("supplementalData")}
            value={formik.values.supplementalData?.map((sd) => sd?.definition)}
            id="supplemental-data"
            label="Definition"
            placeHolder={{ name: "", value: "" }}
            disabled={!canEdit}
            error={false}
            helperText=""
            multipleSelect={true}
            limitTags={1}
            options={definitions}
            onClose={() => {}}
            onChange={(e, v, r) => {
              if (r === "removeOption") {
                const copiedValues = _.cloneDeep(
                  formik.values.supplementalData
                );
                // find out what v is not present in copiedValues
                const filteredValues = copiedValues.filter((val) => {
                  return v.includes(val.definition);
                });
                formik.setFieldValue("supplementalData", filteredValues);
              }
              if (r === "selectOption") {
                const copiedValues = _.cloneDeep(
                  formik.values.supplementalData
                );
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
                formik.setFieldValue("supplementalData", copiedValues);
              }
              if (r === "clear") {
                formik.setFieldValue("supplementalData", []);
              }
            }}
          />
        </div>

        <div
          tw="w-full flex flex-col"
          data-testid="includeInReportType-container"
        >
          {sortedSupplementalData?.map(
            (supplementalData: SupplementalDataModel) => {
              const idx =
                formik.values.supplementalData?.indexOf(supplementalData);
              return (
                <MultipleSelectDropDown
                  key={supplementalData.definition}
                  value={supplementalData.includeInReportType ?? []}
                  id={`${supplementalData.definition}-include-in-report-type`}
                  label={`${supplementalData.definition} - Include in Report Type`}
                  placeHolder={[{ code: "", display: "" }]}
                  disabled={!canEdit}
                  error={false}
                  helperText=""
                  multipleSelect={true}
                  tw="mb-5"
                  limitTags={2}
                  textFieldInputProps={{
                    "aria-label": `${supplementalData.definition} - Include in Report Type`,
                  }}
                  options={measureReportTypeOptions}
                  onClose={() => {}}
                  defaultValue={[]}
                  onChange={(e, v, r) => {
                    const copied = _.cloneDeep(formik.values.supplementalData);
                    const current = copied.find(
                      (sd) => sd.definition === supplementalData.definition
                    );

                    if (r === "clear") {
                      current.includeInReportType = [];
                    } else {
                      current.includeInReportType = v;
                    }
                    formik.setFieldValue("supplementalData", copied);
                  }}
                />
              );
            }
          )}
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

export default SupplementalData;
