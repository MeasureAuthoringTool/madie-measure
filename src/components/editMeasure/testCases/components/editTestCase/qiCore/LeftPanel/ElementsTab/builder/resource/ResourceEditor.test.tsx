import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import ResourceEditor, {
  deleteMultipleCardinalityElement,
} from "./ResourceEditor";
import {
  QiCoreResourceContext,
  ResourceActionType,
} from "../../../../../../../util/QiCorePatientProvider";
import mockSelectedResourceTree from "./mockSelectedResourceTree.json";
import mockSelectedPatientTree from "./mockSelectedPatientTree.json";
import mockResourceState from "./mockResourceState.json";

import userEvent from "@testing-library/user-event";
import { useFormikContext } from "formik";

jest.mock("formik", () => ({
  useFormikContext: jest.fn(),
  getIn: (context: Record<string, unknown>, fieldName: string) =>
    context[fieldName],
}));

jest.mock("../../../../../../../api/useFhirDefinitionsService", () => {
  return () => ({
    getResourceTree: jest
      .fn()
      //.mockResolvedValueOnce(mockSelectedResourceTree)
      .mockResolvedValueOnce(mockSelectedPatientTree)
      .mockResolvedValueOnce(mockSelectedPatientTree),
  });
});

describe.skip("ResourceEditor", () => {
  const formikValues = {
    ClaimResponse: {
      id: "test2",
      disposition: "test3",
      widget: ["test4", "test5"],
    },
  };

  const getProps = (label) => {
    if (label === "ClaimResource.id") {
      return {
        value: "6fb9d817-76c5-4b68-ba06-92c7429e6b5c",
      };
    } else {
      return {
        value: "test1",
      };
    }
  };

  const resetForm = jest.fn();
  const mockFormikObj = {
    touched: {},
    errors: {},
    values: formikValues,
    isSubmitting: false,
    setFieldValue: undefined,
    getFieldProps: getProps,
    dirty: true,
    resetForm,
  };

  const mockOnCancel = jest.fn();
  const mockSetValidationSchema = jest.fn();
  const mockSetInitialFormikValuesStu6 = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders the ResourceEditor correctly, can hit dirty check", async () => {
    // Mocked formik obj return dirty true
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObj);
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const resourceIdInputField = (await screen.findByTestId(
      "string-field-input-ClaimResponse.id"
    )) as HTMLInputElement;
    expect(resourceIdInputField).toBeInTheDocument();
    expect(await screen.findByText("ClaimResponse.id")).toBeInTheDocument();
    expect(mockSetValidationSchema).toHaveBeenCalled();
    expect(mockSetInitialFormikValuesStu6).toHaveBeenCalled();
    expect(resourceIdInputField.value).toBe(
      "6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
    );

    const dispositionButton = await screen.findByRole("tab", {
      name: "disposition",
    });
    expect(dispositionButton).toBeInTheDocument();
    userEvent.click(dispositionButton);

    // mock formik obj returns dirty = true
    const discardDialog = await screen.findByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();

    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(discardDialog).not.toBeInTheDocument();
    });
    userEvent.click(dispositionButton);
    await waitFor(() => {
      expect(screen.getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(screen.getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(discardDialog).not.toBeInTheDocument();
      expect(resetForm).toHaveBeenCalled();
    });
  });

  it("renders the action center for a 0-1 cardinality element, opens when clicked", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObj);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const resourceIdInputField = (await screen.findByTestId(
      "string-field-input-ClaimResponse.id"
    )) as HTMLInputElement;
    expect(resourceIdInputField).toBeInTheDocument();
    expect(await screen.findByText("ClaimResponse.id")).toBeInTheDocument();
    expect(mockSetValidationSchema).toHaveBeenCalled();
    expect(mockSetInitialFormikValuesStu6).toHaveBeenCalled();
    expect(resourceIdInputField.value).toBe(
      "6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
    );

    const dispositionButton = await screen.findByRole("tab", {
      name: "disposition",
    });
    expect(dispositionButton).toBeInTheDocument();

    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);

    await waitFor(() => {
      expect(screen.queryByTestId("elements-copy")).not.toBeInTheDocument;
      expect(screen.queryByTestId("elements-add")).not.toBeInTheDocument;
      expect(screen.getByTestId("elements-delete")).toBeInTheDocument;
    });
    userEvent.click(actionCenter);
    expect(screen.getByTestId("elements-delete")).not.toBeInTheDocument;
  });

  it("renders the action center for a 0-* cardinality element, opens when clicked", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObj);
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const resourceIdInputField = (await screen.findByTestId(
      "string-field-input-Patient.id"
    )) as HTMLInputElement;
    expect(resourceIdInputField).toBeInTheDocument();
    expect(await screen.findByText("ClaimResponse.id")).toBeInTheDocument();
    expect(mockSetValidationSchema).toHaveBeenCalled();
    expect(mockSetInitialFormikValuesStu6).toHaveBeenCalled();
    expect(resourceIdInputField.value).toBe(
      "6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
    );

    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);

    await waitFor(() => {
      expect(screen.queryByTestId("elements-copy")).toBeInTheDocument;
      expect(screen.queryByTestId("elements-add")).toBeInTheDocument;
      expect(screen.getByTestId("elements-delete")).toBeInTheDocument;
    });
  });

  it("opens AddElementDialog, interacts with it, and can close it", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObj);
    const mockDispatch = jest.fn();

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: mockDispatch }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Click the "Add Attribute(s)" button to open dialog
    const addAttributeButton = await screen.findByTestId(
      "add-attribute-dialog-button"
    );
    userEvent.click(addAttributeButton);

    // Verify dialog is open
    expect(screen.getByTestId("close-button")).toBeInTheDocument();

    // Verify attribute selector is present
    expect(screen.getByText("Attribute Selector")).toBeInTheDocument();

    // Test closing with "Discard Changes" button
    const discardButton = screen.getByTestId("cancel-add-element-button");
    userEvent.click(discardButton);

    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen dialog
    userEvent.click(addAttributeButton);

    // Test closing with X button
    const closeButton = screen.getByTestId("close-button");
    userEvent.click(closeButton);

    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen dialog one more time to test save
    userEvent.click(addAttributeButton);

    // Click save button
    const saveButton = screen.getByTestId("add-element-button-2");
    userEvent.click(saveButton);

    // Verify dialog is closed and dispatch was called
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it("handles invalid selectedResource - this will never happen", () => {
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObj);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="invalid-resource-id"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Verify elements are cleared when selectedResource is null
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("handles changing tab without dirty form", async () => {
    // Mock clean form state
    const cleanFormMock = {
      ...mockFormikObj,
      dirty: false,
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Find and click the disposition tab
    const dispositionTab = await screen.findByRole("tab", {
      name: "disposition",
    });
    userEvent.click(dispositionTab);

    // Verify tab changed without opening dialog
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("handles onCancel button click", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObj);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const closeButton = await screen.findByTestId(
      "close-resource-editor-button"
    );
    userEvent.click(closeButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("changes active tab when form is not dirty", async () => {
    const cleanFormMock = {
      ...mockFormikObj,
      dirty: false,
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Find all tabs
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);

    // Click the second tab (index 1)
    userEvent.click(tabs[1]);

    // Verify tab changed by checking aria-selected attribute
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("should delete selected attribute and dispatch event to update test case json state", async () => {
    const cleanFormMock = {
      ...mockFormikObj,
      dirty: false,
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);
    const mockDispatch = jest.fn();

    // We are testing to see if "Id" attribute is deleted accurately
    const expectedPayload = {
      payload: {
        ...mockResourceState.bundle.entry[0],
        resource: {
          ...mockResourceState.bundle.entry[0].resource,
        },
      },
      type: "ModifyBundleEntry",
    };

    delete expectedPayload?.payload?.resource?.id;

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: mockDispatch }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const actionCenter = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    userEvent.click(actionCenter);

    const deleteButton = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    userEvent.click(deleteButton);

    const deleteDialog = await screen.findByRole("dialog", {
      name: "Delete Element",
    });
    expect(deleteDialog).toBeInTheDocument();
    const deleteConfirmationButton = await screen.findByRole("button", {
      name: "Yes, Delete",
    });
    expect(deleteConfirmationButton).toBeEnabled();

    userEvent.click(deleteConfirmationButton);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(expectedPayload);
  });
});
describe("Test the ResourceEditor deleteMultipleElements functionality", () => {
  it("Should call dispatch with correct payload when deleting multiple elements", async () => {
    const mockDispatch = jest.fn();

    deleteMultipleCardinalityElement(
      " *name 1",
      [{}],
      mockSelectedPatientTree,
      "Patient.name[0]",
      mockDispatch
    );
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
