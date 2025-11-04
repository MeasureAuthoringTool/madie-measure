import axios from "../../../../api/axios-instance";
import { ExcelExportService } from "./useExcelExportService";

jest.mock("../../../../api/axios-instance");

describe("useExcelExport Tests", () => {
  let excelExportService: ExcelExportService;
  beforeEach(() => {
    const getAccessToken = jest.fn();
    excelExportService = new ExcelExportService("test.url", getAccessToken);
  });

  it("should succeed getOverlappingValueSets", async () => {
    axios.put = jest.fn().mockResolvedValue({ data: "test-data" });
    const abortController = new AbortController();
    const result = await excelExportService.getOverlappingValueSets(
      [],
      abortController
    );
    expect(result.data).toEqual("test-data");
  });

  it("should fail getOverlappingValueSets", async () => {
    axios.put = jest.fn().mockRejectedValue(new Error("failure"));
    const consoleErrorMock = jest.spyOn(console, "error").mockImplementation();
    const abortController = new AbortController();
    await expect(
      excelExportService.getOverlappingValueSets([], abortController)
    ).rejects.toThrow(
      "An error occurred, please try again. If the error persists, please contact the help desk."
    );
    expect(consoleErrorMock).toHaveBeenCalledWith(
      "getOverlappingValueSets error",
      new Error("failure")
    );
    consoleErrorMock.mockRestore();
  });
});
