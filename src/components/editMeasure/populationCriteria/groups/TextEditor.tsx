import React, { useEffect, useState } from "react";
import _ from "lodash";
import { useDebouncedCallback } from "use-debounce";
import { RichTextEditor } from "@madie/madie-design-system/dist/react";

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
  /** Test-only: disable debouncing so value propagates immediately */
  disableDebounce?: boolean;
  // allow explicit test id override
  [key: string]: any;
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
  const { disableDebounce } = props;
  // preserve a local copy of state. Update against formik values
  const [localText, setLocalText] = useState(value);

  const debounced = useDebouncedCallback((field, value) => {
    const normalized =
      value === "<p></p>" || value === "<p><br></p>" ? "" : value;
    setFieldValue(field, normalized);
  }, 250);

  // update formik value when local changes (debounced unless disabled)
  useEffect(() => {
    if (disableDebounce) {
      const normalized =
        localText === "<p></p>" || localText === "<p><br></p>" ? "" : localText;
      setFieldValue(name, normalized);
    } else {
      debounced(name, localText);
    }
  }, [localText, disableDebounce]);

  // sync external value -> local
  useEffect(() => {
    setLocalText(value);
  }, [value]);

  const providedTestId = props["data-testid"];
  const resolvedTestId =
    providedTestId || `${_.kebabCase(name)}-rich-text-editor`;
  return (
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
      data-testid={resolvedTestId}
    />
  );
};

export default TextEditor;
