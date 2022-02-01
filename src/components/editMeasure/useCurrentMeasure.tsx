import React, { useContext } from "react";
import MeasureContext, { MeasureContextHolder } from "./MeasureContext";

export default function useCurrentMeasure(): MeasureContextHolder {
  return useContext(MeasureContext);
}
