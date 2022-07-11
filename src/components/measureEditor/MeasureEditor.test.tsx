import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import MeasureEditor from "./MeasureEditor";
import { MeasureContextProvider } from "../editMeasure/MeasureContext";
import { Measure, Model } from "@madie/madie-models";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import axios from "axios";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { parseContent, translateContent } from "@madie/madie-editor";
import CqlError from "@madie/cql-antlr-parser/dist/src/dto/CqlError";

jest.mock("@madie/madie-util", () => ({
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => MEASURE_CREATEDBY,
  }),
}));

const MEASURE_CREATEDBY = "othertestuser@example.com";
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

export type ElmTranslationError = {
  startLine: number;
  startChar: number;
  endChar: number;
  endLine: number;
  errorSeverity: string;
  errorType: string;
  message: string;
  targetIncludeLibraryId: string;
  targetIncludeLibraryVersionId: string;
  type: string;
};

const elmTranslationErrors: ElmTranslationError[] = [
  {
    startLine: 16,
    startChar: 1,
    endLine: 16,
    endChar: 35,
    errorType: "",
    errorSeverity: "Error",
    targetIncludeLibraryId: "EXM124v7QICore4",
    targetIncludeLibraryVersionId: "7.0.000",
    type: "",
    message: "Could not load source for library FHIRHelpers, version 4.0.1.",
  },
];

const cqlErrors: CqlError[] = [
  {
    text: "error text",
    name: "error name",
    start: { line: 5, position: 10 },
    stop: { line: 5, position: 12 },
    message: `Cannot find symbol "Measurement Period"`,
  },
];

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
      }
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
      expect(setMeasure).toHaveBeenCalledTimes(1);
    });
  });

  it("should alert user if ELM translation fails on save", async () => {
    (translateContent as jest.Mock).mockImplementation((content) => {
      return Promise.reject(elmTranslationErrors);
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
  });

  it("should persist error flag when there are ELM translation errors", async () => {
    (translateContent as jest.Mock).mockImplementation((content) => {
      return Promise.resolve(elmTranslationErrors);
    });
    mockedAxios.put.mockImplementation((args) => {
      if (args && args.startsWith(serviceConfig.measureService.baseUrl)) {
        return Promise.resolve({ data: measure });
      }
    });
    renderEditor(measure);
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
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: MEASURE_CREATEDBY,
        elmJson: JSON.stringify(elmTranslationErrors),
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
    (translateContent as jest.Mock).mockImplementation((content) => {
      return Promise.resolve(cqlErrors);
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
        value:
          "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
      },
    });
    parseContent.mockClear().mockImplementation(() => ["Test error"]);
    const saveButton = screen.getByRole("button", { name: "Save" });
    userEvent.click(saveButton);
    const saveSuccess = await screen.findByText("CQL saved successfully");
    expect(saveSuccess).toBeInTheDocument();
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: MEASURE_CREATEDBY,
        elmJson: JSON.stringify(cqlErrors),
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
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "madie.com/measures/abcd-pqrs-xyz",
      {
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.000'",
        cqlErrors: true,
        cqlLibraryName: "",
        createdAt: "",
        createdBy: MEASURE_CREATEDBY,
        elmJson: JSON.stringify(cqlErrors),
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
});

it("Save button and Cancel button should not show if user is not the owner of the measure", () => {
  measure.createdBy = "AnotherUser@example.com";
  renderEditor(measure);

  const cancelButton = screen.queryByTestId("reset-cql-btn");
  expect(cancelButton).not.toBeInTheDocument();
  const saveButton = screen.queryByTestId("save-cql-btn");
  expect(saveButton).not.toBeInTheDocument();
});
