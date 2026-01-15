import React, { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop, Chip } from "@mui/material";
import { Measure } from "@madie/madie-models";
import { useMeasureServiceApi } from "@madie/madie-util";
import { MadieSpinner } from "@madie/madie-design-system/dist/react";
import "./HumanReadableDiffViewer.scss";

interface HumanReadableDiffViewerProps {
  oldMeasure: Measure;
  newMeasure: Measure;
  setDifferences: React.Dispatch<React.SetStateAction<number>>;
}

const HumanReadableDiffViewer = ({
  oldMeasure,
  newMeasure,
  setDifferences,
}: HumanReadableDiffViewerProps) => {
  const measureServiceApi = useRef(useMeasureServiceApi()).current;

  const [loading, setLoading] = useState(true);
  const [humanReadableDiffResult, setHumanReadableDiffResult] =
    useState<any>(null);
  const [error, setError] = useState<string>("");

  const getHumanReadableDiff = useCallback(
    async (oldMeasureId: string, newMeasureId: string) => {
      setLoading(true);
      setHumanReadableDiffResult(null);
      setError("");

      try {
        const humanReadableDiffResult =
          await measureServiceApi.getHumanReadableDiff(
            oldMeasureId,
            newMeasureId
          );
        setHumanReadableDiffResult(humanReadableDiffResult);
        setDifferences(humanReadableDiffResult?.differences?.length || 0);
      } catch (e) {
        setDifferences(0);
        setError("Unable to retrieve differences.");
      } finally {
        setLoading(false);
      }
    },
    [measureServiceApi]
  );

  useEffect(() => {
    if (oldMeasure?.id && newMeasure?.id) {
      getHumanReadableDiff(oldMeasure.id, newMeasure.id);
    }
  }, [oldMeasure?.id, newMeasure?.id, getHumanReadableDiff]);

  return (
    <div
      style={{ position: "relative", minHeight: "300px" }}
      data-testid="human-readable-diff-viewer"
    >
      {!loading && !error && (
        <table className="hrdv-table">
          <thead>
            <tr>
              <th aria-labelledby="field-header" tabIndex={0}>
                Field
              </th>
              <th aria-labelledby="old-version-header" tabIndex={0}>
                Version {oldMeasure.version}{" "}
                {oldMeasure.measureMetaData?.draft && (
                  <Chip
                    label="Draft"
                    className="draft-chip"
                    data-testid={`draft-chip-${oldMeasure.version}`}
                  />
                )}
              </th>
              <th aria-labelledby="new-version-header" tabIndex={0}>
                Version {newMeasure.version}
                {"   "}
                {newMeasure.measureMetaData?.draft && (
                  <Chip
                    label="Draft"
                    className="draft-chip"
                    data-testid={`draft-chip-${newMeasure.version}`}
                  />
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {humanReadableDiffResult?.differences?.length > 0 ? (
              humanReadableDiffResult.differences.map(
                (diff: any, idx: number) => (
                  <tr key={idx}>
                    <td
                      data-testid={`row-${idx}-${diff.field}`}
                      aria-labelledby={`row-${idx}-${diff.field}`}
                      tabIndex={0}
                    >
                      {diff.field}
                    </td>
                    <td
                      data-testid={`row-${idx}-oldValue`}
                      aria-labelledby={`row-${idx}-oldValue`}
                      tabIndex={0}
                    >
                      <span
                        dangerouslySetInnerHTML={{ __html: diff.oldValue }}
                      />
                    </td>
                    <td
                      data-testid={`row-${idx}-newValue`}
                      aria-labelledby={`row-${idx}-newValue`}
                      tabIndex={0}
                    >
                      <span
                        dangerouslySetInnerHTML={{ __html: diff.newValue }}
                      />
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={3}
                  style={{ textAlign: "center" }}
                  aria-labelledby="no-differences"
                >
                  There are no differences in the Human Readable files for these
                  measures
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

export default HumanReadableDiffViewer;
