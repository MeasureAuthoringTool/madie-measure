import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import EditMeasure from "../editMeasure/EditMeasure";
import MeasureLanding from "../measureLanding/MeasureLanding";
import NotFound from "../notfound/NotFound";

export const routesConfig = [
  {
    children: [
      { path: "/", element: <MeasureLanding /> },
      { path: "/measures", element: <MeasureLanding /> },
      { path: "/measures/:measureId/edit/*", element: <EditMeasure /> },
      { path: "/404", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

const router = createBrowserRouter(routesConfig);

const MeasureBrowserRouter = () => {
  return (
    <div data-testid="browser-router">
      <RouterProvider router={router} />
    </div>
  );
};
export default MeasureBrowserRouter;
