import { handleCancel, handleRowEdit } from "./BuilderUtils";
import { scrollToElementByIdWhenAvailable } from "./Builder";

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
});
