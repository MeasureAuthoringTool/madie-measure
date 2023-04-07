import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";

import ExportIcon from "./ExportIcon";

describe("Export Icon", () => {
  const { getByTestId, getByText, queryByText } = screen;
  const renderExportIcon = (props) => {
    return render(<ExportIcon {...props} />);
  };

  test("renders success", () => {
    renderExportIcon({
      downloadState: "success",
    });
    expect(getByTestId("CheckCircleOutlineIcon")).toBeInTheDocument();
  });
  test("renders failure", () => {
    renderExportIcon({
      downloadState: "failure",
    });
    expect(getByTestId("CancelOutlinedIcon")).toBeInTheDocument();
  });
  test("renders ", () => {
    renderExportIcon({
      downloadState: "downloading",
    });
    expect(getByTestId("circular-progress")).toBeInTheDocument();
  });
});
