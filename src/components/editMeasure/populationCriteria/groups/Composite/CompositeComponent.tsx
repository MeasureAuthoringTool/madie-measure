import React, { useCallback, useEffect, useRef, useState } from "react";
import CompositeScoring from "./compositeScoring/CompositeScoring";
import AddedComponentsTable from "./compositeScoring/AddedComponentsTable";
import { Component, Measure } from "@madie/madie-models";
import { useMeasureServiceApi } from "@madie/madie-util";
import _ from "lodash";

export default function CompositeComponent({
  canEdit,
  formik,
  measure,
  components,
  submitComponentForm,
}: {
  canEdit: boolean;
  components: Component[];
  measure: Measure;
  formik: any;
  submitComponentForm: (any) => void;
}) {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;
  const [componentDetails, setComponentDetails] = useState([]);

  const fetchMeasuresForComponents = useCallback(async () => {
    if (!components?.length) {
      setComponentDetails([]);
      return;
    }
    try {
      // multiple components can share the same measureId (different groups).
      // we only need each measureId once.
      const componentMeasureIds = _.uniq(components.map((c) => c.measureId));

      const results = await measureServiceApi.fetchMeasuresByIds(
        componentMeasureIds
      );
      setComponentDetails(results);
    } catch (err) {
      console.error(err);
    }
  }, [components, measureServiceApi]);

  useEffect(() => {
    fetchMeasuresForComponents();
  }, [fetchMeasuresForComponents]);

  const handleComponentDelete = (componentId: string) => {
    const updatedComponents = components.filter(
      (component) => component.measureId !== componentId
    );
    submitComponentForm(updatedComponents);
  };

  return (
    <div>
      <div className="composite-component" data-testid="composite-component">
        <CompositeScoring
          canEdit={canEdit}
          formik={formik}
          measure={measure}
          components={componentDetails}
          submitComponentForm={submitComponentForm}
        />
      </div>
      <AddedComponentsTable
        components={componentDetails}
        onDeleteComponent={handleComponentDelete}
      />
    </div>
  );
}
