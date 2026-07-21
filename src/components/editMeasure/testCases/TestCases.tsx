import React, { lazy, useMemo, useState, useEffect } from "react";
import { isFhirModel, Measure } from "@madie/madie-models";
import { measureStore } from "@madie/madie-util";

const TestCases = () => {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // If no model match, import an empty file to avoid calling validations early.
  // Unsure of a more robust way to actively wait for the subscription of measure from dispatch at this time.
  const TestCaseRoutesComponent = useMemo(
    () =>
      lazy(() => {
        if (measure?.model.includes("QDM")) {
          return import("./components/routes/qdm/TestCaseRoutes");
        }
        if (isFhirModel(measure?.model)) {
          return import("./components/routes/qiCore/TestCaseRoutes");
        } else {
          return import("./components/routes/EmptyRoutes");
        }
      }),
    [measure?.model]
  );
  /**
   *
   *         if (measure?.model.includes("QI-Core")) {
   *           return import("./components/routes/qiCore/TestCaseRoutes");
   *         }
   */
  return <TestCaseRoutesComponent />;
};

export default TestCases;
