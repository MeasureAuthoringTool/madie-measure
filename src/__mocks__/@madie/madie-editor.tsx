import React from "react";

export function MadieEditor({ onChange }) {
  const returnValue = "library testCql version '1.0.000'";
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid="measure-editor"
      onClick={() => {
        onChange(returnValue);
      }}
    >
      {returnValue}
    </div>
  );
}
