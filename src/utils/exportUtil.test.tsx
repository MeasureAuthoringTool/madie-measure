import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { downloadZipFile, exportMeasure } from "./exportUtil";
import { Model } from "@madie/madie-models";

describe("exportUtil", () => {
  let setToastOpen,
    setToastType,
    setToastMessage,
    setDownloadState,
    setFailureMessage,
    abortController,
    measureServiceApi,
    targetMeasure;

  beforeEach(() => {
    setToastOpen = jest.fn();
    setToastType = jest.fn();
    setToastMessage = jest.fn();
    setDownloadState = jest.fn();
    setFailureMessage = jest.fn();
    abortController = { current: { signal: {} } };
    measureServiceApi = { getMeasureExport: jest.fn() };
    targetMeasure = {
      current: {
        id: "1",
        ecqmTitle: "Test Measure",
        model: Model.QICORE,
        version: "1.0.0",
      },
    };
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
    it("should export measure and call downloadZipFile on success", async () => {
      const measure = targetMeasure.current;
      measureServiceApi.getMeasureExport.mockResolvedValue({
        status: 200,
        data: new Blob(["test data"], { type: "application/zip" }),
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        targetMeasure,
        measureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage
      );

      expect(setDownloadState).toHaveBeenCalledWith("downloading");
      expect(measureServiceApi.getMeasureExport).toHaveBeenCalledWith(
        measure.id,
        abortController.current.signal
      );
      expect(setToastOpen).toHaveBeenCalledWith(true);
      expect(setToastType).toHaveBeenCalledWith("success");
      expect(setToastMessage).toHaveBeenCalledWith(
        "Measure exported successfully"
      );
      expect(setDownloadState).toHaveBeenCalledWith("success");
    });

    it("should handle errors and set failure message", async () => {
      const measure = targetMeasure.current;
      measureServiceApi.getMeasureExport.mockRejectedValue({
        response: {
          status: 400,
          data: {
            text: jest.fn().mockResolvedValue('{"message": "Error occurred"}'),
          },
        },
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        targetMeasure,
        measureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage
      );

      expect(setDownloadState).toHaveBeenCalledWith("downloading");
      expect(measureServiceApi.getMeasureExport).toHaveBeenCalledWith(
        measure.id,
        abortController.current.signal
      );
      expect(setToastType).toHaveBeenCalledWith("danger");
      expect(setDownloadState).toHaveBeenCalledWith("failure");
      expect(setFailureMessage).toHaveBeenCalledWith("Error occurred");
    });

    it("should handle cancellation", async () => {
      const measure = targetMeasure.current;
      measureServiceApi.getMeasureExport.mockRejectedValue({
        message: "canceled",
      });

      await exportMeasure(
        setFailureMessage,
        setDownloadState,
        abortController,
        targetMeasure,
        measureServiceApi,
        setToastOpen,
        setToastType,
        setToastMessage
      );

      expect(setToastOpen).toHaveBeenCalled();
      expect(setDownloadState).toHaveBeenCalledWith(null);
    });
  });
});
