import React, { useState, useEffect } from "react";
import MetaDataWrapper from "../measureDetails/MetaDataWrapper";
import "../measureDetails/MeasureDetails.scss";
import {
  AutoComplete,
  MadieDiscardDialog,
} from "@madie/madie-design-system/dist/react";
import {
  measureStore,
  checkUserCanEdit,
  routeHandlerStore,
  PROGRAM_USE_CONTEXTS,
} from "@madie/madie-util";
import { useFormik } from "formik";

const ReviewInfo = () => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  const programUseContextOptions: string[] = PROGRAM_USE_CONTEXTS.map(
    (puc) => puc.display
  );
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const canEdit = checkUserCanEdit(
    measure?.createdBy,
    measure?.acls,
    measure?.measureMetaData?.draft
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      programUseContext: measure?.programUseContext || [],
    },
    onSubmit: (values) => {
      submitForm(values);
    },
  });
  const { resetForm } = formik;

  const onCancel = () => {
    resetForm();
    setDiscardDialogOpen(true);
  };

  const submitForm = (values) => {
    const submitMeasure = {
      ...measure,
      programUseContext: formik.values.programUseContext,
    };
    //update measure: to be implemmented
  };
  const { updateRouteHandlerState } = routeHandlerStore;
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  useEffect(() => {
    updateRouteHandlerState({
      canTravel: !formik.dirty,
      pendingRoute: "",
    });
  }, [formik.dirty]);

  return (
    <div id="review-info" data-testid="review-info">
      <MetaDataWrapper
        header="Review Info"
        canEdit={canEdit}
        dirty={formik.dirty}
        isValid={formik.isValid}
        handleSubmit={formik.handleSubmit}
        onCancel={onCancel}
      >
        <div
          id="program-use-context"
          data-testid="program-use-context"
          style={{ display: "flex", justifyContent: "left" }}
        >
          <div style={{ width: "25%" }}>
            <AutoComplete
              formControl={formik.getFieldProps("programUseContext")}
              id="programUseContext"
              dataTestId="programUseContext"
              label="Program Use Context"
              placeHolder="-"
              required={false}
              disabled={!canEdit}
              error={false}
              helperText=""
              multipleSelect={false}
              limitTags={1}
              options={programUseContextOptions}
              value={formik.values?.programUseContext?.display ?? null}
              onClose={() => {}}
              onChange={(id, value) => {
                if (value) {
                  formik.setFieldValue(
                    "programUseContext",
                    PROGRAM_USE_CONTEXTS.find((puc) => value === puc.display)
                  );
                } else {
                  formik.setFieldValue("programUseContext", []);
                }
              }}
            />
          </div>
        </div>
        <MadieDiscardDialog
          open={discardDialogOpen}
          onContinue={() => {
            resetForm();
            setDiscardDialogOpen(false);
          }}
          onClose={() => setDiscardDialogOpen(false)}
        />
      </MetaDataWrapper>
    </div>
  );
};

export default ReviewInfo;
