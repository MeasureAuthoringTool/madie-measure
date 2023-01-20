import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import DraftMeasureDialog from "./DraftMeasureDialog";
import { Measure } from "@madie/madie-models";

describe("DraftMeasureDialog component", () => {
  let measure: Measure, onCloseFn, onSubmitFn;
  beforeEach(() => {
    clearAllMocks();
    measure = {
      id: "1",
      measureName: "Test",
    } as unknown as Measure;
    onCloseFn = jest.fn();
    onSubmitFn = jest.fn();
  });

  const renderComponent = () => {
    render(
      <DraftMeasureDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={onSubmitFn}
        measure={measure}
      />
    );
  };

  it("should render draft measure dialog", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    expect(measureName.value).toEqual(measure.measureName);
    expect(screen.getByTestId("create-draft-continue-button")).toBeEnabled();
  });

  it("should check for required measure name", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;
    fireEvent.change(measureName, { target: { value: "" } });
    await waitFor(() => {
      expect(screen.getByTestId("measureName-helper-text")).toHaveTextContent(
        "A Measure name is required."
      );
    });
  });

  it("should check for measure name with at least one letter", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;

    fireEvent.change(measureName, { target: { value: "123" } });
    await waitFor(() => {
      expect(screen.getByTestId("measureName-helper-text")).toHaveTextContent(
        "A Measure name must contain at least one letter."
      );
    });
  });

  it("should check for measure name with at no special characters", async () => {
    renderComponent();
    expect(screen.getByText("Create Draft")).toBeInTheDocument();
    const measureName = (await screen.findByRole("textbox", {
      name: "Measure Name",
    })) as HTMLInputElement;

    fireEvent.change(measureName, { target: { value: "A_" } });
    await waitFor(() => {
      expect(screen.getByTestId("measureName-helper-text")).toHaveTextContent(
        "Measure Name must not contain '_' (underscores)."
      );
    });
  });

  it("should call model close handler on clicking cancel button", async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should call onSubmit handler on clicking continue button", async () => {
    renderComponent();
    fireEvent.click(screen.getByText(/Continue/i));
    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalled();
    });
  });
});
