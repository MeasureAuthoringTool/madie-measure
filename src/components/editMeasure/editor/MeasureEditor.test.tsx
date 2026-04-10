import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import MeasureEditor, {
  mapErrorsToAceAnnotations,
  mapErrorsToAceMarkers,
} from "./MeasureEditor";
import { Measure, MeasureErrorType, Model } from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import { ElmTranslationError } from "./measureEditorUtils";
import userEvent from "@testing-library/user-event";
import {
  ElmTranslationExternalError,
  parseContent,
  synchingEditorCqlContent,
  isUsingEmpty,
  validateContent,
} from "@madie/madie-editor";
import { measureStore, useFeatureFlags } from "@madie/madie-util";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const measure = {
  id: "abcd-pqrs-xyz",
  measureHumanReadableId: "",
  measureSetId: "",
  version: "1.0.000",
  revisionNumber: "1",
  state: "",
  measureName: "MSR001",
  cql: "library testCql version '1.0.001'",
  cqlLibraryName: "",
  measureScoring: "",
  createdAt: "",
  createdBy: "testuser@example.com",
  lastModifiedAt: "",
  lastModifiedBy: "",
  model: "QI-Core v4.1.1",
  measureMetaData: {},
  acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
} as unknown as Measure;

// MinimizeAlerts flag removed; keep stub returning empty object for tests
const mockUseFeatureFlags = jest.fn(() => ({}));

const mockMeasureServiceApi = {
  updateMeasure: jest.fn(),
  unlockMeasure: jest.fn(),
  updateMeasureLock: jest.fn().mockResolvedValue({}),
};

jest.mock("@madie/madie-util", () => ({
  useMeasureServiceApi: jest.fn(() => mockMeasureServiceApi),
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  useFeatureFlags: () => mockUseFeatureFlags(),
  measureStore: {
    updateMeasure: jest.fn((measure) => measure),
    state: jest.fn().mockImplementation(() => measure),
    initialState: jest.fn().mockImplementation(() => measure),
    subscribe: jest.fn().mockImplementation((set) => {
      return { unsubscribe: () => null };
    }),
  },
  routeHandlerStore: {
    subscribe: (set) => {
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec
const translationErrors = [
  {
    startLine: 4,
    startChar: 19,
    endLine: 19,
    endChar: 23,
    errorSeverity: "Error",
    errorType: "ELM",
    message: "Test error 123",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: "ELM",
  },
  {
    startLine: 24,
    startChar: 7,
    endLine: 24,
    endChar: 15,
    errorSeverity: "Warning",
    errorType: "ELM",
    message: "Test Warning 456",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: null,
  },
];

const elmTransaltionErrors: ElmTranslationError[] = [
  {
    startLine: 24,
    startChar: 7,
    endLine: 24,
    endChar: 15,
    errorSeverity: "Error",
    errorType: "ELM",
    message: "Test Warning 123",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: "ELM",
  },
  {
    startLine: 1,
    startChar: 1,
    endLine: 1,
    endChar: 96,
    errorSeverity: "Warning",
    errorType: "ELM",
    message: "Test Warning 456",
    targetIncludeLibraryId: "TestLibrary_QICore",
    targetIncludeLibraryVersionId: "5.0.000",
    type: "ELM",
  },
];

const cqlToElmExternalErrors: ElmTranslationExternalError[] = [
  {
    libraryId: "SupplementalDataElements",
    libraryVersion: "1.0.000",
    startLine: 14,
    startChar: 1,
    endLine: 14,
    endChar: 52,
    message:
      "Could not resolve reference to library QICoreCommon, version 1.0.000 because version 2.0.000 is already loaded.",
    errorType: "include",
    errorSeverity: "Error",
    targetIncludeLibraryId: "QICoreCommon",
    targetIncludeLibraryVersionId: "1.0.000",
    type: "CqlToElmError",
  },
];

const serviceConfig = {
  measureService: {
    baseUrl: "madie.com",
  },
  qdmElmTranslationService: {
    baseUrl: "qdm-translator.com",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-translator.com",
  },
  terminologyService: {
    baseUrl: "terminology-service.com",
  },
} as unknown as ServiceConfig;

const renderEditor = (measure) => {
  measureStore.state.mockImplementationOnce(() => measure);
  return render(
    <ApiContextProvider value={serviceConfig}>
      <MemoryRouter
        initialEntries={[{ pathname: `/measures/${measure.id}/cql-editor` }]}
      >
        <Routes>
          <Route
            // path="/cql-editor"
            path="/measures/:measureId/cql-editor"
            element={<MeasureEditor measureCanEdit={true} />}
          />
        </Routes>
      </MemoryRouter>
    </ApiContextProvider>
  );
};

describe("MeasureEditor component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFeatureFlags.mockReturnValue({});
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
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(editorContainer.value).toEqual("");
  });

  it("save measure with empty cql successfully", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "",
        };
      });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const successText = getByTestId("generic-success-text-header");
      expect(successText.textContent).toEqual("CQL updated successfully");
    });
  });

  it("save measure with updated cql in editor on save button click", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library testCql version '0.0.000'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql versionss '0.0.000'",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const successText = getByTestId("generic-success-text-header");
      expect(successText.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
      expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledTimes(1);
    });
  });

  it("save measure with updated cql in editor on save button click and show return type error", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library testCql version '0.0.000'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql versionss '0.0.000'",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const successText = getByTestId("generic-success-text-header");
      expect(successText.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
      expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledTimes(1);
    });

    const subscribeCallback = (measureStore.subscribe as jest.Mock).mock
      .calls[0][0];
    if (subscribeCallback) {
      subscribeCallback({
        ...measure,
        errors: [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES],
      });
    } else {
      fail("subscribe callback was undefined so cannot trigger the change!");
    }

    await waitFor(() => {
      const errorToast = screen.getByTestId("measure-editor-toast");
      expect(errorToast).toBeInTheDocument();
      expect(errorToast).toHaveTextContent(
        "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
      );
    });
  });

  it("save measure with updated cql in editor on save button click and show error for missing using", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library testCql version '0.0.000'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });

    isUsingEmpty.mockClear().mockImplementation(() => true);

    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql versionss '0.0.000'",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const successText = getByTestId("generic-success-text-header");
      expect(successText.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
      expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledTimes(1);
    });
  });

  it("should alert user if ELM translation fails on save", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.reject({ data: { error: "Something bad happened!" } });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "librarydwwd Test2dvh3wd version '0.0.000'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "librarydwwd Test2dvh3wd version '0.0.000'",
      },
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    await waitFor(() => {
      const successMessage = getByTestId("generic-success-text-header");
      expect(successMessage.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
      expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledTimes(1);
    });
  });

  it("should persist error flag when there are ELM translation errors", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: elmTransaltionErrors,
        translation: { library: {} },
        externalErrors: [],
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library AdvancedIllnessandFrailtyExclusion version '1.0.001'\nusing QI-Core version '4.1.1'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });

    isUsingEmpty.mockClear().mockImplementation(() => false);

    renderEditor(measure);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
    const editorContainer = screen.getByTestId(
      "measure-editor"
    ) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(screen.getByTestId("measure-editor"), {
      target: {
        value:
          "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'\nusing QI-Core version '4.1.1'",
      },
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText(
      "CQL updated successfully but the following issues were found"
    );
    expect(saveSuccess).toBeInTheDocument();
    expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledTimes(1);
  });

  it("should persist error flag when there are parse errors", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
        externalErrors: [],
      });
    });
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library AdvancedIllnessandFrailtyExclusion version '1.0.001'\nusing QI-Core version '4.1.1'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: true,
          isValueSetChanged: false,
        };
      });

    isUsingEmpty.mockClear().mockImplementation(() => false);

    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value:
          "library AdvancedIllnessandFrailtyExclusion versiontest '5.0.000'\nusing QI-Core version '4.1.1'",
      },
    });
    parseContent.mockClear().mockImplementation(() => ["Test error"]);
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText(
      "CQL updated successfully but the following issues were found"
    );
    expect(saveSuccess).toBeInTheDocument();
    expect(mockMeasureServiceApi.updateMeasure).toHaveBeenCalledTimes(1);
  });

  it("reset the editor changes with measure cql when clicked on cancel button", async () => {
    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql version '2.0.000'",
      },
    });
    fireEvent.click(getByTestId("reset-cql-btn"));
    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = screen.getByTestId("discard-dialog-continue-button");
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(measure.cql).toEqual(editorContainer.value);
    });
  });

  it("reset editor on emitted event", async () => {
    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql version '2.0.000'",
      },
    });
    window.dispatchEvent(new Event("resetAllForms"));
    await waitFor(() => {
      expect(measure.cql).toEqual(editorContainer.value);
    });
  });

  it("it closes the dialog without changing the cql", async () => {
    const { getByTestId, queryByText } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql version '2.0.000'",
      },
    });
    fireEvent.click(getByTestId("reset-cql-btn"));
    const discardDialog = screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const cancelButton = screen.getByTestId("discard-dialog-cancel-button");
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("reports an error when save cql fails", async () => {
    mockMeasureServiceApi.updateMeasure.mockRejectedValueOnce("server error");
    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "test cql",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const error = getByTestId("generic-error-text-header");
      expect(error.textContent).toEqual("Errors were found within the CQL");
    });
  });

  it("reports 423 error when save cql fails", async () => {
    mockMeasureServiceApi.updateMeasureLock.mockResolvedValueOnce({
      isLocked: true,
      lockedBy: "testuser@example.com",
    });
    mockMeasureServiceApi.updateMeasure.mockRejectedValueOnce({
      status: 423,
      data: {
        message: "Unable to update measure. Measure is locked by another user.",
      },
    });

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "",
        };
      });
    const { getByTestId } = renderEditor(measure);
    const editorContainer = getByTestId("measure-editor") as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "test cql",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(
      () => {
        const error = getByTestId("generic-error-text-header");
        expect(error).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("runs ELM translation on initial load of component and generate annotations", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: elmTransaltionErrors,
        externalErrors: [],
      });
    });
    renderEditor(measure);
    const issues = await screen.findByText("2 issues found with CQL");
    expect(issues).toBeInTheDocument();
  });

  it("should display toast for external errors received from Cql to Elm translation", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        externalErrors: cqlToElmExternalErrors,
      });
    });
    renderEditor(measure);
    const toastMessage = await screen.findByText(
      cqlToElmExternalErrors[0].message
    );
    expect(toastMessage).toBeInTheDocument();
  });

  it("should display toast for CQL Return Types error on measure", async () => {
    renderEditor(measure);
    await waitFor(() => {
      expect(measureStore.subscribe as jest.Mock).toHaveBeenCalled();
    });

    const subscribeCallback = (measureStore.subscribe as jest.Mock).mock
      .calls[0][0];
    if (subscribeCallback) {
      subscribeCallback({
        ...measure,
        errors: [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES],
      });
    } else {
      fail("subscribe callback was undefined so cannot trigger the change!");
    }
    await waitFor(() => {
      const errorToast = screen.getByTestId("measure-editor-toast");
      expect(errorToast).toBeInTheDocument();
      expect(errorToast).toHaveTextContent(
        "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
      );
    });

    userEvent.click(screen.getByTestId("close-error-button"));
    await waitFor(() =>
      expect(
        screen.queryByText(
          "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
        )
      ).not.toBeInTheDocument()
    );
  });

  it("should remove concept successfully", async () => {
    const measureWithCqlCodes = {
      ...measure,
      model: Model.QDM_5_6,
      cql:
        "library RemoveConceptTest version '0.0.000'\n" +
        "\n" +
        "using QDM version '5.6'\n",
    } as Measure;
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(
      measureWithCqlCodes
    );

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library RemoveConceptTest version '0.0.000'\nusing QDM version '5.6'",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
          isConceptRemoved: true,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });

    const cqlWithNoConcept =
      "library RemoveConceptTest version '0.0.000'\nusing QDM version '5.6'";

    const { getByTestId } = renderEditor(measureWithCqlCodes);

    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value:
          "library RemoveCodeTest version '0.0.000'\n" +
          "\n" +
          "using QDM version '5.6'\n" +
          "\n" +
          'concept "Type B Hepatitis": { "Hepatitis Type B (SNOMED)", "Hepatitis Type B (ICD-10)" } display \'Type B Hepatitis\'\n' +
          "\n" +
          "Concept {\n" +
          "Code '66071002' from \"SNOMED-CT\",\n" +
          "Code 'B18.1' from \"ICD-10-CM\"\n" +
          "} display 'Type B viral hepatitis'\n",
      },
    });
    fireEvent.click(getByTestId("save-cql-btn"));
    await waitFor(() => {
      const success = getByTestId("generic-success-text-header");
      expect(success.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
    });
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(cqlWithNoConcept);
    });
    expect(screen.getByTestId("library-warning")).toHaveTextContent(
      "Concept Constructs are not supported in MADiE. It has been removed."
    );
  });
});

describe("mapElmErrorsToAceAnnotations", () => {
  it("should return an empty array for null input", () => {
    const translationErrors = null;
    const output = mapErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for undefined input", () => {
    const translationErrors = undefined;
    const output = mapErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for empty array input", () => {
    const translationErrors = [];
    const output = mapErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an empty array for non-array input", () => {
    const translationErrors: any = { field: "value" };
    const output = mapErrorsToAceAnnotations(translationErrors);
    expect(output).toBeDefined();
    expect(output.length).toEqual(0);
  });

  it("should return an array of mapped elements", () => {
    const output = mapErrorsToAceAnnotations(translationErrors);
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

  it("Save button and Cancel button should not show if user is not the owner of the measure", () => {
    measureStore.state.mockImplementationOnce(() => measure);
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: `/measures/${measure.id}/cql-editor` }]}
        >
          <Routes>
            <Route
              path="/measures/:measureId/cql-editor"
              element={<MeasureEditor measureCanEdit={false} />}
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    const cancelButton = screen.queryByTestId("reset-cql-btn");
    expect(cancelButton).not.toBeInTheDocument();
    const saveButton = screen.queryByTestId("save-cql-btn");
    expect(saveButton).not.toBeInTheDocument();
  });

  it("Save button and Cancel button should show if measure is shared with the user", () => {
    renderEditor(measure);

    const cancelButton = screen.queryByTestId("reset-cql-btn");
    expect(cancelButton).toBeInTheDocument();
    const saveButton = screen.queryByTestId("save-cql-btn");
    expect(saveButton).toBeInTheDocument();
  });

  it("should display errors if not logged into umls", async () => {
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

    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(
      measureWithCqlCodes
    );
    const elmTransaltionErrorsUMLS: ElmTranslationError[] = [
      {
        startLine: 24,
        startChar: 7,
        endLine: 24,
        endChar: 15,
        errorSeverity: "Warning",
        errorType: "ELM",
        message: "Please log in to UMLS",
        targetIncludeLibraryId: "TestLibrary_QICore",
        targetIncludeLibraryVersionId: "5.0.000",
        type: "VSAC",
      },
    ];

    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: elmTransaltionErrorsUMLS,
        translation: null,
        externalErrors: [],
      });
    });

    renderEditor(measureWithCqlCodes);
    const issues = await screen.findByText("1 issues found with CQL");
    expect(issues).toBeInTheDocument();
    const loggedIn = await screen.findByText("Please log in to UMLS!");
    expect(loggedIn).toBeInTheDocument();
  });
});

describe("EditorWithTerminology", () => {
  it("should remove cql code successfully", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library RemoveCodeTest version '0.0.000'\nusing QDM version '5.6'",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });
    const measureWithCqlCodes = {
      ...measure,
      model: Model.QDM_5_6,
      cql:
        "library RemoveCodeTest version '0.0.000'\n" +
        "\n" +
        "using QDM version '5.6'\n" +
        "\n" +
        "codesystem \"RXNORM:2022-05\": 'urn:oid:2.16.840.1.113883.6.88' version 'urn:hl7:version:2022-05'\n" +
        "code \"1 ML digoxin 0.1 MG/ML Injection\": '204504' from \"RXNORM:2022-05\" display '1 ML digoxin 0.1 MG/ML Injection'",
    } as Measure;
    const cqlWithNoCodes =
      "library RemoveCodeTest version '0.0.000'\nusing QDM version '5.6'";
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(
      measureWithCqlCodes
    );
    renderEditor(measureWithCqlCodes);
    const removeCodeBtn = await screen.findByText("Remove code");
    expect(removeCodeBtn).toBeInTheDocument();
    userEvent.click(removeCodeBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(cqlWithNoCodes);
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Code 204504 and code system RXNORM has been successfully removed from the CQL"
    );
  });

  it("should apply library successfully", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });
    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql:
        "library ApplyLibraryTest version '0.0.000'\n" +
        "using QDM version '5.6'\n",
    } as Measure;
    const updatedCql =
      "library ApplyLibraryTest version '0.0.000'\n" +
      "using QDM version '5.6'\n" +
      "include TestHelpers version '1.0.000' called Helpers\n";
    renderEditor(measureWithCql);
    const applyLibraryBtn = screen.getByTestId("apply-library");
    userEvent.click(applyLibraryBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(updatedCql);
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Library TestHelpers has been successfully added to the CQL."
    );
  });

  it("should remove included library successfully", async () => {
    const cqlWithIncludes =
      "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'\ninclude TestHelpers version '1.0.000' called Helpers";
    const cqlWithNoIncludes =
      "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'";
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });

    const measureWithIncludes = {
      ...measure,
      model: Model.QDM_5_6,
      cql: cqlWithIncludes,
    } as Measure;

    const measureWithNoIncludes = {
      ...measure,
      model: Model.QDM_5_6,
      cql: cqlWithNoIncludes,
    } as Measure;

    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(
      measureWithNoIncludes
    );
    renderEditor(measureWithIncludes);
    const deleteIncludeBtn = screen.getByTestId("delete-included-library");
    userEvent.click(deleteIncludeBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(cqlWithNoIncludes);
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Library TestHelpers has been successfully removed from the CQL."
    );
  });

  it("should edit included library successfully", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'\ninclude TestHelpers version '1.0.000' called EditedHelpers",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);
    const cqlWithIncludes =
      "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'\ninclude TestHelpers version '1.0.000' called Helpers";

    const cqlWithEdittedIncludes =
      "library ApplyLibraryTest version '0.0.000'\nusing QDM version '5.6'\ninclude TestHelpers version '1.0.000' called EditedHelpers";

    const measureWithIncludes = {
      ...measure,
      model: Model.QDM_5_6,
      cql: cqlWithIncludes,
    } as Measure;
    renderEditor(measureWithIncludes);

    const editIncludeBtn = screen.getByTestId("edit-included-library");
    userEvent.click(editIncludeBtn);

    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(cqlWithEdittedIncludes);
      expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
        "Library TestHelpers has been successfully edited in the CQL"
      );
    });
  });

  it("test edit parameter", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    const testCql = 'parameter "Measurement Period" Interval<System.DateTime>';
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: testCql,
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });

    const measureWithCqlParameter = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCqlParameter);

    const editParameterBtn = await screen.findByTestId("edit-parameter");
    expect(editParameterBtn).toBeInTheDocument();
    userEvent.click(editParameterBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(testCql);
    });
  });

  it("test delete parameter", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);

    const testCql = 'parameter "Measurement Period" Interval<System.DateTime>';
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });

    const measureWithCqlParameter = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCqlParameter);

    const deleteParameterBtn = await screen.findByTestId("delete-parameter");
    expect(deleteParameterBtn).toBeInTheDocument();
    userEvent.click(deleteParameterBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).not.toHaveValue(testCql);
    });
  });

  it("test delete function", async () => {
    const measureWithCqlFunction = {
      ...measure,
      model: Model.QDM_5_6,
      cql: `library TestLib version '0.0.000'
using QICore version '4.1.1'
include FHIRHelpers version '4.1.000' called FHIRHelpers

context Patient

define function MeasureObservation(e Encounter):
  2`,
    } as Measure;

    renderEditor(measureWithCqlFunction);

    const deleteFunctionBtn = await screen.findByTestId("delete-function");
    expect(deleteFunctionBtn).toBeInTheDocument();
    userEvent.click(deleteFunctionBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).not.toHaveValue(
        `define function MeasureObservation(e Encounter):
  2`
      );
    });
  });

  it("test edit function", async () => {
    const measureWithCqlFunction = {
      ...measure,
      model: Model.QDM_5_6,
      cql: `library TestLib version '0.0.000'
using QICore version '4.1.1'
include FHIRHelpers version '4.1.000' called FHIRHelpers

context Patient

define function MeasureObservation(e Encounter):
  2`,
    } as Measure;

    renderEditor(measureWithCqlFunction);

    const editFunctionBtn = await screen.findByTestId("edit-function");
    expect(editFunctionBtn).toBeInTheDocument();
    userEvent.click(editFunctionBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).not.toHaveValue(
        `define function MeasureObservation(e Encounter):
  2`
      );
    });
  });

  it("should remove cql code successfully for QI Core measures", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library RemoveCodeTest version '0.0.000'\nusing QICore version '4.1.1'",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
      });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      });
    });
    const measureWithCqlCodes = {
      ...measure,
      model: Model.QICORE,
      cql:
        "library RemoveCodeTest version '0.0.000'\n" +
        "\n" +
        "using QICore version '4.1.1'\n" +
        "\n" +
        "codesystem \"RXNORM:05022022\": 'http://www.nlm.nih.gov/research/umls/rxnorm' version '05022022'\n" +
        "code \"1 ML digoxin 0.1 MG/ML Injection (123)\": '204504' from \"RXNORM:05022022\" display '1 ML digoxin 0.1 MG/ML Injection'",
    } as Measure;
    const cqlWithNoCodes =
      "library RemoveCodeTest version '0.0.000'\nusing QICore version '4.1.1'";
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(
      measureWithCqlCodes
    );
    renderEditor(measureWithCqlCodes);
    const removeCodeBtn = await screen.findByText("Remove code");
    expect(removeCodeBtn).toBeInTheDocument();
    userEvent.click(removeCodeBtn);
    await waitFor(() => {
      const editor = screen.getByTestId("measure-editor");
      expect(editor).toHaveValue(cqlWithNoCodes);
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Code 204504 and code system RXNORM has been successfully removed from the CQL"
    );
  });

  it("should apply code successfully", async () => {
    const testCql =
      "library ApplyCodeTest version '0.0.000'\n" + "using QDM version '5.6'\n";
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => ({
        cql: testCql,
        isLibraryStatementChanged: false,
        isUsingStatementChanged: false,
        isValueSetChanged: false,
      }));
    (validateContent as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      })
    );

    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCql);

    const applyCodeBtn = await screen.findByTestId("apply-code");
    userEvent.click(applyCodeBtn);
    await waitFor(() => {
      const editor = screen.getByTestId(
        "measure-editor"
      ) as HTMLTextAreaElement;
      expect(editor.value).toContain("204504");
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Code 204504 has been successfully added to the CQL."
    );
  });

  it("should show info toast when applying duplicate code", async () => {
    const testCql =
      "library ApplyCodeTest version '0.0.000'\n" +
      "using QDM version '5.6'\n" +
      "codesystem \"RXNORM:2022-05\": 'urn:oid:2.16.840.1.113883.6.88' version 'urn:hl7:version:2022-05'\n" +
      "code \"1 ML digoxin 0.1 MG/ML Injection\": '204504' from \"RXNORM:2022-05\" display '1 ML digoxin 0.1 MG/ML Injection'\n";
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => ({
        cql: testCql,
        isLibraryStatementChanged: false,
        isUsingStatementChanged: false,
        isValueSetChanged: false,
      }));
    (validateContent as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      })
    );

    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCql);

    const applyCodeBtn = await screen.findByTestId("apply-code");
    userEvent.click(applyCodeBtn);
    await waitFor(() => {
      expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
        "Code 204504 has already been defined in CQL."
      );
    });
    // CQL should remain unchanged
    const editor = screen.getByTestId("measure-editor");
    expect(editor).toHaveValue(testCql);
  });

  it("should apply parameter successfully", async () => {
    const testCql =
      "library ApplyParamTest version '0.0.000'\n" +
      "using QDM version '5.6'\n";
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => ({
        cql: testCql,
        isLibraryStatementChanged: false,
        isUsingStatementChanged: false,
        isValueSetChanged: false,
      }));
    (validateContent as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      })
    );

    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCql);

    const applyParamBtn = await screen.findByTestId("apply-parameter");
    userEvent.click(applyParamBtn);
    await waitFor(() => {
      const editor = screen.getByTestId(
        "measure-editor"
      ) as HTMLTextAreaElement;
      expect(editor.value).toContain("Measurement Period");
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Parameter Measurement Period has been successfully added to the CQL."
    );
  });

  it("should show info toast when applying duplicate parameter", async () => {
    const testCql =
      "library ApplyParamTest version '0.0.000'\n" +
      "using QDM version '5.6'\n" +
      'parameter "Measurement Period" Interval<System.DateTime\n';
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => ({
        cql: testCql,
        isLibraryStatementChanged: false,
        isUsingStatementChanged: false,
        isValueSetChanged: false,
      }));
    (validateContent as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      })
    );

    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCql);

    const applyParamBtn = await screen.findByTestId("apply-parameter");
    userEvent.click(applyParamBtn);
    await waitFor(() => {
      expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
        "Parameter Measurement Period has already been defined in CQL."
      );
    });
    // CQL should remain unchanged
    const editor = screen.getByTestId("measure-editor");
    expect(editor).toHaveValue(testCql);
  });

  it("should apply function successfully", async () => {
    const testCql =
      "library ApplyFuncTest version '0.0.000'\n" + "using QDM version '5.6'\n";
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => ({
        cql: testCql,
        isLibraryStatementChanged: false,
        isUsingStatementChanged: false,
        isValueSetChanged: false,
      }));
    (validateContent as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      })
    );

    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCql);

    const applyFuncBtn = await screen.findByTestId("apply-function");
    userEvent.click(applyFuncBtn);
    await waitFor(() => {
      const editor = screen.getByTestId(
        "measure-editor"
      ) as HTMLTextAreaElement;
      expect(editor.value).toContain("MeasureObservation");
    });
    expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
      "Function MeasureObservation has been successfully added to the CQL."
    );
  });

  it("should show info toast when applying duplicate function", async () => {
    const testCql =
      "library ApplyFuncTest version '0.0.000'\n" +
      "using QDM version '5.6'\n" +
      'define function "MeasureObservation"("e" "Encounter"):\n' +
      "  2\n";
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => ({
        cql: testCql,
        isLibraryStatementChanged: false,
        isUsingStatementChanged: false,
        isValueSetChanged: false,
      }));
    (validateContent as jest.Mock).mockClear().mockImplementation(() =>
      Promise.resolve({
        errors: [],
        translation: null,
        externalErrors: [],
      })
    );

    const measureWithCql = {
      ...measure,
      model: Model.QDM_5_6,
      cql: testCql,
    } as Measure;

    renderEditor(measureWithCql);

    const applyFuncBtn = await screen.findByTestId("apply-function");
    userEvent.click(applyFuncBtn);
    await waitFor(() => {
      expect(screen.getByTestId("measure-editor-toast")).toHaveTextContent(
        "Function MeasureObservation has already been defined in CQL."
      );
    });
    // CQL should remain unchanged
    const editor = screen.getByTestId("measure-editor");
    expect(editor).toHaveValue(testCql);
  });

  it("Should successfully lock", async () => {
    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);
    mockMeasureServiceApi.unlockMeasure.mockResolvedValueOnce({
      isLocked: false,
      lockedBy: "testuser@example.com",
    });
    mockMeasureServiceApi.updateMeasureLock.mockResolvedValueOnce({
      isLocked: true,
      lockedBy: "testuser@example.com",
    });

    renderEditor(measure);

    await waitFor(() => {
      expect(mockMeasureServiceApi.updateMeasureLock).toHaveBeenCalled();
    });
  });

  it("Should fail lock", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockMeasureServiceApi.updateMeasure.mockResolvedValueOnce(measure);
    mockMeasureServiceApi.unlockMeasure.mockResolvedValueOnce({
      isLocked: false,
      lockedBy: "testuser@example.com",
    });
    mockMeasureServiceApi.updateMeasureLock.mockRejectedValueOnce({
      isLocked: true,
      lockedBy: "testuser@example.com",
    });
    renderEditor(measure);

    await waitFor(() => {
      expect(mockMeasureServiceApi.updateMeasureLock).toHaveBeenCalled();
    });

    // You can also assert that an error was thrown
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe("Measure Editor - measure locked", () => {
  it("should show locked message when measure is locked", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <MemoryRouter
          initialEntries={[{ pathname: `/measures/${measure.id}/cql-editor` }]}
        >
          <Routes>
            <Route
              path="/measures/:measureId/cql-editor"
              element={
                <MeasureEditor
                  measureCanEdit={true}
                  measureLockedBy="testuser@example.com"
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </ApiContextProvider>
    );

    await waitFor(() => {
      const message = screen.getByTestId("measure-locked-modal-message");
      expect(message).toHaveTextContent(
        /This measure is currently edited by HARP ID/i
      );
      expect(message).toHaveTextContent("testuser@example.com");
      expect(message).toHaveTextContent(
        "You will be unable to make changes at this time."
      );
    });
  });
});
