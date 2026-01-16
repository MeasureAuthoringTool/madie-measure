import React from "react";
import { ChangeObject, diffWords } from "diff";

interface MeasureNameDiffProps {
  oldMeasureName: string;
  newMeasureName: string;
}

// Returns true if a space should be added between two diff tokens to prevent words from merging together.
const needsSpaceBetween = (
  prev: ChangeObject<string>,
  curr: ChangeObject<string>
) => {
  if (!prev || !curr) return false;

  return !prev.value.endsWith(" ") && !curr.value.startsWith(" ");
};

const MeasureNameDiff = ({
  oldMeasureName,
  newMeasureName,
}: MeasureNameDiffProps) => {
  const diff: ChangeObject<string>[] = diffWords(
    oldMeasureName,
    newMeasureName
  );

  return (
    <>
      {diff.map((part, index) => {
        const prev = diff[index - 1];
        const insertSpace = needsSpaceBetween(prev, part);

        const content = (() => {
          if (part.added) {
            return (
              <span
                style={{
                  backgroundColor: "#ddfbe6",
                  color: "#4d7e23",
                  fontWeight: 500,
                }}
                aria-label="Added text"
                data-testid={`diff-added-${index}`}
              >
                {" "}
                ++ <span>{part.value}</span>
              </span>
            );
          }

          if (part.removed) {
            return (
              <span
                style={{
                  backgroundColor: "#fbe9eb",
                  color: "#ae1c1c",
                  fontWeight: 500,
                }}
                aria-label="Removed text"
                data-testid={`diff-removed-${index}`}
              >
                --{" "}
                <span style={{ textDecoration: "line-through" }}>
                  {part.value}
                </span>
              </span>
            );
          }

          return (
            <span data-testid={`diff-unchanged-${index}`}>{part.value}</span>
          );
        })();

        return (
          <React.Fragment key={index}>
            {insertSpace && " "}
            {content}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default MeasureNameDiff;
