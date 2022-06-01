import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import MeasureEditor, {
  CustomCqlCode,
  mapErrorsToAceAnnotations,
  mapErrorsToAceMarkers,
} from "./MeasureEditor";
import { MeasureContextProvider } from "../editMeasure/MeasureContext";
import { Measure, Model } from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import axios from "axios";
import {
  ElmTranslation,
  ElmTranslationLibrary,
} from "../../api/useElmTranslationServiceApi";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { parseContent } from "@madie/madie-editor";
import { FHIRValueSet } from "../../api/useTerminologyServiceApi";

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => MEASURE_CREATEDBY,
  }),
}));

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
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

const elmTranslationLibraryWithValueSets: ElmTranslationLibrary = {
  annotation: [],
  contexts: undefined,
  identifier: undefined,
  parameters: undefined,
  schemaIdentifier: undefined,
  statements: undefined,
  usings: undefined,
  valueSets: {
    def: [
      {
        localId: "test1",
        locator: "25:1-25:97",
        id: "https://test.com/ValueSet/2.16.840.1.113762.1.4.1",
      },
      {
        localId: "test2",
        locator: "26:1-26:81",
        id: "https://test.com/ValueSet/2.16.840.1.114222.4.11.836",
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

const customCqlCodes: CustomCqlCode[] = [
  {
    codeId: "'P'",
    codeSystem: {
      oid: "'https://terminology.hl7.org/CodeSystem/v3-ActPriority'",
      hits: 0,
      version: "'HL7V3.0_2021-03'",
      text:
        "codesystem 'ActPriority:HL7V3.0_2021-03':" +
        " 'https://terminology.hl7.org/CodeSystem/v3-ActPriority' version 'HL7V3.0_2021-03'",
      name: '"ActPriority:HL7V3.0_2021-03"',
      start: {
        line: 9,
        position: 0,
      },
      stop: {
        line: 9,
        position: 121,
      },
      errorMessage: null,
      valid: true,
    },
    hits: 0,
    text: "code 'preop': 'P' from 'ActPriority:HL7V3.0_2021-03' display 'preop'",
    name: '"preop"',
    start: {
      line: 11,
      position: 0,
    },
    stop: {
      line: 11,
      position: 67,
    },
    errorMessage: null,
    valid: true,
  },
];

const customCqlCodesWithErrors: CustomCqlCode[] = [
  {
    codeId: "'P'",
    codeSystem: {
      oid: "'https://terminology.hl7.org/CodeSystem/v3-ActPriority'",
      hits: 0,
      version: "'HL7V3.0_2021-03'",
      text:
        "codesystem 'ActPriority:HL7V3.0_2021-03':" +
        " 'https://terminology.hl7.org/CodeSystem/v3-ActPriority' version 'HL7V3.0_2021-03'",
      name: '"ActPriority:HL7V3.0_2021-03"',
      start: {
        line: 9,
        position: 0,
      },
      stop: {
        line: 9,
        position: 121,
      },
      errorMessage: null,
      valid: true,
    },
    hits: 0,
    text: "code 'preop': 'P' from 'ActPriority:HL7V3.0_2021-03' display 'preop'",
    name: '"preop"',
    start: {
      line: 11,
      position: 0,
    },
    stop: {
      line: 11,
      position: 67,
    },
    errorMessage: "invalid code",
    valid: false,
  },
];

const elmTranslationWithValueSetAndTranslationErrors: ElmTranslation = {
  externalErrors: [],
  errorExceptions: translationErrors,
  library: elmTranslationLibraryWithValueSets,
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
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: customCqlCodes,
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
        return Promise.reject({ data: { error: "Something bad happened!" } });
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({ data: customCqlCodes });
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
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      "library testCql version '1.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      expect.anything()
    );
  });

  it("should persist error flag when there are ELM translation errors", async () => {
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
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({ data: customCqlCodes });
      } else {
        return Promise.resolve(args);
      }
    });
    renderEditor(measure);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
    const editorContainer = (await screen.getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(screen.getByTestId("measure-editor"), {
      target: {
        value:
          "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      },
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText("CQL saved successfully");
    expect(saveSuccess).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledTimes(3);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      "library testCql version '1.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: "testuser@example.com",
        elmJson:
          '{"externalErrors":[],"errorExceptions":[{"startLine":4,"startChar":19,"endLine":19,"endChar":23,"errorSeverity":"Error","errorType":null,"message":"Test error 123","targetIncludeLibraryId":"TestLibrary_QICore","targetIncludeLibraryVersionId":"5.0.000","type":null},{"startLine":24,"startChar":7,"endLine":24,"endChar":15,"errorSeverity":"Warning","errorType":null,"message":"Test Warning 456","targetIncludeLibraryId":"TestLibrary_QICore","targetIncludeLibraryVersionId":"5.0.000","type":null}],"library":null}',
        id: "abcd-pqrs-xyz",
        lastModifiedAt: "",
        lastModifiedBy: "",
        measureHumanReadableId: "",
        measureMetaData: {},
        measureName: "MSR001",
        measureScoring: "",
        measureSetId: "",
        model: "QI-Core",
        revisionNumber: 1.1,
        state: "",
        version: 1,
      },
      { headers: { Authorization: "Bearer test.jwt" } }
    );
  });

  it("should persist error flag when there are parse errors", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
      if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithNoErrors) },
          status: 200,
        });
      }
      if (args && args.startsWith(serviceConfig.terminologyService.baseUrl)) {
        return Promise.resolve({ data: customCqlCodes });
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
    parseContent.mockClear().mockImplementation(() => ["Test error"]);
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText("CQL saved successfully");
    expect(saveSuccess).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledTimes(3);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      "library testCql version '1.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "elm-translator.com/cql/translator/cql",
      "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: "testuser@example.com",
        elmJson: '{"externalErrors":[],"errorExceptions":[],"library":null}',
        id: "abcd-pqrs-xyz",
        lastModifiedAt: "",
        lastModifiedBy: "",
        measureHumanReadableId: "",
        measureMetaData: {},
        measureName: "MSR001",
        measureScoring: "",
        measureSetId: "",
        model: "QI-Core",
        revisionNumber: 1.1,
        state: "",
        version: 1,
      },
      { headers: { Authorization: "Bearer test.jwt" } }
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
      }
      if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithNoErrors) },
          status: 200,
        });
      }
      if (args && args.startsWith(serviceConfig.terminologyService.baseUrl)) {
        return Promise.resolve({ data: customCqlCodes });
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
      }
      if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: { json: JSON.stringify(elmTranslationWithErrors) },
          status: 200,
        });
      }
      if (args && args.startsWith(serviceConfig.terminologyService.baseUrl)) {
        return Promise.resolve({ data: customCqlCodes });
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
    const output = mapErrorsToAceAnnotations(translationErrors, "ELM");
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for undefined input", () => {
    const translationErrors = undefined;
    const output = mapErrorsToAceAnnotations(translationErrors, "ELM");
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for empty array input", () => {
    const translationErrors = [];
    const output = mapErrorsToAceAnnotations(translationErrors, "ELM");
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for non-array input", () => {
    const translationErrors: any = { field: "value" };
    const output = mapErrorsToAceAnnotations(translationErrors, "ELM");
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an array of mapped elements", () => {
    const output = mapErrorsToAceAnnotations(translationErrors, "ELM");
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
    const output = mapErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for undefined input", () => {
    const translationErrors = undefined;
    const output = mapErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for empty array input", () => {
    const translationErrors = [];
    const output = mapErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for non-array input", () => {
    const translationErrors: any = { field: "value" };
    const output = mapErrorsToAceMarkers(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an array of mapped elements", () => {
    const output = mapErrorsToAceMarkers(translationErrors);
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
    mockedAxios.get.mockImplementation(() => {
      return Promise.resolve({
        data: { json: JSON.stringify(fhirValueset) },
        status: 200,
      });
    });
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
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: customCqlCodes,
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
        return Promise.resolve({
          data: customCqlCodes,
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

    mockedAxios.get.mockImplementation(() => {
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

describe("Validate codes and code systems", () => {
  it("should display invalid codes", async () => {
    const tgtObj = {
      TGT: "Test-TGT",
      tgtTimeStamp: new Date().getTime(),
    };
    window.localStorage.setItem("TGT", JSON.stringify(tgtObj));
    const measureWithCqlCodes = {
      ...measure,
      cql:
        "library DuplicateMeasureTest version '0.0.000'\n" +
        "\n" +
        "using FHIR version '4.0.1'\n" +
        "\n" +
        "codesystem \"ActPriority:HL7V3.0_2021-03\": 'https://terminology.hl7.org/CodeSystem/v3-ActPriority' version 'HL7V3.0_2021-03'\n" +
        "code \"preop\": 'P' from \"ActPriority:HL7V3.0_2021-03\" display 'preop'",
    };
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            json: JSON.stringify(elmTranslationWithNoErrors),
          },
          status: 200,
        });
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: customCqlCodesWithErrors,
          status: 200,
        });
      }
    });
    renderEditor(measureWithCqlCodes);
    const issues = await screen.findByText("1 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });

  it("should display errors if not logged into umls", async () => {
    const tgtObj = {
      TGT: "",
      tgtTimeStamp: new Date().getTime(),
    };
    window.localStorage.setItem("TGT", JSON.stringify(tgtObj));

    const measureWithCqlCodes = {
      ...measure,
      cql:
        "library DuplicateMeasureTest version '0.0.000'\n" +
        "\n" +
        "using FHIR version '4.0.1'\n" +
        "\n" +
        "codesystem \"ActPriority:HL7V3.0_2021-03\": 'https://terminology.hl7.org/CodeSystem/v3-ActPriority' version 'HL7V3.0_2021-03'\n" +
        "code \"preop\": 'P' from \"ActPriority:HL7V3.0_2021-03\" display 'preop'",
    };
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measureWithCqlCodes });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            json: JSON.stringify(elmTranslationWithNoErrors),
          },
          status: 200,
        });
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: customCqlCodes,
          status: 200,
        });
      }
    });

    renderEditor(measureWithCqlCodes);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });

  it("should throw unable to login with umls error", async () => {
    const tgtObj = {
      TGT: "Test-TGT",
      tgtTimeStamp: new Date().getTime(),
    };
    window.localStorage.setItem("TGT", JSON.stringify(tgtObj));

    const measureWithCqlCodes = {
      ...measure,
      cql:
        "library DuplicateMeasureTest version '0.0.000'\n" +
        "\n" +
        "using FHIR version '4.0.1'\n" +
        "\n" +
        "codesystem \"ActPriority:HL7V3.0_2021-03\": 'https://terminology.hl7.org/CodeSystem/v3-ActPriority' version 'HL7V3.0_2021-03'\n" +
        "code \"preop\": 'P' from \"ActPriority:HL7V3.0_2021-03\" display 'preop'",
    };
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measureWithCqlCodes });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            json: JSON.stringify(elmTranslationWithNoErrors),
          },
          status: 200,
        });
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: customCqlCodes,
          status: 401,
        });
      }
    });

    renderEditor(measureWithCqlCodes);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });

  it("should throw unable to validate code error", async () => {
    const tgtObj = {
      TGT: "Test-TGT",
      tgtTimeStamp: new Date().getTime(),
    };
    window.localStorage.setItem("TGT", JSON.stringify(tgtObj));

    const measureWithCqlCodes = {
      ...measure,
      cql:
        "library DuplicateMeasureTest version '0.0.000'\n" +
        "\n" +
        "using FHIR version '4.0.1'\n" +
        "\n" +
        "codesystem \"ActPriority:HL7V3.0_2021-03\": 'https://terminology.hl7.org/CodeSystem/v3-ActPriority' version 'HL7V3.0_2021-03'\n" +
        "code \"preop\": 'P' from \"ActPriority:HL7V3.0_2021-03\" display 'preop'",
    };
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measureWithCqlCodes });
      } else if (
        args &&
        args.startsWith(serviceConfig.elmTranslationService.baseUrl)
      ) {
        return Promise.resolve({
          data: {
            json: JSON.stringify(elmTranslationWithNoErrors),
          },
          status: 200,
        });
      } else if (
        args &&
        args.startsWith(serviceConfig.terminologyService.baseUrl)
      ) {
        return Promise.resolve({
          data: customCqlCodes,
          status: 500,
        });
      }
    });

    renderEditor(measureWithCqlCodes);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });
});
