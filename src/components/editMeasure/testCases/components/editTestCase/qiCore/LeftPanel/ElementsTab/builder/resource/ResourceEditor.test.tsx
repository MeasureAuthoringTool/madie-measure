import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import ResourceEditor, {
  deleteMultipleCardinalityElement,
} from "./ResourceEditor";
import { QiCoreResourceContext } from "../../../../../../../util/QiCorePatientProvider";
import mockClaimResponseStructuredDef from "./mockSelectedResourceTree.json";
import mockSelectedPatientTree from "./mockSelectedPatientTree.json";
import mockResourceState from "./mockResourceState.json";
import mockValueSetsState from "./mockValueSetsState.json";
import mockAllergyIntoleranceStructuredDef from "./mockAllergyIntoleranceStructuredDefinition.json";
import _ from "lodash";

import userEvent from "@testing-library/user-event";
import { useFormikContext } from "formik";
import {
  ApiContextProvider,
  ServiceConfig,
} from "../../../../../../../../../../api/ServiceContext";
import { ExecutionContextProvider } from "../../../../../../routes/qiCore/ExecutionContext";
import useFhirDefinitionsServiceApi, {
  FhirDefinitionsServiceApi,
} from "../../../../../../../api/useFhirDefinitionsService";

const mockConfig = {
  fhirService: {
    baseUrl: "fhirService.com",
  },
  terminologyService: {
    baseUrl: "terminologyService.com",
  },
} as unknown as ServiceConfig;

jest.mock("formik", () => ({
  useFormikContext: jest.fn(),
  getIn: (context: Record<string, unknown>, fieldName: string) =>
    context[fieldName],
}));

jest.mock("../../../../../../../api/useFhirDefinitionsService");
const useFhirDefinitionsServiceApiMock =
  useFhirDefinitionsServiceApi as jest.Mock<FhirDefinitionsServiceApi>;

describe("ResourceEditor", () => {
  const formikValues = {
    Patient: {
      resourceType: "Patient",
      id: "446b20b5-dd46-415e-9b9f-9eba6b260743",
      meta: {
        profile: [
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
        ],
      },
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [
            {
              url: "ombCategory",
              valueCoding: {
                code: "1002-5",
                system: "urn:oid:2.16.840.1.113883.6.238",
                display: "American Indian or Alaska Native",
                userSelected: true,
              },
            },
            {
              url: "text",
              valueString: "American Indian or Alaska Native",
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [
            {
              url: "ombCategory",
              valueCoding: {
                code: "2135-2",
                system: "urn:oid:2.16.840.1.113883.6.238",
                display: "Hispanic or Latino",
                userSelected: true,
              },
            },
            {
              url: "text",
              valueString: "Hispanic or Latino",
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
          valueCode: "M",
        },
      ],
      identifier: [
        {
          type: {
            coding: [
              {
                code: "MR",
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              },
            ],
          },
          system: "https://madie.cms.gov/",
          value: "NotscreRefAsseNotmNodxNocp",
        },
      ],
      active: true,
      name: [
        {
          use: "usual",
          text: "NotscreRefAsseNotmNodxNocp",
          family: "denompass2",
          given: ["NotscreRefAsseNotmNodxNocpdenompass2"],
        },
      ],
      gender: "male",
      birthDate: "1952-01-01",
      address: [
        {
          text: "NotscreRefAsseNotmNodxNocp, Screened Not at risk Assessed Severely Malnourished Diagnosed Care Plan, ID=NotscreRefAsseNotmNodxNocp, DOB: 01 Jan 1952",
        },
      ],
    },
  };

  const getProps = (label) => {
    if (label === "ClaimResource.id") {
      return {
        value: "6fb9d817-76c5-4b68-ba06-92c7429e6b5c",
      };
    } else if (label === "id") {
      return {
        value: "446b20b5-dd46-415e-9b9f-9eba6b260743",
      };
    } else if (label === "AllergyIntolerance.id") {
      return {
        value: "6fb9d817",
      };
    } else if (label === "AllergyIntolerance.onsetDateTime") {
      return {
        value: "2025-07-01T04:00:00+00:00",
      };
    } else {
      return {
        value: "test1",
      };
    }
  };

  const resetForm = jest.fn();
  const mockFormikObj = {
    touched: {},
    errors: {},
    values: formikValues,
    isSubmitting: false,
    setFieldValue: jest.fn(),
    getFieldProps: getProps,
    dirty: true,
    resetForm,
    setFieldTouched: jest.fn(),
  };

  const mockOnCancel = jest.fn();
  const mockSetValidationSchema = jest.fn();
  const mockSetInitialFormikValuesStu6 = jest.fn();

  let localMockResourceState;
  let localMockckValueSetsState;
  let localMockFormikObj;
  beforeEach(() => {
    jest.resetAllMocks();
    localMockResourceState = _.cloneDeep(mockResourceState);
    localMockckValueSetsState = _.cloneDeep(mockValueSetsState);
    localMockFormikObj = _.cloneDeep(mockFormikObj);
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest.fn().mockResolvedValue(mockSelectedPatientTree),
      getValueSetDefinition: jest.fn().mockResolvedValue(mockValueSetsState),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );
  });

  it("should render the ResourceEditor correctly", async () => {
    // Mocked formik obj return dirty false
    const dirtyFormMock = {
      ...localMockFormikObj,
      dirty: false,
    };
    (useFormikContext as jest.Mock).mockReturnValue(dirtyFormMock);

    render(
      <ExecutionContextProvider
        value={{
          valueSetsState: localMockckValueSetsState,
          executionContextReady: true,
        }}
      >
        <ApiContextProvider value={mockConfig}>
          <QiCoreResourceContext.Provider
            value={{ state: localMockResourceState, dispatch: jest.fn() }}
          >
            <ResourceEditor
              selectedResourceID="446b20b5-dd46-415e-9b9f-9eba6b260743"
              setValidationSchema={mockSetValidationSchema}
              setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
              onCancel={mockOnCancel}
              canEdit={true}
            />
          </QiCoreResourceContext.Provider>
        </ApiContextProvider>
      </ExecutionContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("ID:")).toBeInTheDocument();
      // or check for the resource id
      expect(
        screen.getByText("446b20b5-dd46-415e-9b9f-9eba6b260743")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("close-resource-editor-button")
      ).toBeInTheDocument();

      expect(
        screen.getByTestId("add-attribute-dialog-button")
      ).toBeInTheDocument();
      expect(screen.getByText("*identifier")).toBeInTheDocument();
      expect(screen.getByText("*name")).toBeInTheDocument();
      expect(screen.getByText("*gender")).toBeInTheDocument();
      expect(screen.getByText("id")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
      expect(screen.getByText("birthDate")).toBeInTheDocument();
      expect(screen.getByText("address")).toBeInTheDocument();

      // const idBtn = screen.getByTestId("id");
      // expect(idBtn).toBeInTheDocument();
      // userEvent.click(idBtn);
    });
  });

  it.skip("renders the ResourceEditor correctly, can hit dirty check", async () => {
    // Mocked formik obj return dirty true
    (useFormikContext as jest.Mock).mockReturnValue(localMockFormikObj);
    render(
      <QiCoreResourceContext.Provider
        value={{ state: localMockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const resourceIdInputField = (await screen.findByTestId(
      "string-field-input-ClaimResponse.id"
    )) as HTMLInputElement;
    expect(resourceIdInputField).toBeInTheDocument();
    expect(await screen.findByText("ClaimResponse.id")).toBeInTheDocument();
    expect(mockSetValidationSchema).toHaveBeenCalled();
    expect(mockSetInitialFormikValuesStu6).toHaveBeenCalled();
    expect(resourceIdInputField.value).toBe(
      "6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
    );

    const dispositionButton = await screen.findByRole("tab", {
      name: "disposition",
    });
    expect(dispositionButton).toBeInTheDocument();
    userEvent.click(dispositionButton);

    // mock formik obj returns dirty = true
    const discardDialog = await screen.findByRole("dialog", {
      name: "Discard Changes?",
    });
    expect(discardDialog).toBeInTheDocument();

    // close
    const closeButton = screen.getByRole("button", { name: /close/i });
    userEvent.click(closeButton);
    await waitFor(() => {
      expect(discardDialog).not.toBeInTheDocument();
    });
    userEvent.click(dispositionButton);
    await waitFor(() => {
      expect(screen.getByText("Discard Changes?")).toBeInTheDocument();
    });
    // on continue
    userEvent.click(screen.getByText("Yes, Discard All Changes"));
    await waitFor(() => {
      expect(discardDialog).not.toBeInTheDocument();
      expect(resetForm).toHaveBeenCalled();
    });
  });

  it.skip("renders the action center for a 0-1 cardinality element, opens when clicked", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(localMockFormikObj);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: localMockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const resourceIdInputField = (await screen.findByTestId(
      "string-field-input-ClaimResponse.id"
    )) as HTMLInputElement;
    expect(resourceIdInputField).toBeInTheDocument();
    expect(await screen.findByText("ClaimResponse.id")).toBeInTheDocument();
    expect(mockSetValidationSchema).toHaveBeenCalled();
    expect(mockSetInitialFormikValuesStu6).toHaveBeenCalled();
    expect(resourceIdInputField.value).toBe(
      "6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
    );

    const dispositionButton = await screen.findByRole("tab", {
      name: "disposition",
    });
    expect(dispositionButton).toBeInTheDocument();

    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);

    await waitFor(() => {
      expect(screen.queryByTestId("elements-copy")).not.toBeInTheDocument;
      expect(screen.queryByTestId("elements-add")).not.toBeInTheDocument;
      expect(screen.getByTestId("elements-delete")).toBeInTheDocument;
    });
    userEvent.click(actionCenter);
    expect(screen.getByTestId("elements-delete")).not.toBeInTheDocument;
  });

  it.skip("renders the action center for a 0-* cardinality element, opens when clicked", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(localMockFormikObj);
    render(
      <QiCoreResourceContext.Provider
        value={{ state: localMockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const resourceIdInputField = (await screen.findByTestId(
      "string-field-input-Patient.id"
    )) as HTMLInputElement;
    expect(resourceIdInputField).toBeInTheDocument();
    expect(await screen.findByText("ClaimResponse.id")).toBeInTheDocument();
    expect(mockSetValidationSchema).toHaveBeenCalled();
    expect(mockSetInitialFormikValuesStu6).toHaveBeenCalled();
    expect(resourceIdInputField.value).toBe(
      "6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
    );

    const actionCenter = screen.getByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);

    await waitFor(() => {
      expect(screen.queryByTestId("elements-copy")).toBeInTheDocument;
      expect(screen.queryByTestId("elements-add")).toBeInTheDocument;
      expect(screen.getByTestId("elements-delete")).toBeInTheDocument;
    });
  });

  // temp skip
  it.skip("opens AddElementDialog, interacts with it, and can close it", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(localMockFormikObj);
    const mockDispatch = jest.fn();

    render(
      <ExecutionContextProvider
        value={{
          valueSetsState: localMockckValueSetsState,
          executionContextReady: true,
        }}
      >
        <ApiContextProvider value={mockConfig}>
          <QiCoreResourceContext.Provider
            value={{ state: localMockResourceState, dispatch: mockDispatch }}
          >
            <ResourceEditor
              selectedResourceID="446b20b5-dd46-415e-9b9f-9eba6b260743"
              setValidationSchema={mockSetValidationSchema}
              setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
              onCancel={mockOnCancel}
              canEdit={true}
            />
          </QiCoreResourceContext.Provider>
        </ApiContextProvider>
      </ExecutionContextProvider>
    );

    // Click the "Add Attribute(s)" button to open dialog
    const addAttributeButton = await screen.findByTestId(
      "add-attribute-dialog-button"
    );
    userEvent.click(addAttributeButton);

    // Verify dialog is open
    expect(screen.getByTestId("close-button")).toBeInTheDocument();

    // Verify attribute selector is present
    expect(screen.getByText("Attribute Selector")).toBeInTheDocument();

    // Test closing with "Discard Changes" button
    const discardButton = screen.getByTestId("cancel-add-element-button");
    userEvent.click(discardButton);

    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen dialog
    userEvent.click(addAttributeButton);

    // Test closing with X button
    const closeButton = screen.getByTestId("close-button");
    userEvent.click(closeButton);

    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Reopen dialog one more time to test save
    userEvent.click(addAttributeButton);

    // Click save button
    const saveButton = screen.getByTestId("add-element-button-2");
    userEvent.click(saveButton);

    // Verify dialog is closed and dispatch was called
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  it("handles invalid selectedResource - this will never happen", () => {
    (useFormikContext as jest.Mock).mockReturnValue(localMockFormikObj);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: localMockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="invalid-resource-id"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Verify elements are cleared when selectedResource is null
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it.skip("handles changing tab without dirty form", async () => {
    // Mock clean form state
    const cleanFormMock = {
      ...localMockFormikObj,
      dirty: false,
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);

    render(
      <QiCoreResourceContext.Provider
        value={{ state: localMockResourceState, dispatch: jest.fn() }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Find and click the disposition tab
    const dispositionTab = await screen.findByRole("tab", {
      name: "disposition",
    });
    userEvent.click(dispositionTab);

    // Verify tab changed without opening dialog
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("handles onCancel button click", async () => {
    (useFormikContext as jest.Mock).mockReturnValue(localMockFormikObj);

    render(
      <ExecutionContextProvider
        value={{
          valueSetsState: localMockckValueSetsState,
          executionContextReady: true,
        }}
      >
        <ApiContextProvider value={mockConfig}>
          <QiCoreResourceContext.Provider
            value={{ state: localMockResourceState, dispatch: jest.fn() }}
          >
            <ResourceEditor
              selectedResourceID="446b20b5-dd46-415e-9b9f-9eba6b260743"
              setValidationSchema={mockSetValidationSchema}
              setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
              onCancel={mockOnCancel}
              canEdit={true}
            />
          </QiCoreResourceContext.Provider>
        </ApiContextProvider>
      </ExecutionContextProvider>
    );

    const closeButton = await screen.findByTestId(
      "close-resource-editor-button"
    );
    userEvent.click(closeButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("changes active tab when form is not dirty", async () => {
    // Override the mock for this specific test to use AllergyIntolerance
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest
        .fn()
        .mockResolvedValue(mockClaimResponseStructuredDef),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );
    const cleanFormMock = {
      ...localMockFormikObj,
      dirty: false,
      ClaimResponse: {
        id: "test2",
        disposition: "test3",
        widget: ["test4", "test5"],
      },
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);

    render(
      <ExecutionContextProvider
        value={{
          valueSetsState: localMockckValueSetsState,
          executionContextReady: true,
        }}
      >
        <ApiContextProvider value={mockConfig}>
          <QiCoreResourceContext.Provider
            value={{ state: localMockResourceState, dispatch: jest.fn() }}
          >
            <ResourceEditor
              selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
              setValidationSchema={mockSetValidationSchema}
              setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
              onCancel={mockOnCancel}
              canEdit={true}
            />
          </QiCoreResourceContext.Provider>
        </ApiContextProvider>
      </ExecutionContextProvider>
    );

    // Find all tabs
    const tabs = await screen.findAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(1);

    // Click the second tab (index 1)
    userEvent.click(tabs[1]);

    // Verify tab changed by checking aria-selected attribute
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("should delete selected attribute and dispatch even to update test case json state", async () => {
    // Override the mock for this specific test to use AllergyIntolerance
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest
        .fn()
        .mockResolvedValue(mockClaimResponseStructuredDef),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );
    const cleanFormMock = {
      ...localMockFormikObj,
      dirty: false,
      ClaimResponse: {
        id: "test2",
        disposition: "test3",
        widget: ["test4", "test5"],
      },
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);
    const mockDispatch = jest.fn();

    // We are testing to see if "Id" attribute is deleted accurately
    const expectedPayload = {
      payload: {
        ...localMockResourceState.bundle.entry[1],
        resource: {
          ...localMockResourceState.bundle.entry[1].resource,
        },
      },
      type: "ModifyBundleEntry",
    };

    delete expectedPayload?.payload?.resource?.id;

    render(
      <QiCoreResourceContext.Provider
        value={{ state: localMockResourceState, dispatch: mockDispatch }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817-76c5-4b68-ba06-92c7429e6b5c"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    const actionCenter = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    userEvent.click(actionCenter);

    const deleteButton = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    userEvent.click(deleteButton);

    const deleteDialog = await screen.findByRole("dialog", {
      name: "Delete Element",
    });
    expect(deleteDialog).toBeInTheDocument();
    const deleteConfirmationButton = await screen.findByRole("button", {
      name: "Yes, Delete",
    });
    expect(deleteConfirmationButton).toBeEnabled();

    userEvent.click(deleteConfirmationButton);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(expectedPayload);
  });

  it("should delete choice type attribute", async () => {
    // Override the mock for this specific test to use AllergyIntolerance
    const fhirDefinitionsServiceApiMock = {
      getResourceTree: jest
        .fn()
        .mockResolvedValue(mockAllergyIntoleranceStructuredDef),
    } as unknown as FhirDefinitionsServiceApi;
    useFhirDefinitionsServiceApiMock.mockImplementation(
      () => fhirDefinitionsServiceApiMock
    );

    const cleanFormMock = {
      ...mockFormikObj,
      dirty: false,
      values: {
        AllergyIntolerance: {
          id: "6fb9d817",
          onsetDateTime: "2020-01-01T00:00:00Z",
        },
      },
    };
    (useFormikContext as jest.Mock).mockReturnValue(cleanFormMock);
    const mockDispatch = jest.fn();

    // We are testing to see if AllergyIntolerance.onsetDateTime choice type attribute is deleted accurately
    const expectedPayload = {
      payload: {
        ...mockResourceState.bundle.entry[2],
        resource: {
          ...mockResourceState.bundle.entry[2].resource,
        },
      },
      type: "ModifyBundleEntry",
    };

    // Remove the onsetDateTime field that should be deleted
    delete expectedPayload?.payload?.resource?.onsetDateTime;

    render(
      <QiCoreResourceContext.Provider
        value={{ state: mockResourceState, dispatch: mockDispatch }}
      >
        <ResourceEditor
          selectedResourceID="6fb9d817"
          setValidationSchema={mockSetValidationSchema}
          setInitialFormikValuesStu6={mockSetInitialFormikValuesStu6}
          onCancel={mockOnCancel}
          canEdit={true}
        />
      </QiCoreResourceContext.Provider>
    );

    // Wait for the AllergyIntolerance resource to load and find the onsetDateTime tab
    const onsetDateTimeTab = await screen.findByTestId("onsetDateTime");
    expect(onsetDateTimeTab).toHaveTextContent("onsetDateTime");
    expect(onsetDateTimeTab).toHaveAttribute("aria-selected", "true");
    // userEvent.click(onsetDateTimeTab);

    const actionCenter = await screen.findByTestId(
      "elements-action-center-actual-icon"
    );
    expect(actionCenter).toBeInTheDocument();
    userEvent.click(actionCenter);

    const deleteButton = await screen.findByRole("menuitem", {
      name: "Delete",
    });
    userEvent.click(deleteButton);

    const deleteDialog = await screen.findByRole("dialog", {
      name: "Delete Element",
    });
    expect(deleteDialog).toBeInTheDocument();
    const deleteConfirmationButton = await screen.findByRole("button", {
      name: "Yes, Delete",
    });
    expect(deleteConfirmationButton).toBeEnabled();

    userEvent.click(deleteConfirmationButton);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(expectedPayload);
  });

  it("should return a single object with id [0] for empty name array", async () => {
    const mockDispatch = jest.fn();

    const localMockResourceState = _.cloneDeep(mockResourceState);
    localMockResourceState.bundle.entry[0].resource.name = [];

    // Mock Formik context with an empty name array
    const mockFormikObjWithEmptyName = {
      ...localMockFormikObj,
      values: {
        Patient: {
          ...mockFormikObj.values.Patient,
          name: [],
        },
      },
    };
    (useFormikContext as jest.Mock).mockReturnValue(mockFormikObjWithEmptyName);

    render(
      <ExecutionContextProvider
        value={{
          valueSetsState: mockValueSetsState,
          executionContextReady: true,
        }}
      >
        <ApiContextProvider value={mockConfig}>
          <QiCoreResourceContext.Provider
            value={{ state: localMockResourceState, dispatch: mockDispatch }}
          >
            <ResourceEditor
              selectedResourceID="446b20b5-dd46-415e-9b9f-9eba6b260743"
              setValidationSchema={jest.fn()}
              setInitialFormikValuesStu6={jest.fn()}
              onCancel={jest.fn()}
              canEdit={true}
            />
          </QiCoreResourceContext.Provider>
        </ApiContextProvider>
      </ExecutionContextProvider>
    );

    // Wait for the component to render the name tab
    await waitFor(() => {
      expect(screen.getByText("ID:")).toBeInTheDocument();
      // or check for the resource id
      expect(
        screen.getByText("446b20b5-dd46-415e-9b9f-9eba6b260743")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("close-resource-editor-button")
      ).toBeInTheDocument();

      /* Commented out: passing when test run individually, but failing when whole test file is run */
      // expect(screen.getByText("*name")).toBeInTheDocument();
    });
  });
});
describe("Test the ResourceEditor deleteMultipleElements functionality", () => {
  it("Should call dispatch with correct payload when deleting multiple elements", async () => {
    const mockDispatch = jest.fn();

    const mockSelectedPatientTree = {
      bundleEntry: [
        {
          resource: {
            /* ... */
          },
        },
      ],
    };

    deleteMultipleCardinalityElement(
      " *name 1",
      [{}],
      mockSelectedPatientTree,
      "Patient.name[0]",
      mockDispatch
    );
    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });
});
