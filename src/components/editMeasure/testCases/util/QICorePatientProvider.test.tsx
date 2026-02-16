import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
            add_new_resources: [{ resource: { id: "res-2" } }],
          })
        }
      >
        Add Resource by Reference
      </button>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.ADD_RESOURCE_BY_REFERENCE, {
            bundleEntry: {
              resource: { id: "res-1", modified: true, modifiedAgain: true },
            },
            add_new_resources: [{ resource: { id: "res-2" } }],
          })
        }
      >
        Add Resource by Reference 2
      </button>
      <button
        onClick={() =>
          handleDispatch(ResourceActionType.ADD_RESOURCE_BY_REFERENCE, {
            bundleEntry: {
              resource: { id: "res-1", multipleAdded: true },
            },
            add_new_resources: [
              { resource: { id: "res-3" } },
              { resource: { id: "res-4" } },
            ],
          })
        }
      >
        Add Multiple Resources by Reference
      </button>
      <button
        onClick={() =>
          handleDispatch("IDK", {
            bundleEntry: {
              resource: { id: "res-1", modified: true, modifiedAgain: true },
            },
            add_new_resources: [{ resource: { id: "res-2" } }],
          })
        }
      >
        Throw Error
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

    // MODIFY_BUNDLE_ENTRY_AGAIN
    act(() => {
      screen.getByText("Modify Entry").click();
    });
    expect(bundleDisplay.textContent).toContain("modified");
    act(() => {
      screen.getByText("Add Resource by Reference").click();
    });
    expect(bundleDisplay.textContent).toContain("res-2");

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

  it("handles ADD_RESOURCE_BY_REFERENCE with multiple resources in add_new_resources array", () => {
    render(
      <QiCoreResourceProvider>
        <TestComponent />
      </QiCoreResourceProvider>
    );

    const bundleDisplay = screen.getByTestId("bundle");

    // Load bundle first
    act(() => {
      screen.getByText("Load Bundle").click();
    });

    // Add initial entry
    act(() => {
      screen.getByText("Add Entry").click();
    });
    expect(bundleDisplay.textContent).toContain("res-1");

    // Add multiple resources at once
    act(() => {
      screen.getByText("Add Multiple Resources by Reference").click();
    });

    // Both new resources should be added
    expect(bundleDisplay.textContent).toContain("res-3");
    expect(bundleDisplay.textContent).toContain("res-4");
    // The bundle entry should be modified
    expect(bundleDisplay.textContent).toContain("multipleAdded");
  });

  test("throws error on unhandled action type", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <QiCoreResourceProvider>
        <TestComponent />
      </QiCoreResourceProvider>
    );
    expect(() => {
      act(() => {
        screen.getByText("Throw Error").click();
      });
    }).toThrow("Unhandled action type: IDK");

    consoleError.mockRestore();
  });
});

describe("QiCoreResourceProvider expose window for cypress", () => {
  beforeEach(() => {
    delete (window as any).Cypress;
    delete (window as any).store;
  });

  afterAll(() => {
    delete (window as any).Cypress;
    delete (window as any).store;
  });

  it("sets window.store when available", () => {
    (window as any).Cypress = true;

    render(
      <QiCoreResourceProvider>
        <TestComponent />
      </QiCoreResourceProvider>
    );

    expect((window as any).store).toBeDefined();
    expect((window as any).store).toEqual(
      expect.objectContaining({
        resource: null,
        bundle: null,
      })
    );
    act(() => {
      screen.getByText("Load Bundle").click();
    });

    expect((window as any).store.bundle).toEqual(
      expect.objectContaining({ id: "bundle-1" })
    );

    act(() => {
      screen.getByText("Add Entry").click();
    });

    const storeAfterAdd = (window as any).store;
    const entries = storeAfterAdd?.bundle?.entry ?? [];
    expect(entries.some((e: any) => e?.resource?.id === "res-1")).toBe(true);
  });
});
