import React from "react";
import "./styles/tailwind.css";

import GlobalStyles from "./styles/GlobalStyles";

export default function Root(props) {
  return (
    <>
      <GlobalStyles />
      <span className="mm:text-green-700">{props.name} is mounted!</span>;
    </>
  );
}
