import * as React from "react";

import { render } from "@testing-library/react";
import { ValidationStatus } from "@madie/madie-models";
import ValidationStatusIcon from "./ValidationStatusIcon";

describe("ValidationStatusIcon component", () => {
  it("should render ValidationStatusIcon for pending status", () => {
    const { getByTestId } = render(
      <ValidationStatusIcon validationStatus={ValidationStatus.PENDING} />
    );
    expect(
      getByTestId("validation-header-pending-validating-spinner")
    ).toBeInTheDocument();
  });

  it("should render ValidationStatusIcon for validating status", () => {
    const { getByTestId } = render(
      <ValidationStatusIcon validationStatus={ValidationStatus.VALIDATING} />
    );
    expect(
      getByTestId("validation-header-pending-validating-spinner")
    ).toBeInTheDocument();
  });

  it("should render ValidationStatusIcon for valid status", () => {
    const { getByTestId } = render(
      <ValidationStatusIcon validationStatus={ValidationStatus.VALID} />
    );
    expect(getByTestId("validation-header-valid-icon")).toBeInTheDocument();
  });

  it("should render ValidationStatusIcon for invalid status", () => {
    const { getByTestId } = render(
      <ValidationStatusIcon validationStatus={ValidationStatus.INVALID} />
    );
    expect(getByTestId("validation-header-invalid-icon")).toBeInTheDocument();
  });

  it("should render ValidationStatusIcon for no status", () => {
    const { getByTestId } = render(
      <ValidationStatusIcon validationStatus={undefined} />
    );
    expect(getByTestId("validation-header-no-status-icon")).toBeInTheDocument();
  });
});
