import React from "react";
import {
  Route,
  Navigate,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import EditMeasure from "../editMeasure/EditMeasure";
import MeasureLanding from "../measureLanding/MeasureLanding";
import TimeoutHandler from "./TimeoutHandler";
import NotFound from "../notfound/NotFound";

const MeasureRoutes = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route path="/measures" element={<MeasureLanding />} />
      <Route path="/measures/:id/edit">
        <Route path="/measures/:id/edit" index element={<EditMeasure />} />
        <Route path="/measures/:id/edit/*" index element={<EditMeasure />} />
      </Route>
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" />} />
    </Route>
  )
);

const MeasureBrowserRouter = () => {
  return (
    <div data-testid="browser-router">
      <TimeoutHandler timeLeft={1500000} />
      <RouterProvider router={MeasureRoutes} />
    </div>
  );
};
export default MeasureBrowserRouter;
