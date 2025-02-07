import React, { useRef, useState, useEffect, useCallback } from "react";
import AceEditor from "react-ace";
import { Ace } from "ace-builds";
import "ace-builds/src-noconflict/mode-json";

export interface EditorPropsType {
  value: string;
  height: string;
  onChange?: (value: string) => void;
  parseDebounceTime?: number;
  inboundAnnotations?: Ace.Annotation[];
  setEditor?: (editor: Ace.Editor) => void;
  readOnly?: boolean;
}

let originalCommands;
const setCommandEnabled = (editor, name, enabled) => {
  let command = editor.commands.byName[name];
  if (!originalCommands) {
    originalCommands = JSON.parse(JSON.stringify(editor.commands));
  }
  let bindKeyOriginal = originalCommands.byName[name].bindKey;
  command.bindKey = enabled ? bindKeyOriginal : null;
  editor.commands.addCommand(command);
};

const Editor = ({
  height,
  value,
  onChange,
  parseDebounceTime = 1500,
  inboundAnnotations,
  readOnly,
  setEditor: setOuterEditor,
}: EditorPropsType) => {
  const [editor, setEditor] = useState<Ace.Editor>();
  const aceRef = useRef<AceEditor>(null);

  useEffect(() => {
    // This is to set aria-label on textarea for accessibility
    const editorTextArea =
      aceRef.current.editor.container.getElementsByClassName(
        "ace_text-input"
      )[0];
    editorTextArea.setAttribute("aria-label", "Test case editor");
    editorTextArea.setAttribute("data-testid", "test-case-json-editor-input");
  });

  aceRef?.current?.editor?.on("focus", function () {
    setCommandEnabled(editor, "indent", true);
    setCommandEnabled(editor, "outdent", true);
  });
  aceRef?.current?.editor?.on("blur", function () {
    setCommandEnabled(editor, "indent", true);
    setCommandEnabled(editor, "outdent", true);
  });

  aceRef?.current?.editor?.commands.addCommand({
    name: "escape",
    bindKey: { win: "Esc", mac: "Esc" },
    exec: function () {
      setCommandEnabled(editor, "indent", false);
      setCommandEnabled(editor, "outdent", false);
    },
  });

  const toggleSearchBox = useCallback(() => {
    //@ts-ignore
    if (!editor?.searchBox) {
      editor.execCommand("find");
      // @ts-ignore
    } else if (editor.searchBox.active) {
      // @ts-ignore
      editor.searchBox.hide();
      // assume that it's been executed
    } else {
      //@ts-ignore
      editor.searchBox.show();
    }
  }, [editor]);

  useEffect(() => {
    if (editor) {
      window.addEventListener(
        "toggleEditorSearchBox",
        toggleSearchBox as EventListener
      );
    }
    return () => {
      window.removeEventListener(
        "toggleEditorSearchBox",
        toggleSearchBox as EventListener
      );
    };
  }, [editor, toggleSearchBox]);

  return (
    <div
      data-testid="test-case-json-editor"
      style={{ height: "calc(100% - 48px)" }}
    >
      <AceEditor
        value={value}
        ref={aceRef}
        onChange={(value) => {
          onChange(value);
        }}
        onLoad={(aceEditor: Ace.Editor) => {
          if (setEditor) {
            setEditor(aceEditor);
            // setEditor used to be a passed variable, but somehow became a local one. This seems unintended, but will not be modifying for now.
            if (setOuterEditor) {
              setOuterEditor(aceEditor);
            }
          }
        }}
        mode="json" // Temporary value of mode to prevent a dynamic search request.
        theme="monokai"
        name="ace-editor-wrapper"
        enableBasicAutocompletion={true}
        width="100%"
        height={height}
        showPrintMargin={true}
        showGutter={true}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          autoScrollEditorIntoView: true,
        }}
        editorProps={{ $blockScrolling: true }}
        readOnly={readOnly}
        wrapEnabled={true}
      />
    </div>
  );
};

export default Editor;
