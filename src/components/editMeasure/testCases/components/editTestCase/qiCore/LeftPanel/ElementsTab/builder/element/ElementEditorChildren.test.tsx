import * as React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ElementEditorChildren from "./ElementEditorChildren";
import {
  ResourceActionType,
  QiCoreResourceContext,
} from "../../../../../../../util/QiCorePatientProvider";
import { FormikProvider } from "formik";

// Controls whether the TypeEditor mock renders real ElementSectionQiCore panels
let mockRenderSections = false;

jest.mock("./TypeEditor", () => {
  return {
    __esModule: true,
    default: () => {
      const React = require("react");
      if (mockRenderSections) {
        const ElementSectionQiCore = jest.requireActual(
          "./ElementSectionQiCore"
        ).default;
        return React.createElement(
          ElementSectionQiCore,
          { title: "mock-sub-section", startOpen: true },
          React.createElement("span", null, "child content")
        );
      }
      return React.createElement("div", { "data-testid": "type-editor" });
    },
  };
});

const mockPatientState = {
  bundle: {
    id: "46062e7b-b57a-4e40-a9bf-2343080b94a2",
    resourceType: "Bundle",
    type: "collection",
    entry: [
      {
        fullUrl:
          "https://madie.cms.gov/ClaimResponse/fb0b4321-ccce-45c2-b5ee-bee2517e07cd",
        resource: {
          id: "6fb9d817-76c5-4b68-ba06-92c7429e6b5c",
          resourceType: "ClaimResponse",
          disposition: "Claim response disposition",
          meta: {
            profile: [
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-claimresponse",
            ],
          },
        },
      },
    ],
  },
};
describe("ElementEditorChildren", () => {
  beforeEach(() => {
    mockRenderSections = false;
  });

  const defaultProps = {
    setLastAddedElemPath: jest.fn(),
    selectedResourceID: "6fb9d817-76c5-4b68-ba06-92c7429e6b5c",
    parentStructureDefinition: { id: "Patient" },
    rootDefinition: {
      id: "Patient.name",
      path: "Patient.name",
      min: "1",
      max: "*",
    },
    currentDepth: 0,
    resource: {
      name: [{}],
    },
    canEdit: true,
    resourcePath: "Patient",
    deleteElement: jest.fn(),
  };

  it("renders header and calls addElementOfMultipleCardinality when add button clicked", async () => {
    const dispatch = jest.fn();

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: mockPatientState, dispatch }}
        >
          <ElementEditorChildren {...defaultProps} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    expect(screen.getByText("*Name")).toBeInTheDocument(); // header from rootDefinition.id
    expect(screen.getByTestId("type-editor")).toBeInTheDocument();
    userEvent.click(screen.getByTestId("elements-action-center-actual-icon"));

    const addButton = screen.getByTestId("elements-add");
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
        payload: expect.anything(),
      });
    });

    expect(defaultProps.setLastAddedElemPath).toHaveBeenCalledWith(
      "Patient.name"
    );
  });

  it("does not render ElementEditorActionCenter when canEdit is false", () => {
    const dispatch = jest.fn();

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: mockPatientState, dispatch }}
        >
          <ElementEditorChildren {...defaultProps} canEdit={false} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    expect(screen.getByText("*Name")).toBeInTheDocument();
    expect(screen.getByTestId("type-editor")).toBeInTheDocument();
    expect(
      screen.queryByTestId("elements-action-center-actual-icon")
    ).not.toBeInTheDocument();
  });

  it("does not render Expand All / Collapse All buttons when no sub-attribute panels are rendered", () => {
    const dispatch = jest.fn();
    mockRenderSections = false;

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: mockPatientState, dispatch }}
        >
          <ElementEditorChildren {...defaultProps} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    expect(screen.queryByTestId("expand-all-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("collapse-all-button")).not.toBeInTheDocument();
  });

  it("renders Expand All and Collapse All buttons when sub-attribute panels are rendered", async () => {
    const dispatch = jest.fn();
    mockRenderSections = true;

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: mockPatientState, dispatch }}
        >
          <ElementEditorChildren {...defaultProps} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    expect(await screen.findByTestId("expand-all-button")).toBeInTheDocument();
    expect(screen.getByTestId("collapse-all-button")).toBeInTheDocument();
    expect(screen.getByText("Expand All")).toBeInTheDocument();
    expect(screen.getByText("Collapse All")).toBeInTheDocument();
  });

  it("clicking Expand All button does not throw", async () => {
    const dispatch = jest.fn();
    mockRenderSections = true;

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: mockPatientState, dispatch }}
        >
          <ElementEditorChildren {...defaultProps} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    const expandBtn = await screen.findByTestId("expand-all-button");
    expect(() => fireEvent.click(expandBtn)).not.toThrow();
  });

  it("clicking Collapse All button does not throw", async () => {
    const dispatch = jest.fn();
    mockRenderSections = true;

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: mockPatientState, dispatch }}
        >
          <ElementEditorChildren {...defaultProps} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    const collapseBtn = await screen.findByTestId("collapse-all-button");
    expect(() => fireEvent.click(collapseBtn)).not.toThrow();
  });

  it("dispatches MODIFY_BUNDLE_ENTRY with cloned element when clone button clicked", async () => {
    const dispatch = jest.fn();
    const stateWithName = {
      bundle: {
        ...mockPatientState.bundle,
        entry: [
          {
            ...mockPatientState.bundle.entry[0],
            resource: {
              ...mockPatientState.bundle.entry[0].resource,
              name: [{ family: "Smith" }, { family: "Jones" }],
            },
          },
        ],
      },
    };
    const propsWithArrayName = {
      ...defaultProps,
      rootDefinition: {
        id: "Patient.name[0]",
        path: "Patient.name",
        min: "1",
        max: "*",
      },
      resource: {
        name: [{ family: "Smith" }, { family: "Jones" }],
      },
    };

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: stateWithName, dispatch }}
        >
          <ElementEditorChildren {...propsWithArrayName} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    userEvent.click(screen.getByTestId("elements-action-center-actual-icon"));

    const cloneButton = await screen.findByTestId("elements-clone");
    userEvent.click(cloneButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
        })
      );
    });

    const call = dispatch.mock.calls.find(
      (c) => c[0].type === ResourceActionType.MODIFY_BUNDLE_ENTRY
    );
    const updatedName = call[0].payload.resource.name;
    expect(updatedName).toHaveLength(3);
    expect(updatedName[2]).toEqual({ family: "Smith" }); // clone of index 0
  });

  it("wraps a non-array value into [original, clone] when cloning a multi-cardinality element stored as a plain object", async () => {
    // This covers the else-if branch: rootDefinition.id has no bracket index
    // (ResourceEditor returns an element without [N] when the JSON value is not yet an array),
    // so getIndexFromPathWithoutBrackets returns null. The clone handler should wrap the
    // existing single value together with its deep copy into an array.
    const dispatch = jest.fn();
    const stateWithSingleObject = {
      bundle: {
        ...mockPatientState.bundle,
        entry: [
          {
            ...mockPatientState.bundle.entry[0],
            resource: {
              ...mockPatientState.bundle.entry[0].resource,
              name: { family: "Jones" }, // plain object, not an array
            },
          },
        ],
      },
    };
    const propsNoIndex = {
      ...defaultProps,
      rootDefinition: {
        id: "Patient.name", // no [N] — index will be null
        path: "Patient.name",
        min: "0",
        max: "*",
      },
      resource: {
        name: { family: "Jones" },
      },
    };

    render(
      <FormikProvider value={{}}>
        <QiCoreResourceContext.Provider
          value={{ state: stateWithSingleObject, dispatch }}
        >
          <ElementEditorChildren {...propsNoIndex} />
        </QiCoreResourceContext.Provider>
      </FormikProvider>
    );

    userEvent.click(screen.getByTestId("elements-action-center-actual-icon"));
    const cloneButton = await screen.findByTestId("elements-clone");
    userEvent.click(cloneButton);

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
        })
      );
    });

    const call = dispatch.mock.calls.find(
      (c) => c[0].type === ResourceActionType.MODIFY_BUNDLE_ENTRY
    );
    const updatedName = call[0].payload.resource.name;
    expect(Array.isArray(updatedName)).toBe(true);
    expect(updatedName).toHaveLength(2);
    expect(updatedName[0]).toEqual({ family: "Jones" }); // original preserved
    expect(updatedName[1]).toEqual({ family: "Jones" }); // deep clone
    expect(updatedName[0]).not.toBe(updatedName[1]); // different references
  });
});
