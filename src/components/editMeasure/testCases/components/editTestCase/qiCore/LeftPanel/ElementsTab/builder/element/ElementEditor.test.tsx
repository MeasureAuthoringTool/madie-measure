import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useFormik } from "formik";
import ElementEditor from "./ElementEditor";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";

jest.mock("../../../../../../../api/useFhirDefinitionsService");

jest.mock("../../../../../../../api/fhirDefinitionServiceUtilities", () => {
  return {
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
    ]),
    isComponentDataType: jest.fn().mockReturnValue(false),
    getTopLevelElements: jest.fn().mockReturnValue([]),
    stripResourcePath: jest.fn().mockReturnValue("ClaimResponse.id"),
    updateChildrenPaths: jest.fn().mockReturnValue([]),
  };
});
jest.mock("formik", () => ({
  ...jest.requireActual("formik"),
  useFormik: jest.fn(),
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

  beforeEach(() => {
    useFhirDefinitionsServiceApi.mockReturnValue(mockFhirDefinitionsService);
    useFormik.mockReturnValue({
      values: {},
      setFieldValue: jest.fn(),
      errors: {},
      touched: {},
      handleSubmit: jest.fn(),
    });
  });

  test("renders without crashing when elementDefinition is provided", async () => {
    render(
      <ElementEditor
        selectedResource={mockSelectedResource}
        resource={mockResource}
        elementDefinition={mockElementDefinition}
        resourcePath="ClaimResponse"
        onChange={mockOnChange}
        canEdit={true}
      />
    );

    await waitFor(() =>
      expect(mockFhirDefinitionsService.getResourceTree).toHaveBeenCalled()
    );

    const elementEditorChildrenMock = await screen.findByText(
      "ElementEditorChildren"
    );
    expect(elementEditorChildrenMock).toBeInTheDocument();
  });

  test("renders a fallback when no elementDefinition is provided", () => {
    render(
      <ElementEditor
        selectedResource={mockSelectedResource}
        resource={mockResource}
        elementDefinition={null}
        resourcePath="ClaimResponse"
        onChange={mockOnChange}
        canEdit={true}
      />
    );

    expect(screen.getByText("No element selected")).toBeInTheDocument();
  });

  test("checks loading state", async () => {
    render(
      <ElementEditor
        selectedResource={mockSelectedResource}
        resource={mockResource}
        elementDefinition={mockElementDefinition}
        resourcePath="ClaimResponse"
        onChange={mockOnChange}
        canEdit={true}
      />
    );

    expect(screen.queryByText("ElementEditorChildren")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("ElementEditorChildren")).toBeInTheDocument();
    });
  });
});
