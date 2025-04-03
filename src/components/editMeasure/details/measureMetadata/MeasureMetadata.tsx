import React, { useCallback, useEffect, useState } from "react";
import { useFormik } from "formik";
import useFormikResetOnEvent from "../../../common/useFormikResetOnEvent";
import { Typography } from "@mui/material";
import useMeasureServiceApi from "../../../../api/useMeasureServiceApi";
import getInitialValues, { setMeasureMetadata } from "./MeasureMetadataHelper";
import RichTextEditor from "../../RichTextEditor";
import Gapcursor from '@tiptap/extension-gapcursor'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { EditorContent, EditorProvider, useEditor } from '@tiptap/react'
import {
  measureStore,
  routeHandlerStore,
  checkUserCanEdit,
} from "@madie/madie-util";
import {
  Button,
  MadieDiscardDialog,
  Toast,
  TextArea,
} from "@madie/madie-design-system/dist/react";
import _ from "lodash";
import StarterKit from "@tiptap/starter-kit";

export interface MeasureMetadataProps {
  measureMetadataId?: String;
  measureMetadataType?: String;
  header?: String;
  setErrorMessage: Function;
  required?: boolean;
}

const testData =  `<h3 style="text-align:center">
Test H3
</h3>
<p style="text-align:center">
Sample text for a centered paragraph.<br>
Another example sentence with a <mark>highlighted section</mark>.<br>
Additional text to demonstrate line breaks.<br>
Placeholder content for formatting purposes.
</p>
<p style="text-align:center">
A second paragraph with centered text.<br>
Another example of a sentence breaking into multiple lines.<br>
Text styling and formatting for testing.<br>
More placeholder text for layout purposes.
</p>
<p style="text-align:center">
Short sample text for emphasis.<br>
Additional placeholder content.<br>
Example text to visualize structure.<br>
A final line to complete the section.
</p>

<script>alert('XSS!')</script>
<img src="x" onerror="alert('XSS!')">


<table>
   <tbody>
     <tr>
       <th>Name</th>
       <th colspan="3">Description</th>
     </tr>
     <tr>
       <td>Cyndi Lauper</td>
       <td>Singer</td>
       <td>Songwriter</td>
       <td>Actress</td>
     </tr>
   </tbody>
 </table>
`

export default function MeasureMetadata(props: MeasureMetadataProps) {
  const { setErrorMessage, required } = props;
  const { measureMetadataId, measureMetadataType, header } = props;
  const typeLower = _.kebabCase(measureMetadataType.toLowerCase());

  const { updateMeasure } = measureStore;
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  let measureMetaData = measure?.measureMetaData || {};
  const measureServiceApi = useMeasureServiceApi();
  // toast utilities
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

  const canEdit = checkUserCanEdit(
    measure?.measureSet?.owner,
    measure?.measureSet?.acls,
    measure?.measureMetaData?.draft
  );
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { genericField: getInitialValues(measure, typeLower) },
    onSubmit: (values) => {
      console.log('submitting', values.genericField.trim())
      console.log('values are', values)
      submitForm(values.genericField.trim());
    },
  });
  useFormikResetOnEvent(formik);


  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  useEffect(() => {
    if (!getInitialValues(measure, typeLower)) {
      formik.setFieldValue("genericField", "");
    }
  }, [measureMetadataType]);

  const { resetForm } = formik;
  const submitForm = (genericField: string) => {
    measure.measureMetaData = { ...measureMetaData };
    setMeasureMetadata(measure, typeLower, genericField);

    measureServiceApi
      .updateMeasure(measure)
      .then(() => {
        handleToast(
          "success",
          `Measure ${measureMetadataType} Information Saved Successfully`,
          true
        );
        updateMeasure(measure);
      })
      .catch((reason) => {
        const message = `Error updating measure "${measure.measureName}"`;
        setErrorMessage(message);
      });
  };


  const addTestData = () => {
    formik.setFieldValue("genericField", testData);
  }
  const handleFormikManualChange = (val) => {
    formik.setFieldValue("genericField", val);
    formik.setFieldTouched("genericField");
  }

  return (
    <form
      id="measure-details-form"
      onSubmit={formik.handleSubmit}
      data-testid={`measure${measureMetadataType}`}
    >
      <button type="button" onClick={addTestData}>Add data</button>
      <div className="content">
        <div className="subTitle">
          <h2>{header}</h2>
          {required ? (
            <Typography
              style={{
                fontSize: 14,
                fontWeight: 300,
                fontFamily: "Rubik",
                float: "right",
              }}
            >
              <span style={{ color: "#D92F2F", marginRight: 3 }}>*</span>
              Indicates required field
            </Typography>
          ) : (
            // spacing element to prevent discrepency.
            <div style={{ height: 15, marginBottom: 6 }} />
          )}
        </div>
        <RichTextEditor 
          onChange={handleFormikManualChange}
          content={formik.initialValues.genericField}
        />
      </div>
      {canEdit && (
        <div className="form-actions">
          <Button
            variant="outline"
            disabled={!formik.dirty}
            data-testid="cancel-button"
            onClick={() => setDiscardDialogOpen(true)}
            style={{ marginTop: 20, float: "right", marginRight: 32 }}
          >
            Discard Changes
          </Button>
          <Button
            disabled={!(formik.isValid && formik.dirty)}
            type="submit"
            variant="cyan"
            data-testid={`measure${measureMetadataType}Save`}
            style={{ marginTop: 20, float: "right" }}
          >
            Save
          </Button>
        </div>
      )}
      <Toast
        toastKey="measure-information-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? `measure${measureMetadataType}Error`
            : `measure${measureMetadataType}Success`
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
    </form>
  );
}
