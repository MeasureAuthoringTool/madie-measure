import tw, { styled } from "twin.macro";

export const MenuItemContainer = tw.div`bg-transparent flex pt-12 pb-4 border-b`;

// const FormField = tw.div`mt-6 grid grid-cols-4`;
export const FormFieldInner = tw.div`lg:col-span-3`;
export const FieldLabel = tw.label`block capitalize text-sm font-medium text-slate-90`;
export const FieldSeparator = tw.div`mt-1`;
export const FieldInput = tw.input`disabled:bg-slate shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;
export const TextArea = tw.textarea`disabled:bg-slate shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300! rounded-md!`;

export const ButtonSpacer = styled.span`
  margin-left: 15px;
`;
