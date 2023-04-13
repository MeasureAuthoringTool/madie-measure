import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";

import ExportDialog from "./ExportDialog";

describe("Export Dialog", () => {
  const { getByTestId, getByText, queryByText } = screen;
  const renderExportDialog = (props) => {
    return render(<ExportDialog {...props} />);
  };

  test("renders with default state downloading", () => {
    renderExportDialog({
      // downloadState: 'downloading', // what is expected
      failureMessage: null,
      measureName: "measureName",
      open: true,
      handleContinueDialog: jest.fn(),
      handleCancelDialog: jest.fn(),
    });
    expect(getByTestId("circular-progress")).toBeInTheDocument();
  });
  test("renders a continue button when succeeded", () => {
    renderExportDialog({
      downloadState: "success",
      failureMessage: null,
      measureName: "measureName",
      open: true,
      handleContinueDialog: jest.fn(),
      handleCancelDialog: jest.fn(),
    });
    expect(getByText("Continue")).toBeInTheDocument();
  });
});
