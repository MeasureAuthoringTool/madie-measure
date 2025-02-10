import React from "react";
import Builder from "./Builder";
import { render, screen, waitFor } from "@testing-library/react";
import { TestCase } from "@madie/madie-models";
import { QiCoreResourceProvider } from "../../../../../../util/QiCorePatientProvider";
import { ExecutionContextProvider } from "../../../../../routes/qiCore/ExecutionContext";
import userEvent from "@testing-library/user-event";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../api/ServiceContext";

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "measure.com",
  },
  testCaseService: {
    baseUrl: "testCaseService.com",
  },
  terminologyService: {
    baseUrl: "terminologyService.com",
  },
  qdmElmTranslationService: {
    baseUrl: "qdm-elm-translator.com",
  },
  fhirElmTranslationService: {
    baseUrl: "fhir-elm-translator.com",
  },
  fhirService: {
    baseUrl: "fhir-service.com",
  },
};

jest.mock("../../../../../../api/useFhirDefinitionsService", () => {
  return () => ({
    getResources: () => [],
  });
});
jest.mock(
  "../../../../../../../../../api/useFhirElmTranslationServiceApi",
  () => {
    return () => ({
      fetchRelevantDataElements: () => [],
    });
  }
);
const measure = {
  id: "test",
  measureScoring: "scoring",
  createdBy: "test",
};

const setMeasure = jest.fn();
const resetForm = jest.fn();
const mockFormikObj = {
  resetForm,
  dirty: true,
};

jest.mock("formik", () => ({
  useFormikContext: () => {
    return mockFormikObj;
  },
  getIn: (context: Record<string, unknown>, fieldName: string) => {
    return context[fieldName];
  },
}));
describe("Builder Component", () => {
  const { getByRole, getByText } = screen;
  it("renders the component correctly", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [measure, setMeasure],
          }}
        >
          <QiCoreResourceProvider>
            <Builder
              canEdit={true}
              testCase={{} as TestCase}
              setInitialFormikValuesStu6={jest.fn()}
              setValidationSchema={jest.fn()}
            />
          </QiCoreResourceProvider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );
    const addedTab = getByText("Added (0)");

    userEvent.click(addedTab);
    const discardDialog = await getByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();
    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
    userEvent.click(addedTab);
    await waitFor(() => {
      expect(getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
  });
});
