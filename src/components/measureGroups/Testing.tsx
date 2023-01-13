import React from "react";

export default function Testing(props) {
  return <div data-testId={props.title}>{props.title}</div>;
}
