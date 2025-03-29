import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import ResourceEditor from "./ResourceEditor";
import { QiCoreResourceContext } from "../../../../../../../util/QiCorePatientProvider";
import mockSelectedResource from "./mockSelectedResource.json";
import mockPatientState from "./mockPatientState.json";
import userEvent from "@testing-library/user-event";

jest.mock("../../../../../../../api/useFhirDefinitionsService", () => {
  return jest.fn(() => ({
    config: {
      serviceConfig: "fakeServiceConfig",
      accessToken: "fakeAccessToken",
      baseUrl: "fakeurl",
    },
  }));
});
jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => {
  const actualModule = jest.requireActual(
    "../../../../../../../api/fhirDefinitionServiceUtilities"
  );
  return {
    ...actualModule,
  };
});

const formikValues = {
  ClaimResponse: {
    id: "test",
    disposition: "test",
  },
};

const getProps = (label) => {
  if (label === "ClaimResponse.id") {
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

jest.mock("formik", () => ({
  useFormikContext: () => {
    return mockFormikObj;
  },
  getIn: (context: Record<string, unknown>, fieldName: string) => {
    return context[fieldName];
  },
}));

const { getByText, getByRole } = screen;
describe("ResourceEditor", () => {
  const mockOnCancel = jest.fn();
  it("renders the ResourceEditor correctly, can hit dirty check", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("ClaimResponse.id")).toBeInTheDocument();
      const stringInput = screen.getByTestId(
        "string-field-input-ClaimResponse.id"
      );
      expect(stringInput).toBeInTheDocument();
      expect(setValidationSchema).toHaveBeenCalled();
      expect(setInitialFormikValuesStu6).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("string-field-input-ClaimResponse.id").value
      ).toBe("6fb9d817-76c5-4b68-ba06-92c7429e6b5c");
    });
    const dispositionButton = screen.getByRole("tab", { name: "disposition" });

    expect(dispositionButton).toBeInTheDocument();
    userEvent.click(dispositionButton);
    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();
    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
    userEvent.click(dispositionButton);
    await waitFor(() => {
      expect(getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
      expect(resetForm).toHaveBeenCalled();
    });
  });
  it("renders the action center, opens when clicked", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText("ClaimResponse.id")).toBeInTheDocument();
      const stringInput = screen.getByTestId(
        "string-field-input-ClaimResponse.id"
      );
      expect(stringInput).toBeInTheDocument();
      expect(setValidationSchema).toHaveBeenCalled();
      expect(setInitialFormikValuesStu6).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("string-field-input-ClaimResponse.id").value
      ).toBe("6fb9d817-76c5-4b68-ba06-92c7429e6b5c");
    });
    const dispositionButton = screen.getByRole("tab", { name: "disposition" });

    expect(dispositionButton).toBeInTheDocument();
    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);
    await waitFor(() => {
      expect(screen.getByTestId("elements-copy")).toBeInTheDocument;
    });
    userEvent.click(actionCenter);
    expect(screen.getByTestId("elements-copy")).not.toBeInTheDocument;
  });

  it("opens AddElementDialog, interacts with it, and can close it", async () => {
    const mockSetInitialFormikValuesStu6 = jest.fn();
    const mockSetValidationSchema = jest.fn();
    const mockDispatch = jest.fn();

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: mockDispatch }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Click the "Add Attribute(s)" button to open dialog
    const addAttributeButton = screen.getByTestId(
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

  it("handles null selectedResource", () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="test-id"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={null}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Verify elements are cleared when selectedResource is null
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("handles changing tab without dirty form", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();

    // Mock clean form state
    const cleanFormMock = {
      ...mockFormikObj,
      dirty: false,
    };

    jest
      .spyOn(require("formik"), "useFormikContext")
      .mockReturnValue(cleanFormMock);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Find and click the disposition tab
    const dispositionTab = screen.getByRole("tab", { name: "disposition" });
    userEvent.click(dispositionTab);

    // Verify tab changed without opening dialog
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("handles onCancel button click", async () => {
    const mockOnCancel = jest.fn();
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Find and click the close button using the new test ID
    const closeButton = screen.getByTestId("close-resource-editor-button");
    userEvent.click(closeButton);

    // Verify onCancel was called with the selectedResource
    expect(mockOnCancel).toHaveBeenCalledWith(mockSelectedResource);
  });

  it("changes active tab when form is not dirty", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();

    // Mock clean form state
    const cleanFormMock = {
      ...mockFormikObj,
      dirty: false,
    };

    jest
      .spyOn(require("formik"), "useFormikContext")
      .mockReturnValue(cleanFormMock);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={mockSelectedResource}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Find all tabs
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);

    // Click the second tab (index 1)
    userEvent.click(tabs[1]);

    // Verify tab changed by checking aria-selected attribute
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });
});
