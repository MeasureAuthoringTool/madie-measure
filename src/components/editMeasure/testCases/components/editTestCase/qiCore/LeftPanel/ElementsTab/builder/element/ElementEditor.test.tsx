import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ElementEditor from "./ElementEditor";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";
import { QiCoreResourceContext } from "../../../../../../../util/QiCorePatientProvider";
import mockPatientState from "../resource/mockResourceState.json";
jest.mock("../../../../../../../api/useFhirDefinitionsService");
jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => {
  const actualModule = jest.requireActual(
    "../../../../../../../api/fhirDefinitionServiceUtilities"
  );
  return {
    ...actualModule,
    getBasePath: jest.fn().mockReturnValue("ClaimResponse"),
    getAllChildren: jest.fn().mockReturnValue([
      { id: "ClaimResponse", path: "ClaimResponse" },
      {
        id: "ClaimResponse.id",
        path: "ClaimResponse",
        type: [{ code: "string" }],
      },
      {
        id: "ClaimResponse.dispostion",
        path: "ClaimResponse.dispostion",
        type: [{ code: "string" }],
      },
      {
        id: "ClaimResponse.extension",
        path: "ClaimResponse.extension",
        type: [{ code: "Extension" }],
      },
      {
        id: "ClaimResponse.effective[x]",
        path: "ClaimResponse.effective[x]",
        type: [{ code: "dateTime" }],
      },
    ]),
    isComponentDataType: jest.fn().mockReturnValue(false),
    getTopLevelElements: jest.fn().mockReturnValue([]),
    stripResourcePath: jest.fn().mockReturnValue("ClaimResponse.id"),
    updateChildrenPaths: jest.fn().mockReturnValue([]),
  };
});
const mockFormikObj = {
  touched: {},
  errors: {},
  values: {},
  isSubmitting: false,
  setFieldValue: undefined,
  dirty: false,
  resetForm: jest.fn(),
};

jest.mock("formik", () => ({
  useFormikContext: () => {
    return mockFormikObj;
  },
  getIn: (context: Record<string, unknown>, fieldName: string) => {
    return context[fieldName];
  },
}));

jest.mock("./ElementEditorChildren", () => () => (
  <div>ElementEditorChildren</div>
));

describe("ElementEditor Component", () => {
  const mockOnChange = jest.fn();
  const mockElementDefinition = {
    id: "qicore-claimresponse",
    path: "ClaimResponse",
    type: "ClaimResponse",
    snapshot: {
      element: [
        { id: "ClaimResponse", path: "ClaimResponse" },
        {
          id: "ClaimResponse.id",
          path: "ClaimResponse",
          type: [{ code: "string" }],
        },
        {
          id: "ClaimResponse.dispostion",
          path: "ClaimResponse.dispostion",
          type: [{ code: "string" }],
        },
        {
          id: "ClaimResponse.extension",
          path: "ClaimResponse.extension",
          type: [{ code: "Extension" }],
        },
      ],
    },
  };

  const mockResource = {
    ClaimResponse: {
      id: "test",
      Coding: {
        code: "",
        id: "",
        extension: {},
        system: "",
        version: "",
        display: "",
        userSelected: false,
      },
    },
  };

  const mockSelectedResource = {
    bundleEntry: { resource: mockResource },
    definition: mockElementDefinition,
  };

  const mockFhirDefinitionsService = {
    getAllChildren: jest
      .fn()
      .mockReturnValue(mockElementDefinition.snapshot.element),
    isComponentDataType: jest.fn().mockReturnValue(false),
    getTopLevelElements: jest.fn().mockReturnValue([]),
    stripResourcePath: jest.fn().mockReturnValue("ClaimResponse.id"),
    getResourceTree: jest.fn().mockResolvedValue({}),
  };

  const mockDisplayedElementsTree = {
    ClaimResponse: {
      created: true,
      id: true,
      insurer: true,
      outcome: true,
      patient: true,
      status: true,
      type: true,
      use: true,
    },
  };

  const renderElementEditor = (
    selectedResource: any,
    resource: any,
    elementDefinition: any,
    resourcePath: any,
    onChange: any,
    canEdit: any,
    displayedElementsTree: any,
    setValidationSchema: any,
    setInitialFormikValuesStu6: any,
    dispatch: any,
    setLastAddedElemPath = jest.fn(),
    applyLoading = false,
    setApplyLoading = jest.fn()
  ) => {
    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockPatientState, dispatch }}
      >
        <ElementEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={setValidationSchema}
          setInitialFormikValuesStu6={setInitialFormikValuesStu6}
          selectedResource={selectedResource}
          resource={resource}
          elementDefinition={elementDefinition}
          resourcePath={resourcePath}
          onChange={onChange}
          canEdit={canEdit}
          displayedElementsTree={displayedElementsTree}
          setLastAddedElemPath={setLastAddedElemPath}
          applyLoading={applyLoading}
          setApplyLoading={setApplyLoading}
        />
      </QiCoreResourceContext.Provider>
    );
  };

  beforeEach(() => {
    (useFhirDefinitionsServiceApi as jest.Mock).mockReturnValue(
      mockFhirDefinitionsService
    );
  });

  test("renders without crashing when elementDefinition is provided. buttons disabled", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    const dispatch = jest.fn();
    renderElementEditor(
      mockSelectedResource,
      mockResource,
      mockElementDefinition,
      "ClaimResponse",
      mockOnChange,
      true,
      mockDisplayedElementsTree,
      setValidationSchema,
      setInitialFormikValuesStu6,
      dispatch
    );
    await waitFor(() =>
      expect(mockFhirDefinitionsService.getResourceTree).toHaveBeenCalled()
    );

    const elementEditorChildrenMock = await screen.findByText(
      "ElementEditorChildren"
    );
    expect(elementEditorChildrenMock).toBeInTheDocument();
    const undoButton = screen.getByTestId("element-editor-undo-button");
    const submitButton = screen.getByTestId("element-editor-submit-button");
    expect(undoButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  test("renders without crashing when elementDefinition is provided, trigger buttons", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    const mockResetForm = jest.fn();
    const dispatch = jest.fn();
    mockFormikObj.resetForm = mockResetForm;
    mockFormikObj.dirty = true;
    const mockFormikValues = {
      ClaimResponse: {
        id: "test",
      },
    };
    mockFormikObj.values = mockFormikValues;
    renderElementEditor(
      mockSelectedResource,
      mockResource,
      mockElementDefinition,
      "ClaimResponse",
      mockOnChange,
      true,
      mockDisplayedElementsTree,
      setValidationSchema,
      setInitialFormikValuesStu6,
      dispatch
    );
    await waitFor(() =>
      expect(mockFhirDefinitionsService.getResourceTree).toHaveBeenCalled()
    );

    const elementEditorChildrenMock = await screen.findByText(
      "ElementEditorChildren"
    );
    expect(elementEditorChildrenMock).toBeInTheDocument();
    const undoButton = screen.getByTestId("element-editor-undo-button");
    const submitButton = screen.getByTestId("element-editor-submit-button");
    expect(undoButton).toBeEnabled();
    expect(submitButton).toBeEnabled();
    userEvent.click(undoButton);
    await waitFor(() => {
      expect(mockResetForm).toHaveBeenCalled();
    });
    userEvent.click(submitButton);
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalled();
      expect(
        screen.getByTestId("edit-attribute-success-text")
      ).toBeInTheDocument();
    });
    userEvent.click(screen.getByTestId("close-toast-button"));
    expect(
      screen.queryByTestId("edit-attribute-success-text")
    ).not.toBeInTheDocument();
  });

  test("renders a fallback when no elementDefinition is provided", () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    const dispatch = jest.fn();

    renderElementEditor(
      mockSelectedResource,
      mockResource,
      null,
      "ClaimResponse",
      mockOnChange,
      true,
      mockDisplayedElementsTree,
      setValidationSchema,
      setInitialFormikValuesStu6,
      dispatch
    );
    expect(screen.getByText("No element selected")).toBeInTheDocument();
  });

  test("checks loading state", async () => {
    const setInitialFormikValuesStu6 = jest.fn();
    const setValidationSchema = jest.fn();
    const dispatch = jest.fn();

    renderElementEditor(
      mockSelectedResource,
      mockResource,
      mockElementDefinition,
      "ClaimResponse",
      mockOnChange,
      true,
      mockDisplayedElementsTree,
      setValidationSchema,
      setInitialFormikValuesStu6,
      dispatch
    );
    expect(screen.queryByText("ElementEditorChildren")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("ElementEditorChildren")).toBeInTheDocument();
    });
  });

  it("Disables the apply button when formik errors exist for the resource path", async () => {
    const mockFormikValues = {
      ClaimResponse: {
        disposition: "test",
      },
    };
    mockFormikObj.values = mockFormikValues;
    mockFormikObj.errors = {
      ClaimResponse: {
        disposition: "Required field",
      },
    };
    mockFormikObj.dirty = true;

    const mockedElementDefinition = {
      id: "ClaimResponse.disposition",
      path: "ClaimResponse.disposition",
    };

    renderElementEditor(
      mockSelectedResource,
      mockResource,
      mockedElementDefinition,
      "ClaimResponse",
      mockOnChange,
      true,
      mockDisplayedElementsTree,
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    await waitFor(() =>
      expect(mockFhirDefinitionsService.getResourceTree).toHaveBeenCalled()
    );

    const elementEditorChildrenMock = await screen.findByText(
      "ElementEditorChildren"
    );
    expect(elementEditorChildrenMock).toBeInTheDocument();

    const submitButton = screen.getByTestId("element-editor-submit-button");
    expect(submitButton).toBeDisabled();
  });

  it("Enables the apply button when no formik errors exist for the resource path", async () => {
    const mockFormikValues = {
      ClaimResponse: {
        disposition: "test",
      },
    };
    mockFormikObj.values = mockFormikValues;
    mockFormikObj.errors = {};
    mockFormikObj.dirty = true;

    const mockedElementDefinition = {
      id: "ClaimResponse.disposition",
      path: "ClaimResponse.disposition",
    };

    renderElementEditor(
      mockSelectedResource,
      mockResource,
      mockedElementDefinition,
      "ClaimResponse",
      mockOnChange,
      true,
      mockDisplayedElementsTree,
      jest.fn(),
      jest.fn(),
      jest.fn()
    );

    await waitFor(() =>
      expect(mockFhirDefinitionsService.getResourceTree).toHaveBeenCalled()
    );

    const elementEditorChildrenMock = await screen.findByText(
      "ElementEditorChildren"
    );
    expect(elementEditorChildrenMock).toBeInTheDocument();

    const submitButton = screen.getByTestId("element-editor-submit-button");
    expect(submitButton).toBeEnabled();
  });
});
