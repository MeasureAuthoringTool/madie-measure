import * as React from "react";
import ElementEditorActionCenter from "./ElementEditorActionCenter";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("ElementEditorActionCenter Component", () => {
  const mockHandleDelete = jest.fn();

  it("should render Action Center for a zero to one elements", async () => {
    const mockRootDefinition = {
      sliceName: "test-sliceName",
      path: "test-observation",
      min: 0,
      max: 1,
    };
    render(
      <ElementEditorActionCenter
        rootDefinition={mockRootDefinition}
        numElements={1}
        handleDelete={mockHandleDelete}
        addElementOfMultipleCardinality={jest.fn()}
        elementValue={[
          {
            family: "IPPFail",
            given: ["EncounterInMPNotDone"],
          },
        ]}
        elementName={" *name "}
      />
    );
    const actionCenterButton = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    userEvent.click(actionCenterButton);

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

    expect(mockHandleDelete).toHaveBeenCalledTimes(1);
    expect(mockHandleDelete).toHaveBeenCalledWith(
      "test-observation",
      [{ family: "IPPFail", given: ["EncounterInMPNotDone"] }],
      " *name "
    );
  });

  it("should render Action Center for zero to many elements", async () => {
    const mockRootDefinition = {
      sliceName: "test-sliceName",
      path: "test-observation",
      min: 0,
      max: "*",
    };
    render(
      <ElementEditorActionCenter
        rootDefinition={mockRootDefinition}
        numElements={1}
        handleDelete={mockHandleDelete}
      />
    );
    const actionCenterButton = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    userEvent.click(actionCenterButton);

    expect(
      await screen.findByRole("menuitem", {
        name: "Add",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("menuitem", {
        name: "Delete",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("menuitem", { name: "Clone" })
    ).toBeInTheDocument();
  });

  it("should show Clone action and call cloneElementOfMultipleCardinality on click", async () => {
    const mockRootDefinition = {
      sliceName: "test-sliceName",
      path: "test-observation",
      min: 0,
      max: "*",
    };
    const mockClone = jest.fn();
    render(
      <ElementEditorActionCenter
        rootDefinition={mockRootDefinition}
        numElements={1}
        handleDelete={mockHandleDelete}
        addElementOfMultipleCardinality={jest.fn()}
        cloneElementOfMultipleCardinality={mockClone}
        elementValue={{}}
        elementName="name"
      />
    );

    userEvent.click(
      await screen.findByTestId("elements-action-center-actual-icon")
    );

    const cloneButton = await screen.findByRole("menuitem", { name: "Clone" });
    expect(cloneButton).toBeInTheDocument();
    userEvent.click(cloneButton);
    expect(mockClone).toHaveBeenCalledTimes(1);
  });

  it("should NOT show Clone action for 0..1 cardinality", async () => {
    const mockRootDefinition = {
      path: "test-observation",
      min: 0,
      max: 1,
    };
    render(
      <ElementEditorActionCenter
        rootDefinition={mockRootDefinition}
        numElements={1}
        handleDelete={mockHandleDelete}
        addElementOfMultipleCardinality={jest.fn()}
        elementValue={{}}
        elementName="name"
      />
    );

    userEvent.click(
      await screen.findByTestId("elements-action-center-actual-icon")
    );

    expect(
      screen.queryByRole("menuitem", { name: "Clone" })
    ).not.toBeInTheDocument();
  });

  it("should render Action Center for one to many elements and there is only 1 element in the resource, trigger onAdd", async () => {
    const mockRootDefinition = {
      sliceName: "test-sliceName",
      path: "test-observation",
      min: 1,
      max: "*",
    };
    const addElementOfMultipleCardinality = jest.fn();
    render(
      <ElementEditorActionCenter
        addElementOfMultipleCardinality={addElementOfMultipleCardinality}
        rootDefinition={mockRootDefinition}
        numElements={1}
        handleDelete={mockHandleDelete}
      />
    );
    const actionCenterButton = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    userEvent.click(actionCenterButton);

    const addButton = await screen.findByRole("menuitem", {
      name: "Add",
    });
    expect(addButton).toBeInTheDocument();
    userEvent.click(addButton);
    expect(addElementOfMultipleCardinality).toHaveBeenCalled();
    // if it is a required field and only 1 element is available then we can't delete it
    expect(
      screen.queryByRole("menuitem", {
        name: "Delete",
      })
    ).not.toBeInTheDocument();
  });

  it("should render Action Center for one to many elements and there are more than 1 element in the resource", async () => {
    const mockRootDefinition = {
      sliceName: "test-sliceName",
      path: "test-observation",
      min: 1,
      max: "*",
    };
    render(
      <ElementEditorActionCenter
        rootDefinition={mockRootDefinition}
        numElements={4}
        handleDelete={mockHandleDelete}
      />
    );
    const actionCenterButton = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    userEvent.click(actionCenterButton);

    expect(
      await screen.findByRole("menuitem", {
        name: "Add",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("menuitem", {
        name: "Delete",
      })
    ).toBeInTheDocument();
  });
});
