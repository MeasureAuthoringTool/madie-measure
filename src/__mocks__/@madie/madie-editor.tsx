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
  handleApplyCode,
  handleApplyLibrary,
  handleEditLibrary,
  handleDeleteLibrary,
  handleApplyParameter,
  handleParameterEdit,
  handleParameterDelete,
  handleApplyFunction,
  handleFunctionDelete,
  handleFunctionEdit,
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

  const editedLibrary = {
    name: "TestHelpers",
    version: "1.0.000",
    alias: "EditedHelpers",
  };

  const parameter = {
    parameterName: "Measurement Period",
    expression: "Interval<System.DateTime",
  };
  const parameterToApply = {
    parameterName: "Test Measurement Period",
    expression: "Interval<System.DateTime>",
  };

  const functionToDelete = {
    functionName: "MeasureObservation",
    fluentFunction: false,
    functionsArguments: [{ argumentName: "e", dataType: "Encounter" }],
    expressionValue: "define function MeasureObservation(e Encounter):\n  2",
    expression: "define function MeasureObservation(e Encounter):\n  2",
  };

  const functionToEdit = {
    functionName: "MeasureObservation1",
    fluentFunction: false,
    functionsArguments: [{ argumentName: "e", dataType: "Encounter" }],
    expressionValue: "define function MeasureObservation(e Encounter):\n  2",
    expression: "define function MeasureObservation(e Encounter):\n  2",
  };

  return (
    <>
      <textarea
        data-testid="measure-editor"
        value={value}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
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

      <button data-testid="apply-code" onClick={() => handleApplyCode(code)}>
        Apply Code
      </button>

      <button
        data-testid="apply-library"
        onClick={() => handleApplyLibrary(library)}
      >
        Apply Library
      </button>

      <button
        data-testid="edit-included-library"
        onClick={() => handleEditLibrary(library, editedLibrary)}
      >
        Edit Library
      </button>

      <button
        data-testid="delete-included-library"
        onClick={() => handleDeleteLibrary(library)}
      >
        Delete Library
      </button>

      <button
        data-testid="apply-parameter"
        onClick={() => handleApplyParameter(parameter)}
      >
        Apply Parameter
      </button>
      <button
        data-testid="edit-parameter"
        onClick={() => handleParameterEdit(parameter, parameterToApply)}
      >
        Edit Parameter
      </button>
      <button
        data-testid="delete-parameter"
        onClick={() => handleParameterDelete(parameter)}
      >
        Delete Parameter
      </button>
      <button
        data-testid="apply-function"
        onClick={() => handleApplyFunction(functionToDelete)}
      >
        Apply Function
      </button>
      <button
        data-testid="delete-function"
        onClick={() => handleFunctionDelete(functionToDelete)}
      >
        Delete Function
      </button>
      <button
        data-testid="edit-function"
        onClick={() =>
          handleFunctionEdit(
            functionToEdit,
            "define function MeasureObservation1(encounter Encounter):\n  2"
          )
        }
      >
        Edit Function
      </button>
    </>
  );
}
