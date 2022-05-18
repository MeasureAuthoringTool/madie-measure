import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import MeasureEditor, {
  mapElmErrorsToAceAnnotations,
  mapElmErrorsToAceMarkers,
} from "./MeasureEditor";
import { MeasureContextProvider } from "../editMeasure/MeasureContext";
import Measure from "../../models/Measure";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import axios from "axios";
import {
  ElmTranslation,
  ElmTranslationLibrary,
} from "../../api/useElmTranslationServiceApi";
import { Model } from "../../models/Model";
import userEvent from "@testing-library/user-event";
import getValueSet, { FHIRValueSet } from "../../api/useTerminologyServiceApi";

const MEASURE_CREATEDBY = "testuser@example.com";
const measure = {
  id: "abcd-pqrs-xyz",
  measureHumanReadableId: "",
  measureSetId: "",
  version: 1.0,
  revisionNumber: 1.1,
  state: "",
  measureName: "MSR001",
  cql: "library testCql version '1.0.000'",
  cqlLibraryName: "",
  measureScoring: "",
  createdAt: "",
  createdBy: MEASURE_CREATEDBY,
  lastModifiedAt: "",
  lastModifiedBy: "",
  model: Model.QICORE,
  measureMetaData: {},
} as Measure;

const elmTranslationWithNoErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: [],
  library: null,
};

const translationErrors = [
  {
    startLine: 4,
    startChar: 19,
    endLine: 19,
    endChar: 23,
    errorSeverity: "Error",
    errorType: null,
    message: "Test error 123",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: null,
  },
  {
    startLine: 24,
    startChar: 7,
    endLine: 24,
    endChar: 15,
    errorSeverity: "Warning",
    errorType: null,
    message: "Test Warning 456",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: null,
  },
];
const elmTranslationWithErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: translationErrors,
  library: null,
};

const elmTransaltionLibraryWithValueSets: ElmTranslationLibrary = {
  valueSets: {
    def: [
      {
        localId: "test1",
        locator: "25:1-25:97",
        id: "http://test.com/ValueSet/2.16.840.1.113762.1.4.1",
      },
      {
        localId: "test2",
        locator: "26:1-26:81",
        id: "http://test.com/ValueSet/2.16.840.1.114222.4.11.836",
      },
    ],
  },
};

const fhirValueset: FHIRValueSet = {
  resourceType: "ValueSet",
  id: "testId",
  url: "testUrl",
  status: "testStatus",
  errorMsg: "error",
};

const elmTranslationWithValueSetAndTranslationErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: translationErrors,
  library: elmTransaltionLibraryWithValueSets,
};

const elmTranslationWithValueSets: ElmTranslation = {
  externalErrors: [],
  errorExceptions: [],
  library: null,
};

const setMeasure = jest.fn();
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "madie.com",
  },
  elmTranslationService: {
    baseUrl: "elm-translator.com",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
};

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => MEASURE_CREATEDBY,
  }))
);

const renderEditor = (measure: Measure) => {
  return render(
    <ApiContextProvider value={serviceConfig}>
      <MeasureContextProvider value={{ measure, setMeasure }}>
        <MeasureEditor />
      </MeasureContextProvider>
    </ApiContextProvider>
  );
};

describe("MeasureEditor component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    window.localStorage.removeItem("TGT");
  });

  it("should mount measure editor component with measure cql", async () => {
    const { getByTestId } = renderEditor(measure);
    await waitFor(() => {
      const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
      expect(measure.cql).toEqual(editorContainer.value);
    });
  });

  it("set the editor to empty when no measure cql present", async () => {
    const measureWithNoCql = {
      id: "MSR1",
      measureName: "MSR1",
      createdBy: MEASURE_CREATEDBY,
    } as Measure;
    const { getByTestId } = renderEditor(measureWithNoCql);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(editorContainer.value).toEqual("");
  });

  it("save measure with updated cql in editor on save button click", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithNoErrors) },
          status: 200,
        });
      }
      return Promise.resolve(args);
    });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value:
          "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const successMessage = getByTestId("save-cql-success");
      expect(successMessage.textContent).toEqual("CQL saved successfully");
      expect(mockedAxios.put).toHaveBeenCalledTimes(3);
      expect(setMeasure).toHaveBeenCalledTimes(1);
      expect(mockedAxios.put.mock.calls).toEqual([
        [
          "elm-translator.com/cql/translator/cql",
          expect.anything(),
          expect.anything(),
        ],
        [
          "elm-translator.com/cql/translator/cql",
          expect.anything(),
          expect.anything(),
        ],
        [
          `madie.com/measures/${measure.id}`,
          expect.anything(),
          {
            headers: {
              Authorization: "Bearer test.jwt",
            },
          },
        ],
      ]);
    });
  });

  it("should alert user if ELM translation fails on save", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { error: "Something bad happened!" },
          status: 500,
        });
      }
      return Promise.resolve(args);
    });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value:
          "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      },
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const elmTranslationError = await screen.findByText(
      "Unable to translate CQL to ELM!"
    );
    expect(elmTranslationError).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledTimes(3);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      expect.anything(),
      expect.anything()
    );
  });

  it("reset the editor changes with measure cql when clicked on cancel button", async () => {
    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    // set new value to editor
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql version '2.0.000'",
      },
    });
    // click on cancel button
    fireEvent.click(getByTestId("reset-cql-btn"));
    await waitFor(() => {
      // check for old value
      expect(measure.cql).toEqual(editorContainer.value);
    });
  });

  it("reports an error when save cql fails", async () => {
    // mock put call for errors
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.reject("server error");
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithNoErrors) },
          status: 200,
        });
      }
      return Promise.resolve(args);
    });
    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    // set new value to editor
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "test cql",
      },
    });
    // click on save button
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const error = getByTestId("save-cql-error");
      expect(error.textContent).toEqual("Error updating the CQL");
    });
  });

  it("runs ELM translation on initial load of component and generate annotations", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithErrors) },
          status: 200,
        });
      }
      return Promise.resolve(args);
    });
    renderEditor(measure);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });
});

describe("mapElmErrorsToAceAnnotations", () => {
  it("should return an empty array for null input", () => {
    const translationErrors = null;
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for undefined input", () => {
    const translationErrors = undefined;
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for empty array input", () => {
    const translationErrors = [];
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for non-array input", () => {
    const translationErrors: any = { field: "value" };
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an array of mapped elements", () => {
    const output = mapElmErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(2);
    expect(output[0]).toEqual({
      row: 3,
      column: 19,
      type: "error",
      text: `ELM: 19:23 | Test error 123`,
    });
    expect(output[1]).toEqual({
      row: 23,
      column: 7,
      type: "warning",
      text: `ELM: 7:15 | Test Warning 456`,
    });
  });
});

describe("map elm errors to Ace Markers", () => {
  it("should return an empty array for null input", () => {
    const translationErrors = null;
    const output = mapElmErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for undefined input", () => {
    const translationErrors = undefined;
    const output = mapElmErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for empty array input", () => {
    const translationErrors = [];
    const output = mapElmErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for non-array input", () => {
    const translationErrors: any = { field: "value" };
    const output = mapElmErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an array of mapped elements", () => {
    const output = mapElmErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(2);
    expect(output[0]).toEqual({
      clazz: "editor-error-underline",
      range: {
        end: {
          column: 23,
          row: 18,
        },
        start: {
          column: 19,
          row: 3,
        },
      },
      type: "text",
    });
    expect(output[1]).toEqual({
      clazz: "editor-error-underline",
      range: {
        end: {
          column: 15,
          row: 23,
        },
        start: {
          column: 7,
          row: 23,
        },
      },
      type: "text",
    });
  });
});

it("Save button and Cancel button should not show if user is not the owner of the measure", () => {
  measure.createdBy = "AnotherUser@example.com";
  renderEditor(measure);

  const cancelButton = screen.queryByTestId("reset-cql-btn");
  expect(cancelButton).not.toBeInTheDocument();
  const saveButton = screen.queryByTestId("save-cql-btn");
  expect(saveButton).not.toBeInTheDocument();
});

describe("Validate value sets", () => {
  it("Valid value sets", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithValueSets) },
          status: 200,
        });
      }
      return Promise.resolve(args);
    });
    const tgtObj = {
      TGT: "Test-TGT",
      tgtTimeStamp: new Date().getTime(),
    };
    window.localStorage.setItem("TGT", JSON.stringify(tgtObj));

    mockedAxios.get.mockImplementation((args) => {
      return Promise.resolve({
        data: { json: JSON.stringify(fhirValueset) },
        status: 200,
      });
    });

    renderEditor(measure);
    const valueSetValidation = await screen.findByText("Value Set is valid!");
    expect(valueSetValidation).toBeInTheDocument();
  });

  it("Invalid value sets", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            json: JSON.stringify(
              elmTranslationWithValueSetAndTranslationErrors
            ),
          },
          status: 200,
        });
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
      }
      return Promise.resolve(args);
    });
    const tgtObj = {
      TGT: "Test-TGT",
      tgtTimeStamp: new Date().getTime(),
    };
    window.localStorage.setItem("TGT", JSON.stringify(tgtObj));

    mockedAxios.get.mockImplementation((args) => {
      return Promise.reject({
        data: null,
        status: 404,
      });
    });

    renderEditor(measure);
    const issues = await screen.findByText("4 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });
});
