import {
  handleCancel,
  handleRowClone,
  handleRowDelete,
  handleRowEdit,
} from "./BuilderUtils";
import { scrollToElementByIdWhenAvailable } from "./Builder";
import { ResourceActionType } from "../../../../../../util/QiCorePatientProvider";

jest.mock("./Builder", () => ({
  scrollToElementByIdWhenAvailable: jest.fn(),
}));

describe("Builder handler functions", () => {
  const mockScroll = scrollToElementByIdWhenAvailable as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handleCancel calls setSelectedResourceId(null) and scrolls to savedGridID", () => {
    const setSelectedResourceId = jest.fn();
    const savedGridID = "action-center-123";

    handleCancel(setSelectedResourceId, savedGridID);

    expect(setSelectedResourceId).toHaveBeenCalledWith(null);
    expect(mockScroll).toHaveBeenCalledWith("action-center-123");
  });

  it("handleRowEdit calls setSelectedResourceId, scroll, and updates savedGridID", () => {
    const setSelectedResourceId = jest.fn();
    const setSavedGridID = jest.fn();

    const row = {
      resource: { id: "xyz-789" },
    };

    handleRowEdit(row, setSelectedResourceId, setSavedGridID);

    expect(setSelectedResourceId).toHaveBeenCalledWith("xyz-789");
    expect(mockScroll).toHaveBeenCalledWith("tc-builder-resource-editor");
    expect(setSavedGridID).toHaveBeenCalledWith("action-center-xyz-789");
  });

  it("dispatches on delete, nothing explodes.", () => {
    const row = { resource: { id: "abc-123" } };
    const dispatch = jest.fn();
    const setSelectedResourceId = jest.fn();

    handleRowDelete(row, setSelectedResourceId, dispatch);

    expect(dispatch).toHaveBeenCalledWith({
      type: ResourceActionType.REMOVE_BUNDLE_ENTRY,
      payload: row,
    });
  });

  it("handleRowClone dispatches ADD_BUNDLE_ENTRY with a deep-cloned entry and a new resource id", () => {
    const row = {
      fullUrl: "urn:uuid:abc-123",
      resource: {
        resourceType: "Encounter",
        id: "abc-123",
        meta: { profile: ["http://example.com/profile"] },
      },
    };
    const dispatch = jest.fn();

    handleRowClone(row, dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    const call = dispatch.mock.calls[0][0];
    expect(call.type).toBe(ResourceActionType.ADD_BUNDLE_ENTRY);
    // Cloned payload is a new object
    expect(call.payload).not.toBe(row);
    expect(call.payload.resource).not.toBe(row.resource);
    // Same shape but new id
    expect(call.payload.resource.resourceType).toBe("Encounter");
    expect(call.payload.resource.meta.profile).toEqual([
      "http://example.com/profile",
    ]);
    expect(call.payload.resource.id).toBeDefined();
    expect(call.payload.resource.id).not.toBe("abc-123");
    // fullUrl is updated to match new id
    expect(call.payload.fullUrl).toBe(`urn:uuid:${call.payload.resource.id}`);
    // Original row is untouched
    expect(row.resource.id).toBe("abc-123");
    expect(row.fullUrl).toBe("urn:uuid:abc-123");
  });

  it("handleRowClone handles entry without fullUrl", () => {
    const row = {
      resource: { resourceType: "Procedure", id: "pd-1" },
    };
    const dispatch = jest.fn();

    handleRowClone(row, dispatch);

    const call = dispatch.mock.calls[0][0];
    expect(call.type).toBe(ResourceActionType.ADD_BUNDLE_ENTRY);
    expect(call.payload.fullUrl).toBeUndefined();
    expect(call.payload.resource.id).not.toBe("pd-1");
  });
});
