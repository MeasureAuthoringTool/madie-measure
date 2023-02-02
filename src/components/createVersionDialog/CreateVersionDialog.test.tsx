import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import clearAllMocks = jest.clearAllMocks;
import CreateVersionDialog from "./CreateVersionDialog";

describe("Create Version Dialog component", () => {
  beforeEach(() => {
    clearAllMocks();
  });

  it("should render version dialog and the continue button is disabled", () => {
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        versionHelperText=""
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("create-version-continue-button")).toBeDisabled();
  });

  it("should render version dialog and enable continue button after a selection", () => {
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        versionHelperText=""
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    const majorRadio: HTMLInputElement = screen.getByLabelText("Major");
    const minorRadio: HTMLInputElement = screen.getByLabelText("Minor");
    const patchRadio: HTMLInputElement = screen.getByLabelText("Patch");
    expect(majorRadio.checked).toEqual(false);
    act(() => {
      fireEvent.click(majorRadio);
    });
    expect(majorRadio.checked).toEqual(true);
    expect(minorRadio.checked).toEqual(false);
    expect(patchRadio.checked).toEqual(false);
    expect(
      screen.getByTestId("create-version-continue-button")
    ).not.toBeDisabled();
  });

  it("should navigate to measure list home page on cancel", async () => {
    const onCloseFn = jest.fn();
    render(
      <CreateVersionDialog
        open={true}
        onClose={onCloseFn}
        onSubmit={jest.fn()}
        versionHelperText=""
      />
    );

    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    const majorRadio: HTMLInputElement = screen.getByLabelText("Major");
    const minorRadio: HTMLInputElement = screen.getByLabelText("Minor");
    const patchRadio: HTMLInputElement = screen.getByLabelText("Patch");
    expect(majorRadio.checked).toEqual(false);
    act(() => {
      fireEvent.click(majorRadio);
    });
    expect(majorRadio.checked).toEqual(true);
    expect(minorRadio.checked).toEqual(false);
    expect(patchRadio.checked).toEqual(false);

    act(() => {
      fireEvent.click(minorRadio);
    });
    expect(majorRadio.checked).toEqual(false);
    expect(minorRadio.checked).toEqual(true);
    expect(patchRadio.checked).toEqual(false);

    act(() => {
      fireEvent.click(patchRadio);
    });
    expect(majorRadio.checked).toEqual(false);
    expect(minorRadio.checked).toEqual(false);
    expect(patchRadio.checked).toEqual(true);

    fireEvent.click(screen.getByTestId("create-version-cancel-button"));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should continue versioning by calling onSubmit", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        versionHelperText=""
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    const majorRadio: HTMLInputElement = screen.getByLabelText("Major");
    expect(majorRadio.checked).toEqual(false);

    act(() => {
      fireEvent.click(majorRadio);
    });

    const continueButton = screen.getByTestId("create-version-continue-button");
    await waitFor(() => {
      expect(continueButton).toBeEnabled();
    });

    act(() => {
      fireEvent.click(continueButton);
    });

    await waitFor(() => {
      expect(onSubmitFn).toHaveBeenCalled();
    });
  });

  it("should display error text when versioning error is present", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateVersionDialog
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        versionHelperText="Something has gone wrong. Please insert sand in the disk drive to continue."
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("version-helper-text")).toBeInTheDocument();
  });
});
