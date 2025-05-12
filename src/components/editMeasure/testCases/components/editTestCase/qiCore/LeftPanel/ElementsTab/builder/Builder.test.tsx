import * as React from "react";
import Builder from "./Builder";
import { render, screen, waitFor } from "@testing-library/react";
import { Measure, TestCase } from "@madie/madie-models";
import { QiCoreResourceProvider } from "../../../../../../util/QiCorePatientProvider";
import { ExecutionContextProvider } from "../../../../../routes/qiCore/ExecutionContext";
import userEvent from "@testing-library/user-event";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../api/ServiceContext";
import { useFormikContext } from "formik";

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
  excelExportService: {
    baseUrl: "excel-export-service.com",
  },
};

jest.mock("../../../../../../api/useFhirDefinitionsService", () => {
  return () => ({
    getResources: () => [
      {
        id: "qicore-patient",
        title: "QICore Patient",
        type: "Patient",
        category: "Base.Individuals",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
      },
      {
        id: "qicore-procedure",
        title: "QICore Procedure",
        type: "Procedure",
        category: "Clinical.Summary",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
      },
      {
        id: "qicore-encounter",
        title: "QICore Encounter",
        type: "Encounter",
        category: "Base.Management",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
      },
    ],
  });
});
jest.mock(
  "../../../../../../../../../api/useFhirElmTranslationServiceApi",
  () => {
    return () => ({
      fetchRelevantDataElements: () => [
        {
          oid: "ts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1095.101",
          title: "Hospice Status",
          description: "Procedure: Hospice Status",
          type: "Procedure",
          drc: false,
          codeId: null,
          name: "Hospice Status",
        },
        {
          oid: "ts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1095.91",
          title: "Dietitian Referral",
          description: "Procedure: Dietitian Referral",
          type: "Procedure",
          drc: false,
          codeId: null,
          name: "Dietitian Referral",
        },
        {
          oid: "ts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.666.5.307",
          title: "Encounter Inpatient",
          description: "Encounter: Encounter Inpatient",
          type: "Encounter",
          drc: false,
          codeId: null,
          name: "Encounter Inpatient",
        },
      ],
    });
  }
);
const mockMeasure = {
  id: "test",
  measureScoring: "scoring",
  createdBy: "test",
} as unknown as Measure;

jest.mock("formik", () => ({
  useFormikContext: jest.fn(),
}));

const renderBuilderComponent = () => {
  return render(
    <ApiContextProvider value={serviceConfig}>
      <ExecutionContextProvider
        value={{
          measureState: [mockMeasure, jest.fn()],
          bundleState: [null, jest.fn()],
          valueSetsState: [null, jest.fn()],
          executionContextReady: true,
          executing: false,
          setExecuting: jest.fn(),
          contextFailure: false,
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
};

describe("Builder Component", () => {
  const resetForm = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("renders the component correctly", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({ resetForm, dirty: true });

    renderBuilderComponent();
    const addedTab = screen.getByText("Added (0)");

    userEvent.click(addedTab);
    const discardDialog = await screen.getByRole("dialog", {
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
      expect(screen.getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(screen.getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(closeButton).not.toBeInTheDocument();
    });
  });

  it("should render Available and Added tabs correctly", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm,
      dirty: false,
    });

    renderBuilderComponent();

    const availableTab = await screen.findByText("Available");
    const addedTab = await screen.findByText("Added (0)");

    expect(availableTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByLabelText("Search")).toBeInTheDocument();
    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(4);

    userEvent.click(addedTab);
    expect(addedTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Resource & Value Set")).toBeInTheDocument();
  });
});
