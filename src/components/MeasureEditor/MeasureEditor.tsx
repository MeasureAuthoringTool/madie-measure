import React, { SetStateAction, Dispatch } from "react";
import "twin.macro";
import "styled-components/macro";
import { MadieEditor } from "@madie/madie-editor";
import { Button } from "@madie/madie-components";
import { useLocalStorage } from "../../hooks/useLocalStorage";

const MeasureEditor = () => {
  const [editorVal, setEditorVal]: [string, Dispatch<SetStateAction<string>>] =
    useLocalStorage("editorVal", "");
  const handleMadieEditorValue = (val: string) => {
    setEditorVal(val);
  };

  const editorProps = {
    props: {
      handleValueChanges: (val: string) => handleMadieEditorValue(val),
      defaultValue: editorVal,
    },
  };

  return (
    <>
      <MadieEditor {...editorProps} />
      <div tw="mt-2" data-testid="measure-editor-actions">
        <Button buttonSize="md" buttonTitle="Save" variant="primary" />
        <Button
          tw="ml-2"
          buttonSize="md"
          buttonTitle="Cancel"
          variant="secondary"
        />
      </div>
    </>
  );
};

export default MeasureEditor;
