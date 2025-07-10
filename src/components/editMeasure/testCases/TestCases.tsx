import React, { lazy, Suspense, useEffect, useState } from "react";
import { Measure } from "@madie/madie-models";
import { measureStore } from "@madie/madie-util";

// Stable lazy imports
const QdmTestCaseRoutes = lazy(() => import("./components/routes/qdm/TestCaseRoutes"));
const QiCoreTestCaseRoutes = lazy(() => import("./components/routes/qiCore/TestCaseRoutes"));
const EmptyRoutes = lazy(() => import("./components/routes/EmptyRoutes"));

const TestCases = () => {
  const [measure, setMeasure] = useState<Measure>(measureStore.state);

  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => subscription.unsubscribe();
  }, []);

  // Pick which component to render
  const TestCaseRoutesComponent = measure?.model?.includes("QDM")
    ? QdmTestCaseRoutes
    : measure?.model?.includes("QI-Core")
    ? QiCoreTestCaseRoutes
    : EmptyRoutes;

  return (
    <Suspense fallback={<div>Loading test cases…</div>}>
      <TestCaseRoutesComponent />
    </Suspense>
  );
};

export default TestCases;
