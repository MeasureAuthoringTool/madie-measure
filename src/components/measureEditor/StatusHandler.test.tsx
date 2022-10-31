import * as React from "react";
import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import StatusHandler from "./StatusHandler";

describe("StatusHandler Component", () => {
  const { getByTestId, queryByTestId } = screen;
  const annotationsObject = [
    {
      row: 2,
      column: 1,
      type: "error",
      text: "ELM: 1:56 | 401 : [no body]",
    },
    {
      row: 3,
      column: 5,
      type: "warning",
      text: "ELM: 1:56 | 401 : [no body]",
    },
  ];
  // all success conditions
  test("It displays a generic success message when no error or messages present", () => {
    const success = {
      status: "success",
      message: "stuff saved successfully",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={false}
        outboundAnnotations={[]}
      />
    );

    const successHeader = getByTestId("generic-success-text-header");
    const successSubHeader = queryByTestId("generic-success-text-sub-header");
    const successList = queryByTestId("generic-success-text-list");

    expect(successHeader.textContent).toBe(success.message);
    expect(successSubHeader).not.toBeInTheDocument();
    expect(successList).not.toBeInTheDocument();
  });

  test("It displays a generic success message and a library warning if a library warning exists when no error or messages present, also displays a list of annotations", () => {
    const success = {
      status: "success",
      message:
        "CQL updated successfully! Library Name and/or Version can not be updated in the CQL Editor. MADiE has overwritten the updated Library Name and/or Version.",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={false}
        outboundAnnotations={annotationsObject}
      />
    );

    const successHeader = getByTestId("generic-success-text-header");
    const successSubHeader = queryByTestId("generic-success-text-sub-header");
    const libraryWarning = queryByTestId("library-warning");
    const successList = queryByTestId("generic-success-text-list");

    expect(successHeader.textContent).toBe(
      "Changes saved successfully but the following errors were found"
    );
    expect(libraryWarning?.textContent).toBe(success.message);
    expect(successSubHeader?.textContent).toBe(
      `${annotationsObject.length} CQL errors found:`
    );
    expect(successList).toBeInTheDocument();
  });

  //all error conditions
  test("It displays an error message at it's least complex when no error Message is present, but flag is true", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={""}
        outboundAnnotations={[]}
      />
    );

    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = queryByTestId("generic-error-text-sub-header");
    const errorList = queryByTestId("generic-error-text-list");

    expect(errorHeader.textContent).toBe("Errors were found within the CQL");
    expect(errorSubHeader).not.toBeInTheDocument();
    expect(errorList).not.toBeInTheDocument();
  });

  test("It displays an error message and information about errors supplied when error is true and annotations provided", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={""}
        outboundAnnotations={annotationsObject}
      />
    );

    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = queryByTestId("generic-error-text-sub-header");
    const errorList = queryByTestId("generic-error-text-list");

    expect(errorHeader.textContent).toBe("Errors were found within the CQL");
    expect(errorSubHeader?.textContent).toBe(
      `${annotationsObject.length} CQL errors found:`
    );
    expect(errorList).toBeInTheDocument();
  });

  test("It displays an error message with provided error message and no annotations", () => {
    const success = {
      status: undefined,
      message: "",
    };
    const errorMessage = "CQL problem please help";
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={errorMessage}
        outboundAnnotations={[]}
      />
    );

    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = queryByTestId("generic-error-text-sub-header");
    const errorList = queryByTestId("generic-error-text-list");

    expect(errorHeader.textContent).toBe(errorMessage);
    expect(errorSubHeader).not.toBeInTheDocument();
    expect(errorList).not.toBeInTheDocument();
  });

  test("It displays an error message with error message = to error Message provided and annotations provided", () => {
    const success = {
      status: undefined,
      message: "",
    };
    const errorMessage = "CQL problem please help";
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={errorMessage}
        outboundAnnotations={annotationsObject}
      />
    );

    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = queryByTestId("generic-error-text-sub-header");
    const errorList = queryByTestId("generic-error-text-list");

    expect(errorHeader.textContent).toBe(errorMessage);
    expect(errorSubHeader?.textContent).toBe(
      `${annotationsObject.length} CQL errors found:`
    );
    expect(errorList).toBeInTheDocument();
  });

  test("Error flag is false, but outbound annotations exist", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage=""
        outboundAnnotations={annotationsObject}
      />
    );

    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = queryByTestId("generic-error-text-sub-header");
    const errorList = queryByTestId("generic-error-text-list");

    expect(errorHeader.textContent).toBe("Errors were found within the CQL");
    expect(errorSubHeader?.textContent).toBe(
      `${annotationsObject.length} CQL errors found:`
    );
    expect(errorList).toBeInTheDocument();
  });

  test("status.success, errorMessage, and outbound annotatinos", () => {
    const success = {
      status: "success",
      message: "",
    };
    const warningMessage =
      "You forgot to cover the edge case for firehelpers that aren't fire helpers";
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={warningMessage}
        outboundAnnotations={annotationsObject}
      />
    );

    const successHeader = getByTestId("generic-success-text-header");
    const libraryWarning = queryByTestId("library-warning");
    const successList = queryByTestId("generic-success-text-list");

    expect(successHeader.textContent).toBe(
      "Changes saved successfully but the following errors were found"
    );
    expect(libraryWarning?.textContent).toBe(warningMessage);

    expect(successList).toBeInTheDocument();
  });

  test("status.success and errorMessage", () => {
    const success = {
      status: "success",
      message: "",
    };
    const warningMessage =
      "You forgot to cover the edge case for firehelpers that aren't fire helpers";

    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={warningMessage}
        outboundAnnotations={[]}
      />
    );

    const successHeader = getByTestId("generic-success-text-header");
    const libraryWarning = queryByTestId("library-warning");
    const successList = queryByTestId("generic-success-text-list");

    expect(successHeader.textContent).toBe(
      "Changes saved successfully but the following errors were found"
    );
    expect(libraryWarning?.textContent).toBe(warningMessage);

    expect(successList).not.toBeInTheDocument();
  });
});
