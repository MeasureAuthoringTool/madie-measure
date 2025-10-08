import React from "react";
import { render, screen, act } from "@testing-library/react";
import {
  QiCoreResourceProvider,
  useQiCoreResource,
  ResourceActionType,
} from "./QiCorePatientProvider";

// Helper component to test context
const TestComponent = () => {
  const { state, dispatch } = useQiCoreResource();

  const handleDispatch = (type, payload) => {
    dispatch({ type, payload });
  };

  return (
    <div>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.LOAD_BUNDLE, {
            id: "bundle-1",
            entry: [],
          })
        }
      >
        Load Bundle
      </button>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.ADD_BUNDLE_ENTRY, {
            resource: { id: "res-1" },
          })
        }
      >
        Add Entry
      </button>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.REMOVE_BUNDLE_ENTRY, {
            resource: { id: "res-1" },
          })
        }
      >
        Remove Entry
      </button>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.MODIFY_BUNDLE_ENTRY, {
            resource: { id: "res-1", modified: true },
          })
        }
      >
        Modify Entry
      </button>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.ADD_RESOURCE_BY_REFERENCE, {
            bundleEntry: { resource: { id: "res-1", modified: true } },
            add_new_resource: { resource: { id: "res-2" } },
          })
        }
      >
        Add Resource by Reference
      </button>
      <div data-testid="bundle">{JSON.stringify(state.bundle)}</div>
    </div>
  );
};

describe("QiCoreResourceContext", () => {
  it("handles all reducer actions correctly", () => {
    render(
      <QiCoreResourceProvider>
        <TestComponent />
      </QiCoreResourceProvider>
    );

    const bundleDisplay = screen.getByTestId("bundle");

    // LOAD_BUNDLE
    act(() => {
      screen.getByText("Load Bundle").click();
    });
    expect(bundleDisplay.textContent).toContain("bundle-1");

    // ADD_BUNDLE_ENTRY
    act(() => {
      screen.getByText("Add Entry").click();
    });
    expect(bundleDisplay.textContent).toContain("res-1");

    // MODIFY_BUNDLE_ENTRY
    act(() => {
      screen.getByText("Modify Entry").click();
    });
    expect(bundleDisplay.textContent).toContain("modified");

    // REMOVE_BUNDLE_ENTRY
    act(() => {
      screen.getByText("Remove Entry").click();
    });
    expect(bundleDisplay.textContent).not.toContain("res-1");

    // ADD_RESOURCE_BY_REFERENCE
    act(() => {
      screen.getByText("Add Resource by Reference").click();
    });
    expect(bundleDisplay.textContent).toContain("res-2");
  });
});
