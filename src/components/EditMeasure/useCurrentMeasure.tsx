import React, { useContext } from "react";
import MeasureContext from "./MeasureContext";
import Measure from "../../models/Measure";

export default function useCurrentMeasure() {
  const measure: Measure = useContext(MeasureContext);
  return measure;
}
