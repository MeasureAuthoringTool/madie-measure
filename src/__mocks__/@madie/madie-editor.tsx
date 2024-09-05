import React, { ChangeEvent } from "react";

export const parseContent = jest.fn().mockImplementation((content) => []);
export const validateContent = jest.fn().mockImplementation((content) => []);
export const synchingEditorCqlContent = jest.fn();
export const isUsingEmpty = jest.fn();

export function MadieEditor({ onChange, value, inboundAnnotations }) {
  return (
    <>
      <input
        data-testid="measure-editor"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
      />
      {inboundAnnotations && inboundAnnotations.length > 0 ? (
        <span>{inboundAnnotations.length} issues found with CQL</span>
      ) : (
        <span>CQL is valid</span>
      )}
    </>
  );
}

export function MadieTerminologyEditor({
  onChange,
  value,
  inboundAnnotations,
  handleCodeDelete,
  handleApplyLibrary,
  handleDeleteLibrary,
}) {
  const code = {
    codeSystem: "RXNORM",
    codeSystemOid: "2.16.840.1.113883.6.88",
    display: "1 ML digoxin 0.1 MG/ML Injection",
    fhirVersion: "05022022",
    name: "204504",
    status: "ACTIVE",
    svsVersion: "2022-05",
    versionIncluded: true,
  };

  const library = {
    name: "TestHelpers",
    alias: "Helpers",
    version: "1.0.000",
  };

  return (
    <>
      <input
        data-testid="measure-editor"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
      />
      {inboundAnnotations && inboundAnnotations.length > 0 ? (
        <span>{inboundAnnotations.length} issues found with CQL</span>
      ) : (
        <span>CQL is valid</span>
      )}
      <button data-testid="delete-code" onClick={() => handleCodeDelete(code)}>
        Remove code
      </button>

      <button
        data-testid="apply-library"
        onClick={() => handleApplyLibrary(library)}
      >
        Apply Library
      </button>

      <button
        data-testid="delete-included-library"
        onClick={() => handleDeleteLibrary(library)}
      >
        Delete Library
      </button>
    </>
  );
}
