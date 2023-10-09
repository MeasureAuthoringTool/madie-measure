import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import StatusHandler, { transformAnnotation } from "./StatusHandler";

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

  it("Should display success message, an errorMessage and outbound annotations", () => {
    const success = {
      status: "success",
      message: "",
    };
    const warningMessage =
      "You forgot to cover the edge case for fire helpers that aren't fire helpers";
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={warningMessage}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      warningMessage
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a Success message along with Error Message but no Annotations", () => {
    const success = {
      status: "success",
      message: "",
    };
    const errorMessage = "An error occurred, but CQL is saved successfully";
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={errorMessage}
        outboundAnnotations={[]}
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      errorMessage
    );
    expect(
      screen.queryByTestId("generic-errors-text-list")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-warnings-text-list")
    ).not.toBeInTheDocument();
  });

  it("Should display a generic success message and a library warning if a library warning exists when no error or messages present, also displays a list of annotations", () => {
    const success = {
      status: "success",
      message:
        "CQL updated successfully! Library Statement or Using Statement were incorrect. MADiE has overwritten them to ensure proper CQL.",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      success.message
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a generic success message and a using warning if a library warning exists when no error or messages present, also displays a list of annotations", async () => {
    const success = {
      status: "success",
      message:
        "CQL updated successfully but was missing a Using statement. Please add in a valid model and version.",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    await waitFor(() => {
      expect(screen.getByTestId("library-warning")).toHaveTextContent(
        success.message
      );
    });
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a success message, with a list of annotations", () => {
    const success = {
      status: "success",
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      "Changes saved successfully but the following issues were found"
    );
    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display a generic success message when no error or messages present", () => {
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
        hasSubTitle={false}
      />
    );

    expect(getByTestId("generic-success-text-header")).toHaveTextContent(
      success.message
    );
    expect(
      screen.queryByTestId("generic-errors-text-list")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-warnings-text-list")
    ).not.toBeInTheDocument();
  });

  //all error conditions
  it("Should display an error message and annotations, when error flag is true", () => {
    const success = {
      status: null,
      message: "",
    };
    const errorMessage =
      "You forgot to cover the edge case for fire helpers that aren't fire helpers";
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={errorMessage}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      errorMessage
    );
    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();

    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display an error message with provided error message and subtitle but no annotations", () => {
    const success = {
      status: undefined,
      message: "",
    };
    const errorMessage = "Something wrong with measure list page";
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={errorMessage}
        outboundAnnotations={[]}
        hasSubTitle={true}
      />
    );
    screen.debug();
    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = getByTestId("generic-error-text-sub-header");
    const subTitle = screen.getByText("MADiE helpdesk");

    expect(errorHeader.textContent).toBe(errorMessage);
    expect(errorSubHeader).toBeInTheDocument();
    expect(subTitle).toBeInTheDocument();
    expect(subTitle.closest("a")).toHaveAttribute(
      "href",
      "https://oncprojectracking.healthit.gov/support/projects/BONNIEMAT/summary"
    );
  });

  it("Should display an error message but no annotations", () => {
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
        hasSubTitle={false}
      />
    );

    expect(getByTestId("generic-error-text-header")).toHaveTextContent(
      errorMessage
    );

    expect(screen.queryByTestId("library-warning")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-errors-text-list")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("generic-warnings-text-list")
    ).not.toBeInTheDocument();
  });

  it("Should display an error message when error flag is true and annotations are provided", () => {
    const success = {
      status: undefined,
      message: "",
    };
    render(
      <StatusHandler
        success={success}
        error={true}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      "Following issues were found within the CQL"
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });

  it("Should display an error message when no error Message or annotations are present, but flag is true", () => {
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
        hasSubTitle={false}
      />
    );

    const errorHeader = getByTestId("generic-error-text-header");
    const errorSubHeader = queryByTestId("generic-error-text-sub-header");
    const errorList = queryByTestId("generic-error-text-list");

    expect(errorHeader.textContent).toBe("Errors were found within the CQL");
    expect(errorSubHeader).not.toBeInTheDocument();
    expect(errorList).not.toBeInTheDocument();
  });

  it("Should display annotations when Error flag is false", () => {
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
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      "Following issues were found within the CQL"
    );
    const errorsList = screen.getByTestId("generic-errors-text-list");
    expect(errorsList).toBeInTheDocument();
    expect(errorsList).toHaveTextContent(
      transformAnnotation(annotationsObject[0])
    );
    const warningsList = screen.getByTestId("generic-warnings-text-list");
    expect(warningsList).toBeInTheDocument();
    expect(warningsList).toHaveTextContent(
      transformAnnotation(annotationsObject[1])
    );
  });
});
