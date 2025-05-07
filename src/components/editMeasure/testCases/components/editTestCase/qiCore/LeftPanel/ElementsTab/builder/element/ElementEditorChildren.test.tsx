import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ElementEditorChildren from "./ElementEditorChildren";
import {
  ResourceActionType,
  QiCoreResourceContext,
} from "../../../../../../../util/QiCorePatientProvider";
import mockPatientState from "../resource/mockResourceState.json";
import { FormikProvider } from "formik";

jest.mock("./TypeEditor", () => () => <div data-testid="type-editor" />);
describe("ElementEditorChildren", () => {
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

    expect(screen.getByText("*name")).toBeInTheDocument(); // header from rootDefinition.id
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
});
