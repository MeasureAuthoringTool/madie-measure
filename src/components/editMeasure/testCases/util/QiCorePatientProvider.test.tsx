import React from "react";
import { resourceReducer, ResourceActionType } from "./QiCorePatientProvider";

describe("QiCorePatientProvider reducer", () => {
  it("LOAD_BUNDLE replaces bundle", () => {
    const state: any = { bundle: null };
    const action = {
      type: ResourceActionType.LOAD_BUNDLE,
      payload: { id: "b1" },
    };
    const result = resourceReducer(state, action);
    expect(result.bundle).toEqual({ id: "b1" });
  });

  it("ADD_BUNDLE_ENTRY initializes empty entry array then adds", () => {
    const state: any = { bundle: { entry: [] } };
    const action = {
      type: ResourceActionType.ADD_BUNDLE_ENTRY,
      payload: { resource: { id: "r1" } },
    };
    const result = resourceReducer(state, action);
    expect(result.bundle.entry).toHaveLength(1);
    expect(result.bundle.entry[0].resource.id).toBe("r1");
  });

  it("ADD_BUNDLE_ENTRY appends to existing entries", () => {
    const state: any = { bundle: { entry: [{ resource: { id: "r1" } }] } };
    const action = {
      type: ResourceActionType.ADD_BUNDLE_ENTRY,
      payload: { resource: { id: "r2" } },
    };
    const result = resourceReducer(state, action);
    expect(result.bundle.entry.map((e) => e.resource.id)).toEqual(["r1", "r2"]);
  });

  it("REMOVE_BUNDLE_ENTRY filters matching resource id", () => {
    const state: any = {
      bundle: {
        entry: [{ resource: { id: "r1" } }, { resource: { id: "r2" } }],
      },
    };
    const action = {
      type: ResourceActionType.REMOVE_BUNDLE_ENTRY,
      payload: { resource: { id: "r1" } },
    };
    const result = resourceReducer(state, action);
    expect(result.bundle.entry).toHaveLength(1);
    expect(result.bundle.entry[0].resource.id).toBe("r2");
  });

  it("MODIFY_BUNDLE_ENTRY replaces matching resource entry", () => {
    const state: any = {
      bundle: {
        entry: [
          { resource: { id: "r1", value: 1 } },
          { resource: { id: "r2" } },
        ],
      },
    };
    const action = {
      type: ResourceActionType.MODIFY_BUNDLE_ENTRY,
      payload: { resource: { id: "r1", value: 99 } },
    };
    const result = resourceReducer(state, action);
    const updated = result.bundle.entry.find((e) => e.resource.id === "r1");
    expect(updated.resource.value).toBe(99);
  });

  it("throws on unknown action type", () => {
    const state: any = { bundle: null };
    expect(() =>
      resourceReducer(state, { type: "UNKNOWN" as any, payload: {} })
    ).toThrow(/Unhandled action type/);
  });
});
