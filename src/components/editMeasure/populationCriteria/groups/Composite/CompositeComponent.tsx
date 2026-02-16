import React from "react";
import CompositeScoring from "./compositeScoring/CompositeScoring";

export default function CompositeComponent({
  canEdit,
  formik,
  measure,
  components,
  submitComponentForm,
}) {
  return (
    <div className="composite-component" data-testid="composite-component">
      <CompositeScoring
        canEdit={canEdit}
        formik={formik}
        measure={measure}
        components={components}
        submitComponentForm={submitComponentForm}
      />
    </div>
  );
}
