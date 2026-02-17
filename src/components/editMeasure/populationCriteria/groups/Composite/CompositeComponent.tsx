import React from "react";
import CompositeScoring from "./compositeScoring/CompositeScoring";
import AddedComponentsTable from "./compositeScoring/AddedComponentsTable";

export default function CompositeComponent({
  canEdit,
  formik,
  measure,
  components,
  submitComponentForm,
}) {
  return (
    <div>
      <div className="composite-component" data-testid="composite-component">
        <CompositeScoring
          canEdit={canEdit}
          formik={formik}
          measure={measure}
          components={components}
          submitComponentForm={submitComponentForm}
        />
      </div>
      <AddedComponentsTable components={components} />
    </div>
  );
}
