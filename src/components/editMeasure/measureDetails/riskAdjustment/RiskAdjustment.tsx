import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import {
  measureStore,
  // routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import { CqlAntlr } from "@madie/cql-antlr-parser/dist/src";
import MetaDataWrapper from "../MetaDataWrapper";
import MultipleSelectDropDown from "../../../measureGroups/MultipleSelectDropDown";
import RiskDefinition from "./RiskDefinition";
import "./RiskAdjustment.scss";

const RiskAdjustment = () => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const [definitions, setDefinitions] = useState([]);
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

  const canEdit = checkUserCanEdit(
    measure?.createdBy,
    measure?.acls,
    measure?.measureMetaData?.draft
  );

  /*
        risk adjustment will be a list of objects
        [
            {
                definition: "string",
                description: "string"
            }
        ]

    */
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      riskAdjustment: measure?.measureMetaData?.riskAdjustment || [],
    },
    onSubmit: (values) => {
      //   submitForm(values);
    },
  });
  const { resetForm } = formik;
  const handleDescriptionChange = (v, definition) => {
    const copiedValues = formik.values.riskAdjustment;
    for (let i = 0; i < copiedValues.length; i++) {
      if (copiedValues[i].definition === definition) {
        copiedValues[i].description = v;
      }
    }
    formik.setFieldValue("riskAdjustment", copiedValues);
  };

  return (
    <MetaDataWrapper
      header="Risk Adjustment"
      canEdit={canEdit}
      dirty={formik.dirty}
      isValid={formik.isValid}
      handleSubmit={formik.handleSubmit}
      onCancel={resetForm}
    >
      <div id="risk-adjustment" data-testid="risk-adjustment">
        {/* 521 left side */}
        <div className="left">
          <MultipleSelectDropDown
            formControl={formik.getFieldProps("riskAdjustment")}
            value={formik.values.riskAdjustment.map((risk) => risk?.definition)}
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
              // const { textContent } = e.target; // this doesn't work because of our check marks.
              if (r === "removeOption") {
                const copiedValues = formik.values.riskAdjustment.slice();
                // find out what v is not present in copiedValues
                const filteredValues = copiedValues.filter((val) => {
                  return v.includes(val.definition);
                });
                formik.setFieldValue("riskAdjustment", filteredValues);
              }
              if (r === "selectOption") {
                const copiedValues = formik.values.riskAdjustment.slice();
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
                formik.setFieldValue("riskAdjustment", copiedValues);
              }
              if (r === "clear") {
                formik.setFieldValue("riskAdjustment", []);
              }
            }}
          />
        </div>
        <div className="right">
          {formik.values.riskAdjustment.map((risk, i) => (
            <RiskDefinition
              handleDescriptionChange={handleDescriptionChange}
              risk={risk}
              key={`${risk.definition}-description-${i}`}
            />
          ))}
        </div>
      </div>
    </MetaDataWrapper>
  );
};

export default RiskAdjustment;
