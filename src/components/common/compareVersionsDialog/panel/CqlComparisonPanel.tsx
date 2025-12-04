import React from "react";
import { Typography } from "@mui/material";
import CompareVersionPanel from "./CompareVersionPanel";
import { Measure } from "@madie/madie-models";

interface CqlComparisonPanelProps {
  measure: Measure;
  side: "old" | "new";
}

const CqlComparisonPanel = ({ measure, side }: CqlComparisonPanelProps) => (
  <CompareVersionPanel measure={measure} side={side}>
    <Typography>CQL coming soon</Typography>
  </CompareVersionPanel>
);

export default CqlComparisonPanel;
