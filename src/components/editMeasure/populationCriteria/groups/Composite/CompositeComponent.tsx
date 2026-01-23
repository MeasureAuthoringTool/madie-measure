import React from "react";
import CompositeScoring from "./compositeScoring/CompositeScoring";

export default function CompositeComponent({ canEdit, formik }) {
  return (
    <div className="composite-component" data-testid="composite-component">
      <CompositeScoring canEdit={canEdit} formik={formik} />
    </div>
  );
}
