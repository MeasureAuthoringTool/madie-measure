import {
  act,
  findByTestId,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { Simulate } from "react-dom/test-utils";
import * as React from "react";
import userEvent from "@testing-library/user-event";
import clearAllMocks = jest.clearAllMocks;
import CreateVersionDialog, { formikErrorHandler } from "./CreateVersionDialog";
import { oneItemResponse } from "../../__mocks__/mockMeasureResponses";

const mockMeasureServiceApi = {
  searchMeasuresByMeasureNameOrEcqmTitle: jest
    .fn()
    .mockResolvedValue(oneItemResponse),
  fetchMeasures: jest.fn().mockResolvedValue(oneItemResponse),
  createVersion: jest.fn().mockResolvedValue({}),
  checkNextVersionNumber: jest.fn().mockReturnValue("1.0.000"),
  checkValidVersion: jest.fn().mockResolvedValue({}),
  fetchMeasureDraftStatuses: jest.fn().mockResolvedValue({
    "1": true,
    "2": true,
    "3": true,
  }),
  getMeasureExport: jest
    .fn()
    .mockResolvedValue({ size: 635581, type: "application/octet-stream" }),
};

jest.mock("@madie/madie-util", () => ({
  useIsAdminTransferEnabled: () => false,
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
}));

describe("Create Version Dialog component", () => {
  const { getByTestId } = screen;

  beforeEach(() => {
    jest.resetModules();
  });
  it("should render version dialog and the continue button is disabled", () => {
    render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        versionHelperText=""
        loading={false}
        measureId={"12a4"}
      />
    );
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    expect(getByTestId("create-version-continue-button")).toBeDisabled();
  });

  it("should render version dialog and enable continue button after a selection: major", () => {
    render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        versionHelperText=""
        loading={false}
        measureId={"12a4"}
      />
    );
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");
    expect(getByTestId("create-version-continue-button")).not.toBeDisabled();
  });

  it("should render version dialog and enable continue button after a selection: minor", () => {
    render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        versionHelperText=""
        loading={false}
        measureId={"12a4"}
      />
    );
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "minor" },
    });
    expect(typeInput.value).toBe("minor");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "0.1.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("0.1.000");
    expect(getByTestId("create-version-continue-button")).not.toBeDisabled();
  });

  it("should render version dialog and enable continue button after a selection: patch", () => {
    render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        versionHelperText=""
        loading={false}
        measureId={"12a4"}
      />
    );
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "patch" },
    });
    expect(typeInput.value).toBe("patch");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "0.0.001");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("0.0.001");
    expect(getByTestId("create-version-continue-button")).not.toBeDisabled();
  });

  it("should navigate to measure list home page on cancel", async () => {
    const onCloseFn = jest.fn();
    render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={onCloseFn}
        onSubmit={jest.fn()}
        versionHelperText=""
        loading={false}
        measureId={"12a4"}
      />
    );

    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    expect(confirmVersionNode.value).toBe("1.0.000");

    fireEvent.click(getByTestId("create-version-cancel-button"));
    expect(onCloseFn).toHaveBeenCalled();
  });

  it("should continue versioning by calling onSubmit", async () => {
    const onSubmitFn = jest.fn();
    await render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        versionHelperText=""
        loading={false}
        measureId={"12a4"}
      />
    );
    expect(getByTestId("create-version-dialog")).toBeInTheDocument();
    const typeInput = getByTestId("version-type-input") as HTMLInputElement;
    expect(typeInput).toBeInTheDocument();
    expect(typeInput.value).toBe("");
    fireEvent.change(typeInput, {
      target: { value: "major" },
    });
    expect(typeInput.value).toBe("major");
    const confirmVersionNode = getByTestId("confirm-version-input");
    userEvent.type(confirmVersionNode, "1.0.000");
    Simulate.change(confirmVersionNode);
    await waitFor(() => {
      expect(confirmVersionNode.value).toBe("1.0.000");
    });

    const continueButton = getByTestId("create-version-continue-button");
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

  it("should fail versioning because confirmed version does not match new version", async () => {
    const formik = {
      errors: {
        confirmedVersion: "Confirmed version does not match new version",
      },
      touched: { confirmedVersion: true },
    };
    const result = formikErrorHandler(formik, "confirmedVersion");
  });

  it("should display error text when versioning error is present", async () => {
    const onSubmitFn = jest.fn();
    render(
      <CreateVersionDialog
        currentVersion="0.0.000"
        open={true}
        onClose={jest.fn()}
        onSubmit={onSubmitFn}
        versionHelperText="Something has gone wrong. Please insert sand in the disk drive to continue."
        loading={false}
        measureId={"12a4"}
      />
    );
    expect(screen.getByTestId("create-version-dialog")).toBeInTheDocument();
    const helperText = await screen.getByTestId("version-helper-text");
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveTextContent(
      "Something has gone wrong. Please insert sand in the disk drive to continue."
    );
  });

  it("should show loading spinner when loading prop is true", () => {
    waitFor(() =>
      render(
        <CreateVersionDialog
          currentVersion="0.0.000"
          open={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
          versionHelperText=""
          loading={true}
        />
      )
    );

    expect(screen.getByTestId("madie-spinner")).toBeInTheDocument();
    const backdrop = document.querySelector(".MuiBackdrop-root");
    expect(backdrop).toBeInTheDocument();
  });
});
