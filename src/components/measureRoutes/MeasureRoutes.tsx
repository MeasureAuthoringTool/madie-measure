import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import EditMeasure from "../editMeasure/EditMeasure";
import MeasureLanding from "../measureLanding/MeasureLanding";
import TimeoutHandler from "./TimeoutHandler";
import NotFound from "../notfound/NotFound";

export const routesConfig = [
  {
    children: [
      { path: "/", element: <MeasureLanding /> },
      { path: "/measures", element: <MeasureLanding /> },
      { path: "/measures/:id/edit/*", element: <EditMeasure /> },
      { path: "/404", element: <NotFound /> },
      { path: "*", element: <NotFound /> },
    ],
  },
];

const router = createBrowserRouter(routesConfig);

const MeasureBrowserRouter = () => {
  return (
    <div data-testid="browser-router">
      <TimeoutHandler timeLeft={1500000} />
      <RouterProvider router={router} />
    </div>
  );
};
export default MeasureBrowserRouter;
