import React, { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TextArea } from "@madie/madie-design-system/dist/react";

type Props = {
  name: string;
  value: string;
  setFieldValue: Function;
  label?: string;
  canEdit: Boolean;
};

const GroupsDescription = (props: Props) => {
  const { name, value, setFieldValue, label, canEdit } = props;
  //   preserve a local copy of state. Update against formik values
  const [localText, setLocalText] = useState(value);

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
    <TextArea
      label={label}
      inputProps={{
        "data-testid": `${name}-description`,
      }}
      disabled={!canEdit}
      placeholder="-"
      name={name}
      value={localText}
      onChange={(e) => {
        setLocalText(e.target.value);
      }}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      data-testid={`${name}-description`}
    />
  );
};

export default GroupsDescription;
