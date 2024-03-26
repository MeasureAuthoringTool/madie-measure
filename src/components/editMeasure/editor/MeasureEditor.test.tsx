import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import * as React from "react";
import {
  mapErrorsToAceAnnotations,
  mapErrorsToAceMarkers,
} from "./MeasureEditor";
import CqlEditor from "./CqlEditor";
import { Measure, MeasureErrorType } from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../../api/ServiceContext";
import axios from "axios";
import { ElmTranslationError } from "./measureEditorUtils";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import {
  ElmTranslationExternalError,
  parseContent,
  synchingEditorCqlContent,
  isUsingEmpty,
  validateContent,
} from "@madie/madie-editor";
import { measureStore } from "@madie/madie-util";

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

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  })),
  useFeatureFlags: jest.fn().mockReturnValue({
    qdmCodeSearch: true,
  }),
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
      // set(measure)
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
}));

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const MEASURE_CREATEDBY = "testuser@example.com"; //#nosec

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

// const setMeasure = jest.fn();
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

const renderEditor = (measure) => {
  measureStore.state.mockImplementationOnce(() => measure);
  return render(
    <ApiContextProvider value={serviceConfig}>
      <CqlEditor isQDM={false} canEdit={true} />
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

  it("right panel navigation works as expected for QDM measures", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <CqlEditor isQDM={true} canEdit={true} />
      </ApiContextProvider>
    );

    const valueSets = await screen.findByText("Value Sets");
    const codes = await screen.findByText("Codes");
    const definitions = await screen.findByText("Definitions");

    expect(valueSets).toHaveAttribute("aria-selected", "true");
    act(() => {
      fireEvent.click(codes);
    });
    await waitFor(() => {
      expect(codes).toHaveAttribute("aria-selected", "true");
    });

    act(() => {
      fireEvent.click(definitions);
    });
    await waitFor(() => {
      expect(definitions).toHaveAttribute("aria-selected", "true");
    });
    act(() => {
      fireEvent.click(valueSets);
    });
    await waitFor(() => {
      expect(valueSets).toHaveAttribute("aria-selected", "true");
    });
  });

  it("right panel navigation shouldn't appear for QI Core measure", () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <CqlEditor isQDM={false} canEdit={true} />
      </ApiContextProvider>
    );

    const rightPanelNavBar = screen.queryByTestId("right-panel-navs");
    expect(rightPanelNavBar).not.toBeInTheDocument();
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
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return "library testCql version '0.0.000'";
      });

    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
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
        "Changes saved successfully but the following issues were found"
      );
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
  });

  it("save measure with updated cql in editor on save button click and show return type error", async () => {
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return "library testCql version '0.0.000'";
      });

    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({
          data: {
            ...measure,
            errors: [MeasureErrorType.MISMATCH_CQL_POPULATION_RETURN_TYPES],
          },
        });
      }
    });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
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
        "Changes saved successfully but the following issues were found"
      );
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
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

    await waitFor(() =>
      expect(
        screen.getByText(
          "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
        )
      ).toBeInTheDocument()
    );
  });

  it("save measure with updated cql in editor on save button click and show error for missing using", async () => {
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        translation: { library: {} },
      });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return "library testCql version '0.0.000'";
      });

    isUsingEmpty.mockClear().mockImplementation(() => true);

    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
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
        "Changes saved successfully but the following issues were found"
      );
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
  });

  it("should alert user if ELM translation fails on save", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.reject({ data: { error: "Something bad happened!" } });
    });

    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return "librarydwwd Test2dvh3wd version '0.0.000'";
      });

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
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
        "Changes saved successfully but the following issues were found"
      );
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
  });

  it("should persist error flag when there are ELM translation errors", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });
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
        return "library AdvancedIllnessandFrailtyExclusion version '1.0.001'\nusing QI-Core version '4.1.1'";
      });

    isUsingEmpty.mockClear().mockImplementation(() => false);

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
          "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'\nusing QI-Core version '4.1.1'",
      },
    });
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText(
      "CQL updated successfully! Library Statement or Using Statement were incorrect. MADiE has overwritten them to ensure proper CQL."
    );
    expect(saveSuccess).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion version '1.0.001'\nusing QI-Core version '4.1.1'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: "testuser@example.com",
        elmJson: '{"library":{}}',
        id: "abcd-pqrs-xyz",
        lastModifiedAt: "",
        lastModifiedBy: "",
        measureHumanReadableId: "",
        measureMetaData: {},
        measureName: "MSR001",
        measureScoring: "",
        measureSetId: "",
        model: "QI-Core v4.1.1",
        revisionNumber: "1",
        state: "",
        version: "1.0.000",
        acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
      },
      { headers: { Authorization: "Bearer test.jwt" } }
    );
  });

  it("should persist error flag when there are parse errors", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });
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
        return "library AdvancedIllnessandFrailtyExclusion version '1.0.001'\nusing QI-Core version '4.1.1'";
      });

    isUsingEmpty.mockClear().mockImplementation(() => false);

    const { getByTestId } = renderEditor(measure);
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
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
      "CQL updated successfully! Library Statement or Using Statement were incorrect. MADiE has overwritten them to ensure proper CQL."
    );
    expect(saveSuccess).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion version '1.0.001'\nusing QI-Core version '4.1.1'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: "testuser@example.com",
        elmJson: '{"library":{}}',
        id: "abcd-pqrs-xyz",
        lastModifiedAt: "",
        lastModifiedBy: "",
        measureHumanReadableId: "",
        measureMetaData: {},
        measureName: "MSR001",
        measureScoring: "",
        measureSetId: "",
        model: "QI-Core v4.1.1",
        revisionNumber: "1",
        state: "",
        version: "1.0.000",
        acls: [{ userId: "othertestuser@example.com", roles: ["SHARED_WITH"] }],
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
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      // check for old value
      expect(measure.cql).toEqual(editorContainer.value);
    });
  });

  it("it closes the dialog without changing the cql", async () => {
    const { getByTestId, queryByText } = renderEditor(measure);
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
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const cancelButton = await screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("reports an error when save cql fails", async () => {
    // mock put call for errors
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.reject("server error");
      }
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
      const error = getByTestId("generic-error-text-header");
      expect(error.textContent).toEqual("Errors were found within the CQL");
    });
  });

  it("runs ELM translation on initial load of component and generate annotations", async () => {
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });
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
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });
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
    measureStore.state.mockImplementationOnce(() => measure);

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

    await waitFor(() =>
      expect(
        screen.getByText(
          "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
        )
      ).toBeInTheDocument()
    );

    userEvent.click(screen.getByTestId("close-error-button"));
    await waitFor(() =>
      expect(
        screen.queryByText(
          "CQL return types do not match population criteria! Test Cases will not execute until this issue is resolved."
        )
      ).not.toBeInTheDocument()
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
});

it("Save button and Cancel button should not show if user is not the owner of the measure", () => {
  render(
    <ApiContextProvider value={serviceConfig}>
      <CqlEditor isQDM={false} canEdit={false} />
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
    }
  });

  renderEditor(measureWithCqlCodes);
  const issues = await screen.findByText("1 issues found with CQL");
  expect(issues).toBeInTheDocument();
  const loggedIn = await screen.findByText("Please log in to UMLS!");
  expect(loggedIn).toBeInTheDocument();
});
