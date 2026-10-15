import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeasureAlert, {
  MeasureAlertsProvider,
  MinimizedMeasureAlerts,
} from "./MeasureAlerts";

const AlertLayout = ({
  message = "Error 1",
  showSecond = true,
  resetKey = "measure-1",
}) => (
  <MeasureAlertsProvider resetKey={resetKey}>
    <header data-testid="alert-toolbar">
      <button>Review Comments</button>
      <MinimizedMeasureAlerts />
    </header>
    <main>
      <MeasureAlert
        canClose={false}
        alertProps={{ "data-testid": "first-alert" }}
        content={
          <ul>
            <li>{message}</li>
            <li>Error 2</li>
          </ul>
        }
      />
      {showSecond && (
        <MeasureAlert
          canClose={false}
          alertProps={{ "data-testid": "second-alert" }}
          content={
            <ul>
              <li>Warning</li>
            </ul>
          }
        />
      )}
    </main>
  </MeasureAlertsProvider>
);

describe("Measure alerts", () => {
  it("minimizes independent sources and restores them from one toolbar control", () => {
    render(<AlertLayout />);
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId("first-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    expect(screen.queryByTestId("first-alert")).not.toBeInTheDocument();
    expect(screen.getByTestId("second-alert")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("alert-toolbar")).getByRole("button", {
        name: "Display Alerts (2)",
      })
    ).toBeInTheDocument();

    fireEvent.click(
      within(screen.getByTestId("second-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Display Alerts (3)" }));
    expect(screen.getByTestId("first-alert")).toBeInTheDocument();
    expect(screen.getByTestId("second-alert")).toBeInTheDocument();
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Alert actions" })).toHaveFocus();
  });

  it("expands changed alert content without retaining the old count", () => {
    const { rerender } = render(<AlertLayout />);
    fireEvent.click(
      within(screen.getByTestId("first-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    rerender(<AlertLayout message="New error" />);
    expect(screen.getByText("New error")).toBeInTheDocument();
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
  });

  it("removes unmounted sources without clearing another minimized source", () => {
    const { rerender } = render(<AlertLayout />);
    fireEvent.click(
      within(screen.getByTestId("first-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    fireEvent.click(
      within(screen.getByTestId("second-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    rerender(<AlertLayout />);
    expect(
      screen.getByRole("button", { name: "Display Alerts (3)" })
    ).toBeInTheDocument();
    rerender(<AlertLayout showSecond={false} />);
    expect(
      screen.getByRole("button", { name: "Display Alerts (2)" })
    ).toBeInTheDocument();
  });

  it("resets minimized alerts when navigating to a different measure or route", () => {
    const { rerender } = render(<AlertLayout />);
    fireEvent.click(
      within(screen.getByTestId("first-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    rerender(<AlertLayout resetKey="measure-2" />);
    expect(screen.getByTestId("first-alert")).toBeInTheDocument();
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
  });

  it("offers a restore control even when a minimized alert has no error count", () => {
    render(
      <MeasureAlertsProvider>
        <MinimizedMeasureAlerts />
        <MeasureAlert content="Informational message" canClose={false} />
      </MeasureAlertsProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
    fireEvent.click(screen.getByRole("button", { name: "Display Alerts" }));
    expect(screen.getByText("Informational message")).toBeInTheDocument();
  });

  it("preserves the design-system fallback outside a measure provider", () => {
    render(<MeasureAlert content="Standalone message" canClose={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Minimize" }));
    fireEvent.click(screen.getByRole("button", { name: "Display Alerts" }));
    expect(screen.getByText("Standalone message")).toBeInTheDocument();
  });

  it.each(["{Enter}", " "])("restores alerts using the %s key", async (key) => {
    render(<AlertLayout />);
    fireEvent.click(
      within(screen.getByTestId("first-alert")).getByRole("button", {
        name: "Minimize",
      })
    );
    const restore = screen.getByRole("button", { name: "Display Alerts (2)" });
    await act(async () => {
      restore.focus();
      userEvent.keyboard(key);
    });
    expect(screen.getByTestId("first-alert")).toBeInTheDocument();
    expect(screen.queryByTestId("minimized-alert")).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Alert actions" })).toHaveFocus();
  });
});
