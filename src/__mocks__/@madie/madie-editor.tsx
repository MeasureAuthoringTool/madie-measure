import React, { ChangeEvent } from "react";

export function MadieEditor({ onChange, value }) {
  return (
    <input
      data-testid="measure-editor"
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      }}
    />
  );
}
