import React from "react";
import { BrowserRouter } from "react-router-dom";
import MeasureLanding from "./MeasureLanding/MeasureLanding";

export default function Home() {
  return (
    <BrowserRouter>
      <MeasureLanding />
    </BrowserRouter>
  );
}
