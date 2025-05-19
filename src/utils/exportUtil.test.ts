import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import {
  downloadZipFile,
  EXPORT_FAILURE_MESSAGE,
  exportMeasure,
  parseErrorMessageFromBlob,
} from "./exportUtil";
import { Model } from "@madie/madie-models";

const setToastOpen = jest.fn();
const setToastType = jest.fn();
const setToastMessage = jest.fn();
const setDownloadState = jest.fn();
const setFailureMessage = jest.fn();
const abortController = { current: { signal: {} } };
const mockMeasureServiceApi = {
  getMeasureExport: jest.fn<Promise<{ status: number; data: Blob }>, []>(),
};

const mockMeasure = {
  id: "1",
  ecqmTitle: "Test Measure",
  model: Model.QICORE,
  version: "1.0.0",
};
const elmErrorSeverity = "Error";

describe("exportUtil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("downloadZipFile", () => {
    let createObjectURLMock,
      createElementMock,
      appendChildMock,
      clickMock,
      removeChildMock;

    beforeEach(() => {
      createObjectURLMock = jest.fn(
        () => "blob:http://localhost:3000/some-blob-url"
      );
      createElementMock = jest.fn(() => ({
        href: "",
        setAttribute: jest.fn(),
        click: (clickMock = jest.fn()),
      }));
      appendChildMock = jest.fn();
      removeChildMock = jest.fn();

      Object.defineProperty(window.URL, "createObjectURL", {
        value: createObjectURLMock,
      });
      document.createElement = createElementMock;
      document.body.appendChild = appendChildMock;
      document.body.removeChild = removeChildMock;
    });

    it("should download the zip file and show success toast", () => {
      const exportData = new Blob(["test data"], { type: "application/zip" });
      const ecqmTitle = "Test Measure";
      const model = Model.QICORE;
      const version = "1.0.0";
      const warn = false;

      downloadZipFile(
        exportData,
        ecqmTitle,
        model,
        version,
        warn,
        setToastOpen,
        setToastType,
        setToastMessage,
        setDownloadState
      );

      expect(createObjectURLMock).toHaveBeenCalledWith(exportData);
      expect(createElementMock).toHaveBeenCalledWith("a");
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
      expect(setToastOpen).toHaveBeenCalledWith(true);
      expect(setToastType).toHaveBeenCalledWith("success");
      expect(setToastMessage).toHaveBeenCalledWith(
        "Measure exported successfully"
      );
      expect(setDownloadState).toHaveBeenCalledWith("success");
    });
  });

  describe("exportMeasure", () => {
    afterAll(() => {
      jest.restoreAllMocks();
    });

    it("should export measure and call downloadZipFile on success", async () => {
      mockMeasureServiceApi.getMeasureExport.mockResolvedValue({
        status: 200,
        data: new Blob(["test data"], { type: "application/zip" }),
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("downloading");
      expect(mockMeasureServiceApi.getMeasureExport).toHaveBeenCalledWith(
        mockMeasure.id,
        elmErrorSeverity,
        abortController.current.signal
      );
      expect(setToastType).toHaveBeenCalledWith("success");
      expect(setToastMessage).toHaveBeenCalledWith(
        "Measure exported successfully"
      );
      expect(setDownloadState).toHaveBeenCalledWith("success");
    });

    it("should handle cancellation", async () => {
      mockMeasureServiceApi.getMeasureExport.mockRejectedValue({
        message: "canceled",
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setToastOpen).toHaveBeenCalled();
      expect(setDownloadState).toHaveBeenCalledWith(null);
    });

    it("should display default error message if API call fails", async () => {
      mockMeasureServiceApi.getMeasureExport.mockRejectedValueOnce({
        status: 500,
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setFailureMessage).toHaveBeenCalledWith(EXPORT_FAILURE_MESSAGE);
    });

    it("should handle 409 error with validation issues and set multiple failure messages", async () => {
      const measure = {
        id: "1",
        ecqmTitle: "Test Measure",
        model: Model.QICORE,
        version: "1.0.0",
        cql: "",
        cqlErrors: true,
        errors: ["MISMATCH_CQL_POPULATION_RETURN_TYPES"],
        groups: [],
        measureMetaData: {
          developers: [],
          steward: "",
          description: "",
          draft: true,
        },
        cqlLibraryName: "invalid library name!",
        baseConfigurationTypes: [],
      };

      mockMeasureServiceApi.getMeasureExport.mockRejectedValue({
        response: { status: 409 },
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        measure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setFailureMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          "Missing CQL",
          "CQL Contains Errors",
          "CQL Populations Return Types are invalid",
          "Measure CQL Library Name is invalid",
          "Missing Population Criteria",
          "Missing Measure Developers",
          "Missing Steward",
          "Missing Description",
        ])
      );
    });

    it("should handle 409 error and parse validation issues from Blob", async () => {
      const measure = {
        id: "1",
        ecqmTitle: "Test Measure",
        model: Model.QICORE,
        version: "1.0.0",
        cql: "",
        cqlErrors: true,
        errors: [],
        groups: [],
        measureMetaData: {
          developers: [],
          steward: "",
          description: "",
          draft: true,
        },
        cqlLibraryName: "invalid library name!",
        baseConfigurationTypes: [],
      };

      const errorPayload = {
        message:
          "Validation failed, MISMATCH_CQL_POPULATION_RETURN_TYPES, MISMATCH_CQL_RISK_ADJUSTMENT, MISMATCH_CQL_SUPPLEMENTAL_DATA",
      };

      const errorBlob = new Blob([JSON.stringify(errorPayload)], {
        type: "application/json",
      });

      if (!errorBlob.text) {
        errorBlob.text = async () => JSON.stringify(errorPayload);
      }

      const exportConflict = {
        response: {
          data: errorBlob,
          status: 409,
        },
      };

      mockMeasureServiceApi.getMeasureExport.mockRejectedValue(exportConflict);

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        measure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setFailureMessage).toHaveBeenCalledWith(
        expect.arrayContaining([
          "Missing CQL",
          "CQL Contains Errors",
          "CQL Populations Return Types are invalid",
          "CQL Risk Adjustment are invalid",
          "CQL Supplemental Data Elements are invalid",
          "Measure CQL Library Name is invalid",
          "Missing Population Criteria",
          "Missing Measure Developers",
          "Missing Steward",
          "Missing Description",
        ])
      );
    });

    it("should display error message to the user when export is not available status 404", async () => {
      const errorPayload = {
        message:
          'Measure cannot be exported for publishing because it was versioned prior to MADiE version 2.2.0. Please use a newer version or select "Export" for this measure.',
        status: 404,
        error: "Bad Request",
      };

      const errorBlob = new Blob([JSON.stringify(errorPayload)], {
        type: "application/json",
      });

      if (!errorBlob.text) {
        errorBlob.text = async () => JSON.stringify(errorPayload);
      }

      const exportNotFound = {
        response: {
          data: errorBlob,
          status: 404,
        },
      };
      mockMeasureServiceApi.getMeasureExport.mockRejectedValue(exportNotFound);

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        mockMeasure,
        mockMeasureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage,
        elmErrorSeverity
      );

      expect(setDownloadState).toHaveBeenCalledWith("downloading");
      expect(mockMeasureServiceApi.getMeasureExport).toHaveBeenCalledWith(
        mockMeasure.id,
        elmErrorSeverity,
        abortController.current.signal
      );
      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setFailureMessage).toHaveBeenCalledWith(
        'Measure cannot be exported for publishing because it was versioned prior to MADiE version 2.2.0. Please use a newer version or select "Export" for this measure.'
      );
    });
  });
  it("should return null and log error when parsing fails", async () => {
    // Mock console.error
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Create a Blob that will throw an error when parsed
    const invalidBlob = new Blob(["not valid json"], { type: "text/plain" });

    const result = await parseErrorMessageFromBlob(invalidBlob);

    // Verify null is returned
    expect(result).toBeNull();

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error parsing response:",
      expect.any(Error)
    );

    // Clean up
    consoleErrorSpy.mockRestore();
  });
});
