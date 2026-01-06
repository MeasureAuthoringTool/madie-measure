import React from "react";
import CompareVersionPanel from "./CompareVersionPanel";
import { Measure } from "@madie/madie-models";

interface CqlComparisonPanelProps {
  measure: Measure;
  side: "old" | "new";
}

const CqlComparisonPanel = ({ measure, side }: CqlComparisonPanelProps) => (
  <CompareVersionPanel measure={measure} side={side} />
);

export default CqlComparisonPanel;
