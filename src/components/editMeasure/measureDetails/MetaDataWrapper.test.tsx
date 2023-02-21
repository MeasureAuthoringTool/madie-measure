import * as React from "react";
import { queryByTestId, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import MetaDataWrapper from "./MetaDataWrapper";

describe("MetaDataWrapper", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { getByTestId, getByText, queryByText } = screen;

  const RenderMetaDataWrapper = (props) => {
    return render(<MetaDataWrapper {...props} />);
  };

  test("MetaDataWrapper renders with props, props trigger as expected", async () => {
    const MetaDataProps = {
      header: "MetaDataTitle",
      canEdit: true,
      children: <div>Some content</div>,
      dirty: true,
      isValid: true,
      handleSubmit: jest.fn(),
      onCancel: jest.fn(),
    };
    await waitFor(() => RenderMetaDataWrapper(MetaDataProps));

    const header = getByText("MetaDataTitle");
    expect(header).toBeInTheDocument();

    const cancelButton = getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();

    const submitButton = getByTestId("measure-MetaDataTitle-save");
    expect(submitButton).toBeInTheDocument();

    userEvent.click(submitButton);
    userEvent.click(cancelButton);
    expect(MetaDataProps.handleSubmit).toHaveBeenCalledTimes(1);
    expect(MetaDataProps.onCancel).toHaveBeenCalledTimes(1);
  });

  test("MetaDataWrapper renders with props, props trigger as expected", async () => {
    const MetaDataProps = {
      header: "MetaDataTitle",
      canEdit: false,
      children: <div>Some content</div>,
      dirty: false,
      isValid: false,
      handleSubmit: jest.fn(),
      onCancel: jest.fn(),
    };
    await waitFor(() => RenderMetaDataWrapper(MetaDataProps));

    const header = getByText("MetaDataTitle");
    expect(header).toBeInTheDocument();

    const cancelButton = queryByText("Discard Changes");
    expect(cancelButton).toBeNull();

    const submitButton = queryByText("Save");
    expect(submitButton).toBeNull();
  });
});
