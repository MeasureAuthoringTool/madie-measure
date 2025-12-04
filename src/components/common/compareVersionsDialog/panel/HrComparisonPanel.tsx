import React, { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop } from "@mui/material";
import CompareVersionPanel from "./CompareVersionPanel";
import { Measure } from "@madie/madie-models";
import { useMeasureServiceApi } from "@madie/madie-util";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";

interface HrComparisonPanelProps {
  measure: Measure;
  side: "old" | "new";
}

const HrComparisonPanel = ({ measure, side }: HrComparisonPanelProps) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [loading, setLoading] = useState(true);
  const [hr, setHr] = useState<string>("");
  const [error, setError] = useState<string>("");

  const getHumanReadable = useCallback(
    async (measureId: string) => {
      setLoading(true);
      setHr("");
      setError("");

      try {
        const hrResult = await measureServiceApi.fetchHumanReadable(measureId);
        setHr(hrResult);
      } catch (e) {
        setError(
          "The human readable file is not available for this measure. Contact Help Desk for additional information."
        );
      } finally {
        setLoading(false);
      }
    },
    [measureServiceApi]
  );

  useEffect(() => {
    if (measure?.id) {
      getHumanReadable(measure.id);
    }
  }, [measure?.id, getHumanReadable]);

  return (
    <CompareVersionPanel measure={measure} side={side}>
      <div style={{ position: "relative", minHeight: "300px" }}>
        {!loading && !error && <div dangerouslySetInnerHTML={{ __html: hr }} />}

        {error && <p>{error}</p>}

        <Backdrop
          open={loading}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 2,
            color: "#fff",
          }}
        >
          <MadieSpinner style={{ height: 40, width: 40 }} />
        </Backdrop>
      </div>
    </CompareVersionPanel>
  );
};

export default HrComparisonPanel;
