import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MetaDataWrapper from "./MetaDataWrapper";

const metaDataProps = {
  header: "MetaDataTitle",
  canEdit: true,
  children: <div>Some content</div>,
  dirty: true,
  isValid: true,
  handleSubmit: jest.fn(),
  onCancel: jest.fn(),
};

describe("MetaDataWrapper", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("Should enable save and discard changes button based on selected props", async () => {
    render(<MetaDataWrapper {...metaDataProps} />);

    expect(screen.getByText("MetaDataTitle")).toBeInTheDocument();
    expect(screen.getByText("Some content")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", {
      name: "Discard Changes",
    });
    expect(cancelButton).toBeEnabled();

    const submitButton = screen.getByRole("button", { name: "Save" });
    expect(submitButton).toBeEnabled();

    userEvent.click(submitButton);
    userEvent.click(cancelButton);
    expect(metaDataProps.handleSubmit).toHaveBeenCalledTimes(1);
    expect(metaDataProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("Should disable save and discard buttons if the form is not dirty", async () => {
    const newMetaDataProps = {
      ...metaDataProps,
      canEdit: true,
      dirty: false,
      isValid: false,
    };
    render(<MetaDataWrapper {...newMetaDataProps} />);

    expect(
      screen.getByRole("button", {
        name: "Discard Changes",
      })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Should disable save button if the form is dirty but not valid", async () => {
    const newMetaDataProps = {
      ...metaDataProps,
      canEdit: true,
      dirty: true,
      isValid: false,
    };
    render(<MetaDataWrapper {...newMetaDataProps} />);

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: "Discard Changes",
      })
    ).toBeEnabled();
  });

  it("Should disable save and discard button for a user who cannot edit", async () => {
    const newMetaDataProps = {
      ...metaDataProps,
      canEdit: false,
      dirty: false,
      isValid: false,
    };
    render(<MetaDataWrapper {...newMetaDataProps} />);

    expect(
      screen.getByRole("button", {
        name: "Discard Changes",
      })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
