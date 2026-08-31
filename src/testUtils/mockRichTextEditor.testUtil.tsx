import * as React from "react";

const toRichTextHtml = (value: string) =>
  value === "" || value.startsWith("<") ? value : `<p>${value}</p>`;

export const MockRichTextEditor = ({
  id,
  label,
  content,
  onChange,
  onBlur,
  readOnly,
  disabled,
}: any) => {
  const testId = id
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();

  if (readOnly) {
    return (
      <div data-testid={`${testId}-rich-text-editor`}>
        <label id={`${id}-label`} htmlFor={id}>
          {label}
        </label>
        <p
          data-testid={`${id}-value`}
          aria-labelledby={`${id}-label`}
          dangerouslySetInnerHTML={{ __html: content || "-" }}
        />
      </div>
    );
  }

  return (
    <div data-testid={`${testId}-rich-text-editor`}>
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <div
        id={id}
        role="textbox"
        aria-labelledby={`${id}-label`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: content ?? "" }}
        onInput={(event) =>
          onChange(toRichTextHtml(event.currentTarget.innerHTML))
        }
        onBlur={onBlur}
      />
    </div>
  );
};

export const syncUseDebounceMock = () => ({
  useDebouncedCallback: (callback: (...args: any[]) => void) => {
    const debounced = (...args: any[]) => callback(...args);
    debounced.cancel = () => {};
    debounced.flush = () => {};
    debounced.isPending = () => false;
    return debounced;
  },
});
