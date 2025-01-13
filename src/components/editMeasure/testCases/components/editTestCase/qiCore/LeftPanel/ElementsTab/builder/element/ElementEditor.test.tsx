import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useFormik } from "formik";
import ElementEditor from "./ElementEditor";
import useFhirDefinitionsServiceApi from "../../../../../../../api/useFhirDefinitionsService";

jest.mock("../../../../../../../api/useFhirDefinitionsService");
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
    id: "ClaimResponse.id",
    path: "ClaimResponse",
    type: [{ code: "string" }],
  };
  const mockAllChildren = [
    {
      id: "ClaimResponse.code",
      path: "ClaimResponse.code",
      type: [{ code: "string" }],
    },
    {
      id: "ClaimResponse.extension",
      path: "ClaimResponse.extension",
      type: [{ code: "string" }],
    },
  ];

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

  const mockFhirDefinitionsService = {
    getAllChildren: jest.fn().mockReturnValue([]),
    isComponentDataType: jest.fn().mockReturnValue(false),
    getResourceTree: jest.fn().mockResolvedValue({}),
    getTopLevelElements: jest.fn().mockReturnValue([]),
    stripResourcePath: jest.fn().mockReturnValue("ClaimResponse.id"),
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
        selectedResource={mockResource}
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
        selectedResource={mockResource}
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
        selectedResource={mockResource}
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
