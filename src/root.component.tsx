import styled from "styled-components";
import React from "react";

import GlobalStyles from "./styles/GlobalStyles";
import "./styles/tailwind.css";

const Notice = styled.span.attrs((): { className: string } => ({
  className: "mm:text-green-700",
}))``;
export default function Root(props) {
  return (
    <>
      <GlobalStyles />
      <Notice>{props.name} is mounted!</Notice>;
    </>
  );
}
