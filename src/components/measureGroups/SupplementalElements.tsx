import React from "react";

export default function SupplementalElements(props) {
  return <div data-testId={props.dataTestId}>{props.title}</div>;
}
