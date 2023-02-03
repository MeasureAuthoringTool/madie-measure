import React from "react";
import { useDocumentTitle } from "@madie/madie-util";

export default function SupplementalElements(props) {
  useDocumentTitle(`MADiE Edit ${props.title}`);
  return <div data-testId={props.dataTestId}>{props.title}</div>;
}
