import React, { ChangeEvent } from "react";

export const parseContent = jest.fn().mockImplementation((content) => []);

export const translateContentCqlToElm = jest
  .fn()
  .mockImplementation((content) => []);
export const validateContentCodes = jest
  .fn()
  .mockImplementation((customCqlCodes, loggedInUMLS) => []);
export const validateContentValueSets = jest
  .fn()
  .mockImplementation((valuesetsArray, loggedInUMLS) => []);

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
