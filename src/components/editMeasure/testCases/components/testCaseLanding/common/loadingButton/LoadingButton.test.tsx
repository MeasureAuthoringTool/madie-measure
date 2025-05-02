import * as React from "react";
import LoadingButton from "./LoadingButton";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const onRunTests = jest.fn();

describe("LoadingActionButton", () => {
  it("RunTestsButton should be enabled with undefined shouldDisableRunTestsButton flag", () => {
    render(
      <LoadingButton
        hasErrors={false}
        isExecutionContextReady={true}
        onClick={onRunTests}
        label="Run Test(s)"
        dataTestId="execute-test-cases-button"
      />
    );
    const executeButton = screen.getByTestId("execute-test-cases-button");
    expect(executeButton).toHaveProperty("disabled", false);
  });

  it("RunTestsButton should be enabled with no error, and shouldDisableRunTestsButton flag is false", () => {
    render(
      <LoadingButton
        hasErrors={false}
        isExecutionContextReady={true}
        onClick={onRunTests}
        label="Run Test(s)"
        dataTestId="execute-test-cases-button"
      />
    );

    const executeButton = screen.getByTestId("execute-test-cases-button");
    expect(executeButton).toHaveProperty("disabled", false);
  });

  it("RunTestsButton should be disabled with error", () => {
    render(
      <LoadingButton
        hasErrors={true}
        isExecutionContextReady={true}
        onClick={onRunTests}
        label="Run Test(s)"
        dataTestId="execute-test-cases-button"
      />
    );

    const executeButton = screen.getByTestId("execute-test-cases-button");
    expect(executeButton).toHaveProperty("disabled", true);
  });

  it("test click RunTestsButton execution is loading", () => {
    render(
      <LoadingButton
        hasErrors={false}
        isExecutionContextReady={true}
        onClick={onRunTests}
        label="Run Test(s)"
        dataTestId="execute-test-cases-button"
      />
    );

    const executeButton = screen.getByTestId("execute-test-cases-button");
    expect(executeButton).toHaveProperty("disabled", false);

    userEvent.click(executeButton);
    expect(executeButton).toHaveProperty("disabled", true);
  });
});
