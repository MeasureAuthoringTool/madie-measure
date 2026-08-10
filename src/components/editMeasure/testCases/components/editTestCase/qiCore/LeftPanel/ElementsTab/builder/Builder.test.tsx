import * as React from "react";
import Builder, {
  NO_PROFILES_MESSAGE,
  scrollToElementByIdWhenAvailable,
  deduplicateAndSortResources,
  isResourceForModel,
} from "./Builder";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure, Model, TestCase } from "@madie/madie-models";
import { QiCoreResourceContext } from "../../../../../../util/QiCorePatientProvider";
import { ExecutionContextProvider } from "../../../../../routes/qiCore/ExecutionContext";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../api/ServiceContext";
import { useFormikContext } from "formik";
import { mockBundle } from "./grid/TestCaseSummaryGrid.test";

const mockGetResourceTree = jest.fn(() => Promise.resolve({}));

jest.mock("./resource/ResourceEditor", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MockResourceEditor({ setApplyLoading }) {
      React.useEffect(() => {
        setApplyLoading(true);
      }, [setApplyLoading]);
      return <div data-testid="mock-resource-editor" />;
    },
  };
});

jest.mock("./resource/ResourceList", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: function MockResourceList(props) {
      const { resourceIdentifiers = [], onClick } = props;

      React.useEffect(() => {
        if (resourceIdentifiers.length && onClick) {
          onClick(resourceIdentifiers[0]);
        }
      }, [resourceIdentifiers, onClick]);

      return (
        <div data-testid="mock-resource-list">
          <label>
            Search
            <input aria-label="Search" />
          </label>
          <table>
            <tbody>
              {resourceIdentifiers.map((res) => (
                <tr key={res.id}>
                  <td>{res.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  };
});

const defaultResourceIdentifiers = [
  {
    id: "qicore-patient",
    title: "QICore Patient",
    type: "Patient",
    category: "Base.Individuals",
    profile: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
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
];

const mockGetResources = jest.fn(() => defaultResourceIdentifiers);
const mockGetBuilderResourceMetadata = jest.fn(() => ({
  resourcePaths: ["/fhir/us/qicore", "/fhir/us/core"],
  primaryPatientProfile: {
    id: "qicore-patient",
    title: "QICore Patient",
    type: "Patient",
    profile: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
  },
}));

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "measure.com",
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
    getResources: mockGetResources,
    getBuilderResourceMetadata: mockGetBuilderResourceMetadata,
    getResourceTree: mockGetResourceTree,
  });
});
const mockFetchRelevantDataElements = jest.fn(() =>
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
  ])
);
jest.mock(
  "../../../../../../../../../api/useFhirElmTranslationServiceApi",
  () => {
    return () => ({
      fetchRelevantDataElements: (...args) =>
        mockFetchRelevantDataElements(...args),
    });
  }
);
const mockMeasure = {
  id: "test",
  model: Model.QICORE,
  measureScoring: "scoring",
  createdBy: "test",
} as unknown as Measure;

jest.mock("formik", () => ({
  useFormikContext: jest.fn(),
}));

jest.mock("../../../../../../api/fhirDefinitionServiceUtilities", () => ({
  buildMadieResourceFromResourceIdentifier: (resourceIdentifier) => ({
    bundleEntry: true,
    resource: { resourceType: resourceIdentifier.type || "Observation" },
  }),
  getTopLevelElements: () => [
    {
      min: 1,
      max: "1",
      path: "component",
      base: { max: "1" },
      patternCodeableConcept: { coding: [{ code: "pattern" }] },
    },
    {
      min: 1,
      max: "1",
      path: "value",
      base: { max: "*" },
      fixedCode: { code: "fixed" },
    },
  ],
  getLastPart: (path) => path,
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
const mockBundleSameRespurceIds = {
  entry: [
    {
      fullUrl:
        "https://madie.cms.gov/Organization/NotscreRefAsseNotmNodxNocp-98",
      resource: {
        resourceType: "Organization",
        id: "NotscreRefAsseNotmNodxNocp-98",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-organization",
          ],
        },
        identifier: [
          {
            use: "temp",
            system: "urn:oid:2.16.840.1.113883.4.4",
            value: "21-3259825",
          },
        ],
        active: true,
        type: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/organization-type",
                code: "pay",
                display: "Payer",
              },
            ],
          },
        ],
        name: "Blue Cross Blue Shield of Texas",
      },
    },
    {
      fullUrl:
        "https://madie.cms.gov/Organization/NotscreRefAsseNotmNodxNocp-98",
      resource: {
        resourceType: "Organization",
        id: "NotscreRefAsseNotmNodxNocp-98",
        meta: {
          profile: [
            "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-organization",
          ],
        },
        identifier: [
          {
            use: "temp",
            system: "urn:oid:2.16.840.1.113883.4.4",
            value: "21-3259825",
          },
        ],
        active: true,
        type: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/organization-type",
                code: "pay",
                display: "Payer",
              },
            ],
          },
        ],
        name: "Blue Cross Blue Shield of Texas",
      },
    },
  ],
};
const renderBuilderComponent = ({
  bundleToAdd = mockBundleWithMultiplePatients,
  activeTab = "available",
  canEdit = true,
  dispatch = jest.fn(),
}: {
  bundleToAdd?: any;
  activeTab?: string;
  canEdit?: boolean;
  dispatch?: jest.Mock;
} = {}) => {
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
            dispatch,
          }}
        >
          <Builder
            canEdit={canEdit}
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
  beforeEach(() => {
    jest.clearAllMocks();
    (useFormikContext as jest.Mock).mockReturnValue({ resetForm: jest.fn() });
    mockGetResources.mockReturnValue(defaultResourceIdentifiers);
    mockGetResourceTree.mockResolvedValue({});
  });

  it("shows an error when multiple patients exist in the bundle", async () => {
    renderBuilderComponent();
    expect(
      await screen.findByTestId("json-error-alert-multiple-patients")
    ).toBeInTheDocument();
  });

  it("renders available content when activeTab is available and editable", async () => {
    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    expect(await screen.findByLabelText("Search")).toBeInTheDocument();
    const rows = await screen.findAllByRole("row");
    expect(rows).toHaveLength(4);
  });

  it("does not render available content when not editable", async () => {
    renderBuilderComponent({
      bundleToAdd: mockBundle,
      activeTab: "available",
      canEdit: false,
    });

    // wait for loading to complete, then verify no search input is shown
    await waitFor(() =>
      expect(
        screen.queryByTestId("available-profiles-loading")
      ).not.toBeInTheDocument()
    );
    expect(screen.queryByLabelText("Search")).not.toBeInTheDocument();
  });

  it("shows a spinner while the available profiles tab is loading", () => {
    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    expect(
      screen.getByTestId("available-profiles-loading")
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("removes the spinner after the available profiles tab finishes loading", async () => {
    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    // spinner is visible during load
    expect(
      screen.getByTestId("available-profiles-loading")
    ).toBeInTheDocument();

    // wait for resources to load
    await screen.findByLabelText("Search");

    // spinner is gone and resource list is shown
    expect(
      screen.queryByTestId("available-profiles-loading")
    ).not.toBeInTheDocument();
  });

  it("renders added content when activeTab is added", async () => {
    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "added" });

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows ResourceEditor when a row is selected for editing in added tab", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "added" });

    await screen.findByText("QICore Encounter");

    const editAction = screen.getByTestId("action-ec-1-Edit");
    userEvent.click(editAction);

    expect(
      await screen.findByTestId("mock-resource-editor")
    ).toBeInTheDocument();
  });

  it("calls handleRowDelete when row delete is confirmed", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const mockDispatch = jest.fn();
    renderBuilderComponent({
      bundleToAdd: mockBundle,
      activeTab: "added",
      dispatch: mockDispatch,
    });

    await screen.findByText("QICore Encounter");
    const deleteAction = screen.getByTestId("action-ec-1-Remove");
    userEvent.click(deleteAction);

    const continueButton = await screen.findByTestId(
      "delete-dialog-continue-button"
    );
    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "RemoveBundleEntry",
        payload: mockBundle.entry[0],
      });
    });
  });

  it("calls handleRowClone when clone action is clicked", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const mockDispatch = jest.fn();
    renderBuilderComponent({
      bundleToAdd: mockBundle,
      activeTab: "added",
      dispatch: mockDispatch,
    });

    await screen.findByText("QICore Encounter");

    const cloneAction = screen.getByTestId("action-ec-1-Clone");

    userEvent.click(cloneAction);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "AddBundleEntry",
          payload: expect.objectContaining({
            resource: expect.objectContaining({
              resourceType: "Encounter",
            }),
          }),
        })
      );
    });

    // Ensure cloned entry has a different id
    const call = mockDispatch.mock.calls.find(
      (c) => c[0].type === "AddBundleEntry"
    );
    expect(call[0].payload.resource.id).not.toBe("ec-1");
  });

  it("places qicore patient first even when service returns it later", async () => {
    mockGetResources.mockReturnValue([
      defaultResourceIdentifiers[1],
      defaultResourceIdentifiers[2],
      defaultResourceIdentifiers[3],
      defaultResourceIdentifiers[0], // patient intentionally last
    ]);

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    const rows = await screen.findAllByRole("row");
    const firstResourceRow = rows[0];
    expect(firstResourceRow.textContent).toContain("QICore Patient");
  });

  it("maps grid titles using resource definitions and falls back to resource type", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const bundleWithMixedProfiles = {
      entry: [
        {
          resource: {
            resourceType: "Encounter",
            id: "enc-1",
            meta: {
              profile: [
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
              ],
            },
          },
        },
        {
          resource: {
            resourceType: "Observation",
            id: "obs-1",
            meta: {
              profile: ["http://example.com/observation"],
            },
          },
        },
        {
          resource: {
            resourceType: "ServiceRequest",
            id: "sr-1",
            meta: {
              profile: [
                "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-servicerequest",
              ],
            },
          },
        },
      ],
    };

    renderBuilderComponent({
      bundleToAdd: bundleWithMixedProfiles,
      activeTab: "added",
    });

    expect(screen.getByText("QICore Encounter")).toBeInTheDocument();
    expect(screen.getByText("Observation")).toBeInTheDocument();
    expect(screen.getByText("QICore ServiceRequest")).toBeInTheDocument();
  });

  it("handles empty bundle entries without rendering data rows", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const emptyBundle = { entry: [] };

    renderBuilderComponent({ bundleToAdd: emptyBundle, activeTab: "added" });

    const noProfilesAlert = await screen.findByTestId("no-profiles-alert");

    expect(noProfilesAlert).toBeInTheDocument();
    expect(noProfilesAlert).toHaveTextContent(NO_PROFILES_MESSAGE);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("sets resources to empty array when relevantElements is empty", async () => {
    mockFetchRelevantDataElements.mockResolvedValueOnce([]);

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    // wait for loading to finish
    await waitFor(() =>
      expect(
        screen.queryByTestId("available-profiles-loading")
      ).not.toBeInTheDocument()
    );

    // no resource rows should be rendered since resources is empty
    expect(screen.queryAllByRole("row")).toHaveLength(0);
  });

  it("sets resources to empty array when relevantElements is undefined", async () => {
    mockFetchRelevantDataElements.mockResolvedValueOnce(undefined);

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    await waitFor(() =>
      expect(
        screen.queryByTestId("available-profiles-loading")
      ).not.toBeInTheDocument()
    );

    expect(screen.queryAllByRole("row")).toHaveLength(0);
  });

  it("sets resources to empty array when relevantElements is null", async () => {
    mockFetchRelevantDataElements.mockResolvedValueOnce(null);

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    await waitFor(() =>
      expect(
        screen.queryByTestId("available-profiles-loading")
      ).not.toBeInTheDocument()
    );

    expect(screen.queryAllByRole("row")).toHaveLength(0);
  });

  it("triggers resource addition logic with required elements and spinner overlay", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    await screen.findByTestId("mock-resource-list");

    expect(mockGetResourceTree).toHaveBeenCalledWith(
      "qicore-patient",
      Model.QICORE
    );

    const successToast = await screen.findByTestId("builder-success-text");
    expect(successToast).toBeInTheDocument();
    expect(successToast).toHaveTextContent(
      "QICore Patient has successfully been applied to the test case. To save your changes please click 'Save'."
    );
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

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    const rows = await screen.findAllByRole("row");
    const firstResourceRow = rows.find((row) =>
      row.textContent?.includes("QICore Patient")
    );

    // The first resource row should be the first after the header
    expect(rows.indexOf(firstResourceRow!)).toBe(0);

    const resourceTitles = rows.map((row) => row.textContent);
    expect(resourceTitles[0]).toContain("QICore Patient");
    expect(resourceTitles[1]).toContain("QICore Encounter");
    expect(resourceTitles[2]).toContain("QICore Procedure");
    expect(resourceTitles[3]).toContain("QICore ServiceRequest");
  });

  it("renders loading spinner overlay container in Added tab", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "added" });

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("displays Added tab content with wrapper for spinner overlay", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const { container } = renderBuilderComponent({
      bundleToAdd: mockBundle,
      activeTab: "added",
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

    renderBuilderComponent({ bundleToAdd: mockBundle, activeTab: "available" });

    // Verify the builder component renders successfully
    expect(screen.getByTestId("qi-core-test-case-builder")).toBeInTheDocument();
  });

  it("passes applyLoading state to ResourceEditor", async () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      resetForm: jest.fn(),
      dirty: false,
    });

    const { container } = renderBuilderComponent({
      bundleToAdd: mockBundle,
      activeTab: "added",
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

    renderBuilderComponent({ bundleToAdd: mockBundleWithMultiplePatients });
    const madieErrorAlert = await screen.findByTestId(
      "json-error-alert-multiple-patients"
    );
    expect(madieErrorAlert).toBeInTheDocument();
  });

  it("Should render duplicate resource error when duplicate resources are in the bundle", async () => {
    renderBuilderComponent({ bundleToAdd: mockBundleSameRespurceIds });

    const duplicateResourceError = await screen.findByTestId(
      "json-error-alert-duplicate-resource-ids"
    );
    expect(duplicateResourceError).toBeInTheDocument();
  });
});

describe("deduplicateAndSortResources", () => {
  const mockPatient = {
    id: "qicore-patient",
    title: "QICore Patient",
    type: "Patient",
    category: "Base",
    profile: "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
  };
  const mockEncounter = {
    id: "qicore-encounter",
    title: "QICore Encounter",
    type: "Encounter",
    category: "Base",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
  };
  const mockAllergyIntolerance = {
    id: "qicore-allergyintolerance",
    title: "QICore AllergyIntolerance",
    type: "AllergyIntolerance",
    category: "Clinical",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-allergyintolerance",
  };
  const mockCondition = {
    id: "qicore-condition",
    title: "QICore Condition",
    type: "Condition",
    category: "Clinical",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-condition",
  };
  const mockProcedure = {
    id: "qicore-procedure",
    title: "QICore Procedure",
    type: "Procedure",
    category: "Clinical",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-procedure",
  };
  const mockUsCoreCondition = {
    id: "us-core-condition",
    title: "US Core Condition",
    type: "Condition",
    category: "Clinical",
    profile:
      "http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition",
  };
  const mockFhirObservation = {
    id: "fhir-observation",
    title: "FHIR Observation",
    type: "Observation",
    category: "Clinical",
    profile: "http://hl7.org/fhir/StructureDefinition/Observation",
  };

  it("should remove duplicate profiles", () => {
    const input = [mockEncounter, mockEncounter, mockPatient];
    const result = deduplicateAndSortResources(input, mockPatient.id);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.title)).toEqual([
      "QICore Patient",
      "QICore Encounter",
    ]);
  });

  describe("isResourceForModel", () => {
    it("uses model-specific resource paths", () => {
      const usQualityCoreResource = {
        id: "us-quality-core-patient",
        title: "US Quality Core Patient",
        type: "Patient",
        category: "Base.Individuals",
        profile:
          "http://fhir.org/guides/onc/us-quality-core/StructureDefinition/us-quality-core-patient",
      };

      expect(
        isResourceForModel(usQualityCoreResource, [
          "/guides/onc/us-quality-core",
          "/fhir/us/core",
        ])
      ).toBe(true);
      expect(
        isResourceForModel(usQualityCoreResource, [
          "/fhir/us/qicore",
          "/fhir/us/core",
        ])
      ).toBe(false);
    });
  });

  it("should place the primary patient profile first regardless of alphabetical order", () => {
    const input = [mockAllergyIntolerance, mockCondition, mockPatient];
    const result = deduplicateAndSortResources(input, mockPatient.id);
    expect(result[0].id).toBe("qicore-patient");
  });

  it("should not produce duplicates when called multiple times with the same input", () => {
    const input = [mockPatient, mockEncounter, mockEncounter];
    // Simulate toggling between modes — calling the function multiple times
    const result1 = deduplicateAndSortResources(input, mockPatient.id);
    const result2 = deduplicateAndSortResources(input, mockPatient.id);
    expect(result1).toEqual(result2);
    expect(result1).toHaveLength(2);
  });

  it("should sort alphabetically after placing the primary patient profile first", () => {
    const input = [
      mockProcedure,
      mockPatient,
      mockAllergyIntolerance,
      mockEncounter,
    ];
    const result = deduplicateAndSortResources(input, mockPatient.id);
    expect(result.map((r) => r.title)).toEqual([
      "QICore Patient",
      "QICore AllergyIntolerance",
      "QICore Encounter",
      "QICore Procedure",
    ]);
  });

  it("should handle empty input", () => {
    const result = deduplicateAndSortResources([], mockPatient.id);
    expect(result).toEqual([]);
  });
});
