import React, { useCallback, useRef, useState } from "react";

import "styled-components/macro";
import {
  Button,
  Toast,
  MadieDialog,
} from "@madie/madie-design-system/dist/react";
import FolderZipOutlinedIcon from "@mui/icons-material/FolderZipOutlined";
import { useDropzone } from "react-dropzone";
import "./TestCaseImportDialog.css";
import * as _ from "lodash";
import useTestCaseServiceApi from "../../../../api/useTestCaseServiceApi";
import { ScanValidationDto } from "../../../../api/models/ScanValidationDto";
import JSZip from "jszip";
import prettyBytes from "pretty-bytes";
import CloseIcon from "@mui/icons-material/Close";
import { CircularProgress } from "@mui/material";
import {
  TestCaseImportRequest,
  TestCaseExportMetaData,
} from "@madie/madie-models";
import validator from "validator";

const TestCaseImportDialog = ({ dialogOpen, handleClose, onImport }) => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFileSpinner, setUploadingFileSpinner] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [testCaseImportRequest, setTestCaseImportRequest] = useState<
    TestCaseImportRequest[]
  >([]);
  const testCaseService = useRef(useTestCaseServiceApi());

  // Toast utilities
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<string>("danger");
  const onToastClose = () => {
    setToastMessage("");
    setToastOpen(false);
  };

  const showErrorToast = (message: string) => {
    setToastOpen(true);
    setToastType("danger");
    setToastMessage(message);
  };

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    removeUploadedFile();
    if (!_.isEmpty(fileRejections)) {
      fileRejections.forEach((file) => {
        file.errors.forEach((err) => {
          if (err.code === "file-too-large") {
            setErrorMessage(
              "The Import file is too large. No Test Cases can be imported."
            );
          }

          if (err.code === "file-invalid-type") {
            setErrorMessage(
              "The import file must be a zip file. No Test Cases can be imported."
            );
          }
        });
      });
      return;
    }
    setUploadingFileSpinner(true);
    let response: ScanValidationDto;
    try {
      response = await testCaseService.current.scanImportFile(acceptedFiles[0]);
    } catch (error) {
      setUploadingFileSpinner(false);
      showErrorToast(
        "An error occurred while uploading the file. Please try again or reach out to the helpdesk"
      );
      return;
    }
    if (!response.valid) {
      setUploadingFileSpinner(false);
      showErrorToast(response.error.defaultMessage);
    } else {
      const zip = new JSZip();
      const filesMap: TestCaseImportRequest[] = [];
      let fileNames = [];
      let madieFileMetaData: TestCaseExportMetaData[];
      let madieFilePresent = true;
      let separator: string = "/";
      const parentFolderName = acceptedFiles[0].name
        .replace(".zip", "")
        .split(" ")[0];
      zip
        .loadAsync(acceptedFiles[0])
        .then(async (content) => {
          // first load .madie file contents if it exists
          const madieFile = _.keys(content.files).find((fileName) =>
            fileName.endsWith(".madie")
          );
          if (_.isEmpty(madieFile)) {
            madieFilePresent = false;
          } else {
            madieFileMetaData = JSON.parse(
              await zip.file(madieFile).async("string")
            );

            // Filtering out all the fileNames that are valid, based on following format
            fileNames = _.filter(
              _.keys(content.files).map((fileName) => {
                // Zip downloaded from MADiE doesn't have a parentFolderName
                // Ex: a648e724-ce72-4cac-b0a7-3c4d52784f73/CMS136FHIR-v0.0.000-tcseries-tctitle001.json
                // Windows Zip sometimes does this with the backslash separator
                //     Ex: a648e724-ce72-4cac-b0a7-3c4d52784f73\\CMS136FHIR-v0.0.000-tcseries-tctitle001.json

                if (fileName.split("\\").length > 1) {
                  separator = "\\";
                }
                const folderNameSplit = fileName.split(separator);
                if (validator.isUUID(folderNameSplit[0])) {
                  if (fileName.endsWith(".json")) {
                    return fileName;
                  }
                  // Insert a blank file for each directory so that we can return an appropriate error message
                  else if (content.files[fileName].dir) {
                    content.file(fileName, "");
                    return fileName;
                  }
                }
              }),
              (v) => !!v
            );
          }
          return Promise.all(
            fileNames.map((filename) => zip.file(filename).async("string"))
          );
        })
        .then((values) => {
          _.forEach(values, (val, i) => {
            let patientId;
            if (fileNames[i].startsWith(parentFolderName)) {
              patientId = _.split(fileNames[i], separator)[1];
            } else {
              patientId = _.split(fileNames[i], separator)[0];
            }

            // check for an existing file in the directory
            var existingFile = filesMap.filter((file) => {
              if (file.patientId === patientId) {
                return true;
              }
            });
            // replace the blank file with the new file
            if (existingFile.length > 0) {
              if (val.length > 0) {
                if (existingFile[0].json.length === 0) {
                  filesMap.splice(
                    filesMap.findIndex((file) => file.patientId === patientId),
                    1
                  );
                }
                filesMap.push({
                  patientId: patientId,
                  json: val,
                  testCaseMetaData: madieFileMetaData?.find(
                    (md) => md.patientId === patientId
                  ),
                } as TestCaseImportRequest);
              }
            } else {
              filesMap.push({
                patientId: patientId,
                json: val,
                testCaseMetaData: madieFileMetaData?.find(
                  (md) => md.patientId === patientId
                ),
              } as TestCaseImportRequest);
            }
          });
          if (!madieFilePresent) {
            setErrorMessage(
              "Zip file is in an incorrect format. If this is an export prior to June 20, 2024 please reexport your test case and try again."
            );
          } else if (_.isEmpty(filesMap)) {
            setErrorMessage(
              "Unable to find any valid test case json. Please make sure the format is accurate"
            );
          } else {
            setTestCaseImportRequest(filesMap);
          }
          setUploadedFile(acceptedFiles[0]);
          setUploadingFileSpinner(false);
        })
        .catch(() => {
          setErrorMessage("Error uploading zip file");
        });
    }
  }, []);

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noDrag: false,
    maxFiles: 1,
    accept: {
      "application/zip": [".zip"],
    },
  });

  const renderUploadedFileStatus = () => {
    return (
      <div
        data-testid="test-case-preview-header"
        className="mm:flex mm:border mm:border-l-4 mm:mt-5 mm:mx-16 mm:mb-1"
      >
        <div className="mm:flex mm:items-center mm:justify-between mm:w-full">
          <div className="mm:flex mm:items-center">
            <FolderZipOutlinedIcon className="mm:m-4 mm:text-lg" />
            <div className="mm:ml-1">
              <small className="mm:block">{uploadedFile.name}</small>
              <small className="mm:block">
                {prettyBytes(uploadedFile.size)} -{" "}
                {errorMessage ? (
                  <span className="mm:text-red">Failed</span>
                ) : (
                  <span className="mm:text-green-550">Complete</span>
                )}
              </small>
            </div>
          </div>
          <div className="mm:mx-2 mm:border-l-2">
            <CloseIcon
              onClick={removeUploadedFile}
              className="mm:ml-2"
            ></CloseIcon>
          </div>
        </div>
      </div>
    );
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setErrorMessage(null);
    setTestCaseImportRequest([]);
  };

  const onClose = () => {
    setUploadingFileSpinner(false);
    setUploadedFile(null);
    setErrorMessage(null);
    setTestCaseImportRequest([]);
    handleClose();
  };

  return (
    <MadieDialog
      title="Test Case Import"
      dialogProps={{
        onClose,
        open: dialogOpen,
        maxWidth: "md",
        fullWidth: true,
      }}
      cancelButtonProps={{
        variant: "secondary",
        cancelText: "Cancel",
        "data-testid": "test-case-import-cancel-btn",
      }}
      continueButtonProps={{
        variant: "cyan",
        type: "submit",
        "data-testid": "test-case-import-import-btn",
        disabled: _.isNil(uploadedFile) || !_.isEmpty(errorMessage),
        continueText: "Import",
        onClick: () => onImport(testCaseImportRequest),
      }}
    >
      <small>
        Newly uploaded test cases will replace existing test cases that have
        matching IDs.
      </small>
      <div data-testid="test-case-import-content-div">
        <div
          data-testid="file-drop-div"
          {...getRootProps({ className: "dropzone" })}
        >
          <input data-testid="file-drop-input" {...getInputProps()} />
          <span className="mm:text-black-100">
            Drag 'n' drop file to upload{" "}
          </span>
          <span style={{ color: "#666666" }} className="mm:pb-3">
            {" "}
            or{" "}
          </span>
          <Button
            variant="outline-filled"
            data-testid="select-file-button"
            onClick={open}
          >
            Select File
          </Button>
          <span style={{ color: "#666666" }} className="mm:pt-3">
            (.zip)
          </span>
        </div>
        {uploadedFile && renderUploadedFileStatus()}
        {uploadingFileSpinner && (
          <div
            data-testid="test-case-preview-header"
            className="mm:flex mm:border mm:border-l-4 mm:mt-5 mm:mx-16 mm:mb-1"
          >
            <div className="mm:flex mm:items-center mm:ml-80 mm:my-4">
              <CircularProgress size={32} />
            </div>
          </div>
        )}
      </div>
      <div
        data-testid="test-case-import-error-div"
        className="mm:flex mm:items-center mm:ml-20"
      >
        {errorMessage && (
          <small style={{ color: "#990000" }}>{errorMessage}</small>
        )}
      </div>
      <Toast
        toastKey="import-tests-toast"
        aria-live="polite"
        toastType={toastType}
        testId="error-toast"
        closeButtonProps={{
          "data-testid": "close-toast-button",
        }}
        open={toastOpen}
        message={toastMessage}
        onClose={onToastClose}
        autoHideDuration={10000}
      />
    </MadieDialog>
  );
};

export default TestCaseImportDialog;
