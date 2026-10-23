import styled from "styled-components";

export const SubTitle = styled.p`
  color: #505d68;
  font-size: 11px;
  margin-top: 20px;
  max-width: 405px;
`;

export const SecondIpLabel = styled.span.attrs((): { className: string } => ({
  className: "mm:text-black-50",
}))``;
export const FieldSeparator = styled.div.attrs((): { className: string } => ({
  className: "mm:mt-1",
}))``;
export const SoftLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  color: rgba(66, 75, 90, 0.7);
`;
