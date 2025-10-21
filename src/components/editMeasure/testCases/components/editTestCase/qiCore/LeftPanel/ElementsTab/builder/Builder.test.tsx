import * as React from "react";
import Builder, { scrollToElementByIdWhenAvailable } from "./Builder";
import { render, screen, waitFor } from "@testing-library/react";
import { Measure, TestCase } from "@madie/madie-models";
import { QiCoreResourceContext } from "../../../../../../util/QiCorePatientProvider";
import { ExecutionContextProvider } from "../../../../../routes/qiCore/ExecutionContext";
import userEvent from "@testing-library/user-event";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../api/ServiceContext";
import { useFormikContext } from "formik";
import { mockBundle } from "./grid/TestCaseSummaryGrid.test";

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
        <QiCoreResourceContext.Provider
          value={{
            state: { bundle: mockBundle },
            dispatch: jest.fn(),
          }}
        >
          <Builder
            canEdit={true}
            testCase={{} as TestCase}
            setInitialFormikValuesStu6={jest.fn()}
            setValidationSchema={jest.fn()}
          />
        </QiCoreResourceContext.Provider>
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
    const addedTab = screen.getByText("Added (2)");

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
    const addedTab = await screen.findByText("Added (2)");

    expect(availableTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByLabelText("Search")).toBeInTheDocument();
    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(4);

    userEvent.click(addedTab);
    expect(addedTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Resource & Value Set")).toBeInTheDocument();
  });
});

describe("scrollToElementByIdWhenAvailable", () => {
  jest.useFakeTimers();

  let scrollIntoViewMock: jest.Mock;

  beforeEach(() => {
    document.body.innerHTML = "";
    scrollIntoViewMock = jest.fn();
  });

  it("scrolls to the element once it becomes available", () => {
    // Trigger scroll on third check
    setTimeout(() => {
      const div = document.createElement("div");
      div.id = "target";
      div.scrollIntoView = scrollIntoViewMock;
      document.body.appendChild(div);
    }, 250);

    scrollToElementByIdWhenAvailable("target");

    jest.advanceTimersByTime(100); // attempt 1
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // attempt 2
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // attempt 3 (element appears)
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth" });
  });

  it("stops checking after maxAttempts if element is not found", () => {
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");

    scrollToElementByIdWhenAvailable(
      "non-existent",
      { behavior: "instant" },
      10,
      3
    );

    jest.advanceTimersByTime(30); // 3 attempts of 10ms

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("always displays QI Core Patient at the top of the available resources list", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    renderBuilderComponent();

    const availableTab = await screen.findByText("Available");
    expect(availableTab).toBeInTheDocument();

    const rows = await screen.findAllByRole("row");
    const firstResourceRow = rows.find((row) =>
      row.textContent?.includes("QICore Patient")
    );

    // The first resource row should be the first after the header
    expect(rows.indexOf(firstResourceRow!)).toBe(1);

    const resourceTitles = rows.slice(1).map((row) => row.textContent);
    expect(resourceTitles[0]).toContain("QICore Patient");
    expect(resourceTitles[1]).toContain("QICore Procedure");
    expect(resourceTitles[2]).toContain("QICore Encounter");
  });
});
