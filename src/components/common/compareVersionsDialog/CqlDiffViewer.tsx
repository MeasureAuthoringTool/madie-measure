import React, { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop } from "@mui/material";
import { Measure } from "@madie/madie-models";
import { useMeasureServiceApi } from "@madie/madie-util";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";
import ReactDiffViewer from "react-diff-viewer-continued";

interface CqlDiffViewerProps {
  oldMeasure: Measure;
  newMeasure: Measure;
}

const styles = {
  contentText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
  codeFoldContent: {
    whiteSpace: "pre-wrap",
  },
};

const CqlDiffViewer = ({ oldMeasure, newMeasure }: CqlDiffViewerProps) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [loading, setLoading] = useState(true);
  const [cqlDiffResult, setCqlDiffResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const getCqlDiff = useCallback(
    async (oldMeasureId: string, newMeasureId: string) => {
      setLoading(true);
      setCqlDiffResult(null);
      setError("");

      try {
        const cqlDiffResult = await measureServiceApi.getCqlDiff(
          oldMeasureId,
          newMeasureId
        );
        setCqlDiffResult(cqlDiffResult);
      } catch (e) {
        setError(
          "Could not get CQL diff for these two measures instances. Contact Help Desk for additional information."
        );
      } finally {
        setLoading(false);
      }
    },
    [measureServiceApi]
  );

  useEffect(() => {
    if (oldMeasure?.id && newMeasure?.id) {
      getCqlDiff(oldMeasure.id, newMeasure.id);
    }
  }, [oldMeasure?.id, newMeasure?.id, getCqlDiff]);

  return (
    <div style={{ position: "relative", minHeight: "300px" }}>
      {!loading && !error && (
        <ReactDiffViewer
          oldValue={cqlDiffResult?.comparisons?.[0]?.oldText}
          newValue={cqlDiffResult?.comparisons?.[0]?.newText}
          splitView={true}
          styles={styles}
        />
      )}

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
  );
};

export default CqlDiffViewer;
