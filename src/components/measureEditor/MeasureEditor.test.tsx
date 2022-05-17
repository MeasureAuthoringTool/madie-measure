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
import { ElmTranslation } from "../../api/useElmTranslationServiceApi";
import { Model } from "../../models/Model";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { parseContent } from "@madie/madie-editor";

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
    expect(mockedAxios.put).toHaveBeenCalledTimes(2);
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      1,
      "elm-translator.com/cql/translator/cql",
      "library testCql version '1.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      2,
      "elm-translator.com/cql/translator/cql",
      "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      expect.anything()
    );
  });

  it.only("should persist error flag when there are ELM translation errors", async () => {
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
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      1,
      "elm-translator.com/cql/translator/cql",
      "library testCql version '1.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      2,
      "elm-translator.com/cql/translator/cql",
      "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      3,
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
    parseContent.mockClear().mockImplementation((content) => ["Test error"]);
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText("CQL saved successfully");
    expect(saveSuccess).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledTimes(3);
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      1,
      "elm-translator.com/cql/translator/cql",
      "library testCql version '1.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      2,
      "elm-translator.com/cql/translator/cql",
      "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      expect.anything()
    );
    expect(mockedAxios.put).toHaveBeenNthCalledWith(
      3,
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

  it("Save button and Cancel button should not show if user is not the owner of the measure", () => {
    measure.createdBy = "AnotherUser@example.com";
    renderEditor(measure);

    const cancelButton = screen.queryByTestId("reset-cql-btn");
    expect(cancelButton).not.toBeInTheDocument();
    const saveButton = screen.queryByTestId("save-cql-btn");
    expect(saveButton).not.toBeInTheDocument();
  });
});
