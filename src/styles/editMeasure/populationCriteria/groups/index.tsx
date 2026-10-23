import styled from "styled-components";

export const MenuItemContainer = styled.div.attrs(
  (): { className: string } => ({
    className: "mm:bg-transparent mm:flex mm:pt-12 mm:pb-4 mm:border-b",
  })
)``;

// const FormField = tw.div`mt-6 grid grid-cols-4`;
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
export const FieldInput = styled.input.attrs((): { className: string } => ({
  className:
    "mm:disabled:bg-slate mm:shadow-xs mm:focus:ring-primary-500 mm:focus:border-primary-500 mm:block mm:w-full mm:sm:text-sm mm:rounded-md!",
}))``;
export const TextArea = styled.textarea.attrs((): { className: string } => ({
  className:
    "mm:disabled:bg-slate mm:shadow-xs mm:focus:ring-primary-500 mm:focus:border-primary-500 mm:block mm:w-full mm:sm:text-sm mm:rounded-md!",
}))``;

export const ButtonSpacer = styled.span`
  margin-left: 15px;
`;
