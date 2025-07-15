import React, { useEffect, useState } from "react";
import _ from "lodash";
import { useDebouncedCallback } from "use-debounce";
import { TextArea, RichTextEditor } from "@madie/madie-design-system";
import { useFeatureFlags } from "@madie/madie-util";

type Props = {
  name: string;
  value: string;
  setFieldValue: Function;
  label?: string;
  canEdit: boolean;
  helperText?: string;
  error?: boolean;
  required?: boolean;
};

const TextEditor = (props: Props) => {
  const {
    name,
    value,
    setFieldValue,
    label,
    canEdit,
    helperText,
    error,
    required,
  } = props;
  const { ...rest } = props;
  //   preserve a local copy of state. Update against formik values
  const [localText, setLocalText] = useState(value);
  const featureFlags = useFeatureFlags();
  // debounce the callback to update state
  const debounced = useDebouncedCallback(
    (field, value) => setFieldValue(field, value),
    250
  );
  // every 250 ms after an udpate to our local text, we update the formik value
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
          label={label}
          required={required}
          id={`${name}`}
          disabled={!canEdit}
          content={localText}
          onChange={(value: string) => {
            setLocalText(value);
          }}
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
          disabled={!canEdit}
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
