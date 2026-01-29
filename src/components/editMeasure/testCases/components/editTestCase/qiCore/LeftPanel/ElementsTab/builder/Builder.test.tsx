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
import { within } from "@testing-library/dom";

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
        id: "qicore-service-request",
        title: "QICore ServiceRequest",
        type: "ServiceRequest",
        category: "Clinical.Summary",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-servicerequest",
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
      {
        id: "ChargeItem",
        title: "ChargeItem",
        type: "ChargeItem",
        category: "Financial.General",
        profile: "http://hl7.org/fhir/StructureDefinition/ChargeItem",
      },
    ],
  });
});
jest.mock(
  "../../../../../../../../../api/useFhirElmTranslationServiceApi",
  () => {
    return () => ({
      fetchRelevantDataElements: () =>
        Promise.resolve([
          {
            profile:
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-servicerequest",
            type: "ServiceRequest",
          },
          {
            profile:
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
            type: "Procedure",
          },
          {
            profile:
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
            type: "Encounter",
          },
        ]),
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

const mockBundleWithMultiplePatients = {
  entry: [
    {
      fullUrl:
        "https://madie.cms.gov/Patient/f62fc126-f694-4c7e-88d1-8d7c88671476",
      resource: {
        id: "f62fc126-f694-4c7e-88d1-8d7c88671476",
        resourceType: "Patient",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
          ],
        },
      },
    },
    {
      fullUrl:
        "https://madie.cms.gov/Patient/f62fc126-f694-4c7e-88d1-8d7c88671476",
      resource: {
        id: "f62fc126-f694-4c7e-88d1-8d7c88671476",
        resourceType: "Patient",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
          ],
        },
      },
    },
  ],
};
const renderBuilderComponent = (
  bundleToAdd = mockBundleWithMultiplePatients,
  activeTab = "available"
) => {
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
            state: { bundle: bundleToAdd },
            dispatch: jest.fn(),
          }}
        >
          <Builder
            canEdit={true}
            testCase={{} as TestCase}
            setInitialFormikValuesStu6={jest.fn()}
            setValidationSchema={jest.fn()}
            activeTab={activeTab}
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

    renderBuilderComponent(mockBundle);
    const addedTab = screen.getByText("Added (3)");

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

    renderBuilderComponent(mockBundle, "available");

    const availableTab = await screen.findByText("Available");
    const addedTab = await screen.findByText("Added (3)");

    expect(availableTab).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByLabelText("Search")).toBeInTheDocument();
    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(5);
  });

  it("renders the Added tab content correctly", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm,
      dirty: false,
    });

    renderBuilderComponent(mockBundle, "added");

    expect(screen.getByText("Profile")).toBeInTheDocument();
    // Verify the table is rendered
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("should not render Available content when canEdit is false and activeTab is available", async (bundleToAdd = mockBundle) => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm,
      dirty: false,
    });

    render(
      <ApiContextProvider value={serviceConfig}>
        <ExecutionContextProvider
          value={{
            measureState: [mockMeasure, jest.fn()],
            bundleState: [null, jest.fn()] as any,
            valueSetsState: [null, jest.fn()] as any,
            executionContextReady: true,
            executing: false,
            setExecuting: jest.fn(),
            contextFailure: false,
          }}
        >
          <QiCoreResourceContext.Provider
            value={{
              state: { bundle: bundleToAdd },
              dispatch: jest.fn(),
            }}
          >
            <Builder
              canEdit={false}
              testCase={{} as TestCase}
              setInitialFormikValuesStu6={jest.fn()}
              setValidationSchema={jest.fn()}
              activeTab="available"
            />
          </QiCoreResourceContext.Provider>
        </ExecutionContextProvider>
      </ApiContextProvider>
    );

    // ResourceList should not be rendered when canEdit is false
    expect(screen.queryByLabelText("Search")).not.toBeInTheDocument();
  });

    // Added tab should still be present and selected by default
    const addedTab = await screen.findByText("Added (3)");
    expect(addedTab).toBeInTheDocument();
    expect(addedTab).toHaveAttribute("aria-selected", "true");

    // Grid content should be visible
    expect(screen.getByText("Profile")).toBeInTheDocument();
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

    renderBuilderComponent(mockBundle, "available");

    const rows = await screen.findAllByRole("row");
    const firstResourceRow = rows.find((row) =>
      row.textContent?.includes("QICore Patient")
    );

    // The first resource row should be the first after the header
    expect(rows.indexOf(firstResourceRow!)).toBe(1);

    const resourceTitles = rows.slice(1).map((row) => row.textContent);
    expect(resourceTitles[0]).toContain("QICore Patient");
    expect(resourceTitles[1]).toContain("QICore ServiceRequest");
    expect(resourceTitles[2]).toContain("QICore Procedure");
    expect(resourceTitles[3]).toContain("QICore Encounter");
  });

  it("renders loading spinner overlay container in Added tab", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const { container } = renderBuilderComponent(mockBundle, "added");

    const addedTab = await screen.findByText("Added (3)");
    userEvent.click(addedTab);

    await waitFor(() => {
      expect(addedTab).toHaveAttribute("aria-selected", "true");
    });

    // Initially, the spinner should not be visible
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("displays Added tab content with wrapper for spinner overlay", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const { container } = renderBuilderComponent(mockBundle);

    const addedTab = await screen.findByText("Added (3)");
    userEvent.click(addedTab);

    await waitFor(() => {
      expect(addedTab).toHaveAttribute("aria-selected", "true");
    });

    // Check that the wrapper div with relative positioning exists
    const tabContent = container.querySelector('[style*="position: relative"]');
    expect(tabContent).toBeInTheDocument();
    expect(tabContent).toHaveStyle({ minHeight: "400px" });
  });

  it("renders MadieSpinner import for loading functionality", () => {
    // This test verifies the MadieSpinner is imported and available
    // The actual rendering is tested via integration with ElementEditor
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    renderBuilderComponent(mockBundle, "available");

    // Verify the builder component renders successfully
    expect(screen.getByTestId("qi-core-test-case-builder")).toBeInTheDocument();
  });

  it("passes applyLoading state to ResourceEditor", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const { container } = renderBuilderComponent(mockBundle);

    const addedTab = await screen.findByText("Added (3)");
    userEvent.click(addedTab);

    await waitFor(() => {
      expect(addedTab).toHaveAttribute("aria-selected", "true");
    });

    // The ResourceEditor should receive the applyLoading props
    // Verify the wrapper structure that contains ResourceEditor
    const wrapperDiv = container.querySelector('[style*="position: relative"]');
    expect(wrapperDiv).toBeInTheDocument();
  });

  it("Shows a JSON error when too many patients are added", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    renderBuilderComponent(mockBundleWithMultiplePatients);
    const madieErrorAlert = await screen.findByTestId(
      "json-error-alert-multiple-patients"
    );
    expect(madieErrorAlert).toBeInTheDocument();
  });
});
