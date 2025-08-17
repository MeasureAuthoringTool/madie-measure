import React, { useEffect, useState } from "react";
import _ from "lodash";
import { useDebouncedCallback } from "use-debounce";
import {
  TextArea,
  RichTextEditor,
} from "@madie/madie-design-system/dist/react";
import { useFeatureFlags } from "@madie/madie-util";

type Props = {
  name: string;
  value: string;
  setFieldValue: Function;
  label?: string;
  readOnly?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  onBlur: Function;
};

const TextEditor = (props: Props) => {
  const {
    name,
    value,
    setFieldValue,
    label,
    readOnly = false,
    disabled = false,
    helperText,
    error,
    required,
    onBlur,
  } = props;
  const { ...rest } = props;
  //   preserve a local copy of state. Update against formik values
  const [localText, setLocalText] = useState(value);
  const featureFlags = useFeatureFlags();
  // debounce the callback to update state
  const debounced = useDebouncedCallback((field, value) => {
    const normalized =
      value === "<p></p>" || value === "<p><br></p>" ? "" : value;
    setFieldValue(field, normalized);
  }, 250);
  // every 250 ms after an update to our local text, we update the formik value
  useEffect(() => {
    debounced(name, localText);
  }, [localText]);
  useEffect(() => {
    setLocalText(value);
  }, [value]);

  return (
    <>
      {featureFlags.EnhancedTextFormatting ? (
        <RichTextEditor
          id={name}
          name={name}
          label={label}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          helperText={helperText}
          error={error}
          content={localText}
          onChange={(value: string) => {
            setLocalText(value);
          }}
          onBlur={onBlur}
        />
      ) : (
        <TextArea
          {...rest}
          label={label}
          inputProps={{
            "data-testid": `${_.kebabCase(name)}-text`,
          }}
          placeholder="-"
          name={name}
          id={name}
          readOnly={readOnly}
          disabled={disabled}
          helperText={helperText}
          error={error}
          required={required}
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
        />
      )}
    </>
  );
};

export default TextEditor;
