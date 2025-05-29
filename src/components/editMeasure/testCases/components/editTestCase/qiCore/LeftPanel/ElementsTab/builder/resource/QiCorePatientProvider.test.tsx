import * as React from "react";
import {
  QiCoreResourceAction,
  ResourceActionType,
  resourceReducer,
} from "../../../../../../../util/QiCorePatientProvider";

describe("QiCorePatientProvider", () => {
  it("should LOAD Bundle", () => {
    const state = { bundle: {} };
    const action: QiCoreResourceAction = {
      type: ResourceActionType.LOAD_BUNDLE,
      payload: {},
    } as unknown as QiCoreResourceAction;

    resourceReducer(state, action);
  });

  it("should ADD Bundle Entry", () => {
    const state = {};
    const action: QiCoreResourceAction = {
      type: ResourceActionType.ADD_BUNDLE_ENTRY,
      payload: {},
    } as unknown as QiCoreResourceAction;

    const result = resourceReducer(state, action);
    expect(result.bundle.entry.length).toBe(1);
  });
});
