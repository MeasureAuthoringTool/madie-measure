import styled from "styled-components";

export const FormFieldInner = styled.div.attrs((): { className: string } => ({
  className: "mm:lg:col-span-3",
}))``;
export const FieldLabel = styled.label.attrs((): { className: string } => ({
  className:
    "mm:block mm:capitalize mm:text-sm mm:font-medium mm:text-slate-90",
}))``;
export const FieldSeparator = styled.div.attrs((): { className: string } => ({
  className: "mm:mt-1",
}))``;
export const TextArea = styled.textarea.attrs((): { className: string } => ({
  className:
    "mm:disabled:bg-slate mm:shadow-xs mm:focus:ring-primary-500 mm:focus:border-primary-500 mm:block mm:w-full mm:sm:text-sm mm:border-gray-500! mm:rounded-md!",
}))``;
