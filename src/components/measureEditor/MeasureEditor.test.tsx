import { fireEvent, render, waitFor } from "@testing-library/react";
import * as React from "react";
import MeasureEditor from "./MeasureEditor";
import { MeasureContextProvider } from "../EditMeasure/MeasureContext";
import Measure from "../../models/Measure";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import axios from "axios";

const measure = {
  id: "abcd-pqrs-xyz",
  model: "FHIR",
  measureName: "MSR001",
  cql: "library testCql version '1.0.000'",
} as Measure;

const setMeasure = jest.fn();
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "madie.com",
  },
};

const renderEditor = () => {
  const { getByTestId } = render(
    <ApiContextProvider value={serviceConfig}>
      <MeasureContextProvider value={{ measure, setMeasure }}>
        <MeasureEditor />
      </MeasureContextProvider>
    </ApiContextProvider>
  );

  return getByTestId;
};

describe("MeasureEditor component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should mount measure editor component with measure cql", async () => {
    const getByTestId = renderEditor();
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
  });

  it("save measure with updated cql in editor on save button click", async () => {
    mockedAxios.put.mockResolvedValue({ data: measure });
    const getByTestId = renderEditor();
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql version '2.0.000'",
      },
    });
    fireEvent.click(getByTestId("save_cql_btn"));
    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
      expect(setMeasure).toHaveBeenCalledTimes(1);
    });
  });

  it("reset the editor changes with measure cql when clicked on cancel button", async () => {
    mockedAxios.put.mockResolvedValue({ data: measure });
    const getByTestId = renderEditor();
    const editorContainer = (await getByTestId(
      "measure-editor"
    )) as HTMLInputElement;
    expect(measure.cql).toEqual(editorContainer.value);
    fireEvent.change(getByTestId("measure-editor"), {
      target: {
        value: "library testCql version '2.0.000'",
      },
    });
    fireEvent.click(getByTestId("reset_cql_btn"));
    // no save callbacks should be executed
    await waitFor(() => {
      expect(measure.cql).toEqual(editorContainer.value);
      expect(mockedAxios.put).toHaveBeenCalledTimes(0);
      expect(setMeasure).toHaveBeenCalledTimes(0);
    });
  });
});
