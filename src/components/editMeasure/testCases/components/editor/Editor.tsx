import React from "react";
import { MadieJsonEditor } from "@madie/madie-editor";

export interface EditorPropsType {
  value: string;
  height: string;
  onChange?: (value: string) => void;
  parseDebounceTime?: number;
  inboundAnnotations?: unknown[];
  readOnly?: boolean;
}

const Editor = ({
  height,
  value,
  onChange,
  parseDebounceTime: _parseDebounceTime = 1500,
  inboundAnnotations: _inboundAnnotations,
  readOnly = false,
}: EditorPropsType) => {
  return (
    <div style={{ height: "calc(100% - 48px)" }}>
      <MadieJsonEditor
        value={value ?? ""}
        width="100%"
        height={height}
        readOnly={Boolean(readOnly)}
        ariaLabel="Test case editor"
        inputTestId="test-case-json-editor-input"
        testId="test-case-editor-wrapper"
        enableToggleSearchEvent
        onChange={onChange}
      />
    </div>
  );
};

export default Editor;
