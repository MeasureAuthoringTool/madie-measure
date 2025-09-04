import * as React from "react";
import { render, screen } from "@testing-library/react";
import StatusHandler, { transformAnnotation } from "./StatusHandler";
import { MadieAlert } from "@madie/madie-design-system/dist/react";

jest.mock("@madie/madie-design-system/dist/react", () => ({
  MadieAlert: jest.fn(({ alerts }) => {
    return (
      <div data-testid="madie-alert-mock">
        {alerts.map((alert, index) => {
          const alertContent = alert.content;
          return (
            <div
              key={index}
              data-testid={`alert-${index}`}
              data-type={alert.type}
            >
              {/* Render the header - find the h3 and get its text */}
              <div data-testid={`generic-${alert.type}-text-header`}>
                {
                  alertContent?.props?.children.find(
                    (child) =>
                      child?.type === "h3" ||
                      (child?.props &&
                        child?.props["data-testid"] ===
                          `generic-${alert.type}-text-header`)
                  )?.props?.children
                }
              </div>

              {/* Render library warning if present */}
              {alertContent?.props?.children.find(
                (child) => child?.props?.className === "secondary"
              ) && (
                <div data-testid="library-warning">
                  {
                    alertContent.props.children.find(
                      (child) => child?.props?.className === "secondary"
                    ).props.children.props.children
                  }
                </div>
              )}

              {/* Render subtitle if present */}
              {alertContent?.props?.children.find(
                (child) =>
                  child?.props &&
                  child?.props["data-testid"] ===
                    "generic-error-text-sub-header"
              ) && (
                <div data-testid="generic-error-text-sub-header">
                  {
                    alertContent.props.children.find(
                      (child) =>
                        child?.props &&
                        child?.props["data-testid"] ===
                          "generic-error-text-sub-header"
                    ).props.children
                  }
                </div>
              )}

              {/* Render errors list if present */}
              {alertContent?.props?.children.find(
                (child) =>
                  child?.type === "ul" &&
                  child?.props?.["data-testid"] === "generic-errors-text-list"
              ) && (
                <div data-testid="generic-errors-text-list">
                  {alertContent.props.children.find(
                    (child) =>
                      child?.props &&
                      child?.props["data-testid"] === "generic-errors-text-list"
                  )}
                </div>
              )}

              {/* Render warnings list if present */}
              {alertContent?.props?.children.find(
                (child) =>
                  child?.type === "ul" &&
                  child?.props?.["data-testid"] === "generic-warnings-text-list"
              ) && (
                <div data-testid="generic-warnings-text-list">
                  {alertContent.props.children.find(
                    (child) =>
                      child?.props &&
                      child?.props["data-testid"] ===
                        "generic-warnings-text-list"
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }),
}));

jest.mock("@madie/madie-util", () => ({
  // feature flags removed for minimizeAlerts; returning empty object for compatibility
  useFeatureFlags: () => ({}),
}));

describe("StatusHandler Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (MadieAlert as jest.Mock).mockClear();
  });

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

  const success = {
    status: "success",
    primaryMessage: "CQL updated successfully",
    secondaryMessages: ["Library statement can not be updated"],
  };

  it("Should display success message, an errorMessage and outbound annotations", () => {
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

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            copyButton: true,
            canClose: false,
          }),
        ]),
      }),
      expect.anything()
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      success.primaryMessage
    );
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      "Library statement can not be updated"
    );
  });

  it("Should display a generic success message and a library warning if a library warning exists when no error or messages present", () => {
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={null}
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      success.primaryMessage
    );
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      "Library statement can not be updated"
    );

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
    );
  });

  it("Should display a generic success message when no error or messages present", () => {
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage={false}
        outboundAnnotations={[]}
        hasSubTitle={false}
      />
    );

    expect(screen.getByTestId("generic-success-text-header")).toHaveTextContent(
      success.primaryMessage
    );
    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "success",
          }),
        ]),
      }),
      expect.anything()
    );
  });

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
    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
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

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      errorMessage
    );
    expect(
      screen.getByTestId("generic-error-text-sub-header")
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("generic-error-text-sub-header")
    ).toHaveTextContent("Please reach out to");

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
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

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      errorMessage
    );

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
    );
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

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
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

    expect(screen.getByTestId("generic-error-text-header")).toHaveTextContent(
      "Errors were found within the CQL"
    );

    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
    );
  });

  it("Should not display annotations when Error flag is false and annotations are warning type", () => {
    const success = {
      status: undefined,
      message: "",
    };
    annotationsObject[0].type = "warning";
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage=""
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(screen.queryByTestId("generic-error-text-header")).toBeNull();
    expect(screen.queryByTestId("generic-errors-text-list")).toBeNull();
    expect(screen.queryByTestId("generic-warnings-text-list")).toBeNull();
    expect(MadieAlert).not.toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
    );
  });

  it("Should return empty fragment when no conditions match", () => {
    render(
      <StatusHandler
        success={undefined}
        error={false}
        errorMessage=""
        outboundAnnotations={[]}
        hasSubTitle={false}
      />
    );

    expect(screen.queryByTestId("madie-alert-mock")).not.toBeInTheDocument();
  });

  it("Should not display annotations when Error flag is false and annotations are error type", () => {
    const success = {
      status: undefined,
      message: "",
    };
    annotationsObject[1].type = "error";
    render(
      <StatusHandler
        success={success}
        error={false}
        errorMessage=""
        outboundAnnotations={annotationsObject}
        hasSubTitle={false}
      />
    );

    expect(screen.queryByTestId("generic-error-text-header")).not.toBeNull();
    expect(screen.queryByTestId("generic-errors-text-list")).toBeNull();
    expect(screen.queryByTestId("generic-warnings-text-list")).toBeNull();
    expect(MadieAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        alerts: expect.arrayContaining([
          expect.objectContaining({
            type: "error",
          }),
        ]),
      }),
      expect.anything()
    );
  });
});
