import styled from "styled-components";

export const MessageText = styled.p.attrs((): { className: string } => ({
  className: "mm:text-sm mm:font-medium",
}))``;
export const SuccessText = styled(MessageText).attrs(
  (): { className: string } => ({ className: "mm:text-green-800" })
)``;
