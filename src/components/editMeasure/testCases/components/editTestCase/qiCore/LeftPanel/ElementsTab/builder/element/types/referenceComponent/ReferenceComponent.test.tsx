import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ReferenceComponent, {
  getReferenceComponentLabel,
  getHighestPriorityResourceList,
  getProfileMatchTypes,
  getSpecificResourceOptions,
} from "./ReferenceComponent";
import ResourceContext from "../../../ResourceContext";
import { useQiCoreResource } from "../../../../../../../../../util/QiCorePatientProvider";
import userEvent from "@testing-library/user-event";
import { FormikProvider, FormikContextType } from "formik";
import {
  GENERIC_RESOURCE_PROFILE_URL,
  isGenericResourceReference,
  mapProfilesToReferenceTypeOptions,
  getReferenceTypeOptions,
} from "./referenceUtils";

jest.mock("../../../../../../../../../util/QiCorePatientProvider", () => {
  const actual = jest.requireActual(
    "../../../../../../../../../util/QiCorePatientProvider"
  );
  return {
    ...actual,
    useQiCoreResource: jest.fn(),
  };
});

const mockSetFieldValue = jest.fn();
const mockFormik: FormikContextType<any> = {
  values: {},
  touched: {},
  getFieldProps: jest.fn(),
  handleChange: jest.fn(),
  setFieldValue: mockSetFieldValue,
  setFieldTouched: jest.fn(),
} as unknown as FormikContextType<any>;

describe("ReferenceComponent", () => {
  const QICORE_OBS = {
    title: "QICore Observation",
    type: "Observation",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-observation",
  };

  const QICORE_1 = {
    id: "encounter-qicore-1",
    title: "Encounter (QICore)",
    type: "Encounter",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
    category: "TestCategory",
  };
  const QICORE_2 = {
    id: "encounter-qicore-2",
    title: "Encounter (QICore v2)",
    type: "Encounter",
    profile:
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter-alt",
    category: "TestCategory",
  };

  const baseProfiles = [
    {
      id: "encounter-base",
      title: "Encounter",
      type: "Encounter",
      profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
      category: "TestCategory",
    },
    {
      id: "encounter-uscore",
      title: "Encounter (US Core)",
      type: "Encounter",
      profile:
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
      category: "TestCategory",
    },
    {
      id: "encounter-qicore",
      title: "Encounter (QICore)",
      type: "Encounter",
      profile:
        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
      category: "TestCategory",
    },
  ];

  const structureDefinition = {
    type: [
      {
        code: "Reference",
        targetProfile: [
          "http://hl7.org/fhir/StructureDefinition/Encounter",
          "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
        ],
      },
    ],
  };

  it("returns []", () => {
    expect(getProfileMatchTypes("none")).toEqual([]);
  });

  it("returns ONC US Quality Core match type when profile URL contains onc/us-quality-core", () => {
    expect(
      getProfileMatchTypes(
        "http://hl7.org/fhir/onc/us-quality-core/StructureDefinition/us-quality-core-encounter"
      )
    ).toEqual(["/onc/us-quality-core"]);
  });

  it("returns only QICore for a QICore profile URL", () => {
    expect(
      getProfileMatchTypes(
        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter"
      )
    ).toEqual(["/fhir/us/qicore"]);
  });

  it("includes US Quality Core (and QICore) in the hierarchy for a US Core profile URL", () => {
    expect(
      getProfileMatchTypes(
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter"
      )
    ).toEqual(["/fhir/us/core", "/onc/us-quality-core", "/fhir/us/qicore"]);
  });

  it("includes US Core, US Quality Core and QICore in the hierarchy for a base FHIR profile URL", () => {
    expect(
      getProfileMatchTypes(
        "http://hl7.org/fhir/StructureDefinition/ServiceRequest"
      )
    ).toEqual([
      "/fhir/StructureDefinition/",
      "/fhir/us/core",
      "/onc/us-quality-core",
      "/fhir/us/qicore",
    ]);
  });

  it("matches a US Quality Core resource when the reference target is a base FHIR profile", () => {
    // Regression guard: Encounter.basedOn targets base FHIR ServiceRequest, but
    // the resource in the bundle is profiled as US Quality Core. It must still
    // resolve so the saved reference populates the dropdown.
    const bundleEntries = [
      {
        resource: {
          resourceType: "ServiceRequest",
          id: "sr-1",
          meta: {
            profile: [
              "http://fhir.org/guides/onc/us-quality-core/StructureDefinition/us-quality-core-servicerequest",
            ],
          },
        },
      },
    ];

    const result = getSpecificResourceOptions(
      "ServiceRequest",
      "http://hl7.org/fhir/StructureDefinition/ServiceRequest",
      bundleEntries,
      undefined
    );

    expect(result).toEqual([
      { label: "ServiceRequest/sr-1", value: "ServiceRequest/sr-1" },
      { label: "ID Not Present (Add New)", value: "add_new_id" },
    ]);
  });

  it("renders reference type dropdown with correct options", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
    });
    render(
      <ResourceContext.Provider value={baseProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={false}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={true}
            addTitle=""
            label="ClaimResponse.addItem[0].provider[0]"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );
    const referenceTypeSelect = screen.getByLabelText("Reference Type");
    expect(referenceTypeSelect).toBeInTheDocument();
    await userEvent.click(referenceTypeSelect);
    expect(screen.getByTestId("Encounter-option")).toBeInTheDocument();
    expect(
      screen.getByTestId("Encounter (US Core)-option")
    ).toBeInTheDocument();
    expect(screen.getByTestId("Encounter (QICore)-option")).toBeInTheDocument();
    expect(screen.getByTestId("reference-label")).toBeInTheDocument();
    expect(screen.getByTestId("reference-label")).toHaveAttribute(
      "aria-labelledby",
      "reference-label"
    );
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Provider");
  });

  it("filters out duplicate profiles and shows only unique options", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: { entry: [] } },
    });

    // Create profiles with duplicates
    const profilesWithDuplicates = [
      {
        id: "encounter-base",
        title: "Encounter",
        type: "Encounter",
        profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
        category: "TestCategory",
      },
      {
        id: "encounter-base-duplicate",
        title: "Encounter",
        type: "Encounter",
        profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
        category: "TestCategory",
      },
      {
        id: "encounter-qicore",
        title: "Encounter (QICore)",
        type: "Encounter",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
        category: "TestCategory",
      },
      {
        id: "encounter-qicore-duplicate",
        title: "Encounter (QICore)",
        type: "Encounter",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
        category: "TestCategory",
      },
    ];

    render(
      <ResourceContext.Provider value={profilesWithDuplicates}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={false}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={true}
            addTitle=""
            label="ClaimResponse.addItem[0].provider[0]"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    const referenceTypeSelect = screen.getByLabelText("Reference Type");
    await userEvent.click(referenceTypeSelect);

    // Should only show 2 unique options, not 4
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);

    // Verify the unique options are present
    expect(screen.getByTestId("Encounter-option")).toBeInTheDocument();
    expect(screen.getByTestId("Encounter (QICore)-option")).toBeInTheDocument();

    // Verify no duplicate options exist by checking all option text content
    const optionTexts = options.map((opt) => opt.textContent);
    const uniqueOptionTexts = Array.from(new Set(optionTexts));
    expect(optionTexts.length).toBe(uniqueOptionTexts.length);
  });

  it("shows all FHIR, US Core, QICore resources for FHIR base profile", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-fhir-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/StructureDefinition/Encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-uscore-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-qicore-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
                  ],
                },
              },
            },
          ],
        },
      },
    });
    render(
      <ResourceContext.Provider value={baseProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(await screen.findByText("Encounter"));
    // Wait for the second dropdown to be present
    const referenceSelect = await screen.findByTestId("reference-select-0");
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(referenceSelect);

    const options = await screen.findAllByRole("option");
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-fhir-1"))
    ).toBe(true);

    expect(
      options.some((opt) => opt.textContent?.includes("encounter-uscore-1"))
    ).toBe(true);

    expect(
      options.some((opt) => opt.textContent?.includes("encounter-qicore-1"))
    ).toBe(true);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
  });

  it("shows only US Core and QICore resources for US Core profile", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-fhir-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/StructureDefinition/Encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-uscore-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-qicore-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
                  ],
                },
              },
            },
          ],
        },
      },
    });
    render(
      <ResourceContext.Provider value={baseProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (US Core)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(3);
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-uscore-1"))
    ).toBe(true);
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-qicore-1"))
    ).toBe(true);
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-fhir-1"))
    ).toBe(false);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
  });

  it("shows only QICore resources for QICore profile", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-fhir-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/StructureDefinition/Encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-uscore-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-qicore-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
                  ],
                },
              },
            },
          ],
        },
      },
    });
    render(
      <ResourceContext.Provider value={baseProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (QICore)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(2);
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-uscore-1"))
    ).toBe(false);
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-qicore-1"))
    ).toBe(true);
    expect(
      options.some((opt) => opt.textContent?.includes("encounter-fhir-1"))
    ).toBe(false);

    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
  });

  it("shows 'ID Not Present' when no matching profile entries exist, triggers onClick", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-other-1",
                meta: {
                  profile: ["http://hl7.org/fhir/StructureDefinition/Other"],
                },
              },
            },
          ],
        },
      },
    });
    render(
      <ResourceContext.Provider value={baseProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (US Core)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(1);
    expect(
      options.some((opt) => opt.textContent?.includes("ID Not Present"))
    ).toBe(true);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
    // click "ID not present"
    await userEvent.click(screen.getByText("ID Not Present (Add New)"));
    await waitFor(() => {
      expect(mockSetFieldValue).toHaveBeenCalled();
    });
  });

  it("Opens a dialog when there are multiple resources that have been selected through an add new workflow, cancel/close", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-other-1",
                meta: {
                  profile: ["http://hl7.org/fhir/StructureDefinition/Other"],
                },
              },
            },
          ],
        },
      },
    });
    const multiQiCoreProfiles = baseProfiles.concat(QICORE_1, QICORE_2);
    render(
      <ResourceContext.Provider value={multiQiCoreProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (US Core)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(1);
    expect(
      options.some((opt) => opt.textContent?.includes("ID Not Present"))
    ).toBe(true);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
    // click "ID not present"
    await userEvent.click(screen.getByText("ID Not Present (Add New)"));
    // ID Not Present (Add New)-option
    await waitFor(() => {
      expect(screen.getByText("Choose Profile")).toBeVisible();
    });
    // select an add option
    const combo2 = screen.getByRole("combobox", { name: /Reference/i });
    await userEvent.click(combo2);

    await waitFor(() => {
      expect(
        screen.getByTestId(
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter-alt-option"
        )
      ).toBeInTheDocument();
      userEvent.click(
        screen.getByTestId(
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter-alt-option"
        )
      );
    });
    // QICore NonPatient Observation-option
    await waitFor(() => {
      expect(
        screen.getByTestId("add-new-profile-ref-save-button")
      ).toBeEnabled();
    });
    // close it
    userEvent.click(screen.getByTestId("add-new-profile-ref-cancel-button"));
    await waitFor(() => {
      expect(screen.queryByText("Choose Profile")).not.toBeInTheDocument();
    });
  });

  //open
  it("Opens a dialog when there are multiple resources that have been selected through an add new workflow, save", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-other-1",
                meta: {
                  profile: ["http://hl7.org/fhir/StructureDefinition/Other"],
                },
              },
            },
          ],
        },
      },
      dispatch: jest.fn(),
    });
    const multiQiCoreProfiles = baseProfiles.concat(QICORE_1, QICORE_2);
    render(
      <ResourceContext.Provider value={multiQiCoreProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (US Core)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(1);
    expect(
      options.some((opt) => opt.textContent?.includes("ID Not Present"))
    ).toBe(true);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
    // click "ID not present"
    await userEvent.click(screen.getByText("ID Not Present (Add New)"));
    // ID Not Present (Add New)-option
    await waitFor(() => {
      expect(screen.getByText("Choose Profile")).toBeVisible();
    });
    // select an add option
    const combo2 = screen.getByRole("combobox", { name: /Reference/i });
    await userEvent.click(combo2);

    await waitFor(() => {
      expect(
        screen.getByTestId(
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter-alt-option"
        )
      ).toBeInTheDocument();
      userEvent.click(
        screen.getByTestId(
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter-alt-option"
        )
      );
    });
    // QICore NonPatient Observation-option
    await waitFor(() => {
      expect(
        screen.getByTestId("add-new-profile-ref-save-button")
      ).toBeEnabled();
    });
    // close it
    userEvent.click(screen.getByTestId("add-new-profile-ref-save-button"));
    await waitFor(() => {
      expect(screen.queryByText("Choose Profile")).not.toBeInTheDocument();
    });
  });

  it("Opens a dialog when there are multiple resources that have been selected through an add new workflow", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-other-1",
                meta: {
                  profile: ["http://hl7.org/fhir/StructureDefinition/Other"],
                },
              },
            },
          ],
        },
      },
      dispatch: jest.fn(),
    });
    const multiQiCoreProfiles = baseProfiles.concat(QICORE_1, QICORE_2);
    render(
      <ResourceContext.Provider value={multiQiCoreProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (QICore)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(1);
    expect(
      options.some((opt) => opt.textContent?.includes("ID Not Present"))
    ).toBe(true);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
    // click "ID not present"
    await userEvent.click(screen.getByText("ID Not Present (Add New)"));
    // ID Not Present (Add New)-option
    await waitFor(() => {
      expect(screen.queryByText("Choose Profile")).not.toBeInTheDocument();
    });
    // select an add option
  });

  it("Filters the entries when the entry id is same as resource id", async () => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-other-1",
                meta: {
                  profile: ["http://hl7.org/fhir/StructureDefinition/Other"],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-other-1",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/qicore/StructureDefinition/Other",
                  ],
                },
              },
            },
          ],
        },
      },
      dispatch: jest.fn(),
    });
    const multiQiCoreProfiles = baseProfiles.concat(QICORE_1, QICORE_2);
    const resource = {
      id: "encounter-other-1",
      name: "test",
      resourceType: "Encounter",
    };
    render(
      <ResourceContext.Provider value={multiQiCoreProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="test.label"
            resource={resource}
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    await userEvent.click(screen.getByLabelText("Reference Type"));
    await userEvent.click(screen.getByTestId("Encounter (QICore)-option"));

    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    await userEvent.click(combo);
    await userEvent.click(await screen.findByTestId("reference-select-0"));

    const options = await screen.findAllByRole("option");
    expect(options.length).toBe(1);
    expect(
      options.some((opt) => opt.textContent?.includes("ID Not Present"))
    ).toBe(true);
    expect(screen.getByTestId("reference-label")).toHaveTextContent("Label");
    await userEvent.click(screen.getByText("ID Not Present (Add New)"));
    await waitFor(() => {
      expect(screen.queryByText("Choose Profile")).not.toBeInTheDocument();
    });
  });

  describe("test getReferenceComponentLabel", () => {
    it("should return the correct label for a given reference", () => {
      const result = getReferenceComponentLabel(
        "ClaimResponse.addItem[0].provider[0]"
      );
      expect(result).toBe("Provider");
    });

    it("should handle labels without array indices", () => {
      const result = getReferenceComponentLabel("ClaimResponse.provider");
      expect(result).toBe("Provider");
    });
    it("should return an empty string for an empty label", () => {
      const result = getReferenceComponentLabel("");
      expect(result).toBe("");
    });

    it("should handle input that does not have .", () => {
      const result = getReferenceComponentLabel("provider[0]");
      expect(result).toBe("Provider");
    });
  });
  it("getHighestPriorityResourceList returns correct profile based on priority", () => {
    const qiCoreProfiles = [
      {
        id: "encounter-qicore",
        profile:
          "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
      },
    ];
    const usCoreProfiles = [
      {
        id: "encounter-uscore",
        profile:
          "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
      },
    ];
    const usQualityCoreProfiles = [
      {
        id: "encounter-usqualitycore",
        profile:
          "http://hl7.org/fhir/us/onc/us-quality-core/StructureDefinition/us-quality-core-encounter",
      },
    ];
    const baseFhirProfiles = [
      {
        id: "encounter-base",
        profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
      },
    ];
    expect(
      getHighestPriorityResourceList(
        qiCoreProfiles,
        usQualityCoreProfiles,
        usCoreProfiles,
        baseFhirProfiles
      )
    ).toBe(qiCoreProfiles);
    expect(
      getHighestPriorityResourceList(
        [],
        usQualityCoreProfiles,
        usCoreProfiles,
        baseFhirProfiles
      )
    ).toBe(usQualityCoreProfiles);
    expect(
      getHighestPriorityResourceList([], [], usCoreProfiles, baseFhirProfiles)
    ).toBe(usCoreProfiles);
    expect(getHighestPriorityResourceList([], [], [], baseFhirProfiles)).toBe(
      baseFhirProfiles
    );
  });

  describe("Multiple Cardinality Support", () => {
    it("displays add button when showAddAttributeButton is true and canEdit is true", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      const mockHandleAddElement = jest.fn();
      render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={true}
              addTitle="Provider"
              handleAddElement={mockHandleAddElement}
              label="ClaimResponse.addItem[0].provider[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      const addButtons = screen.getAllByTestId("add-element-Provider");
      expect(addButtons.length).toBeGreaterThan(0);
      // Click the button element (not the container)
      const addButton =
        addButtons.find((el) => el.tagName === "BUTTON") || addButtons[0];
      await userEvent.click(addButton);
      expect(mockHandleAddElement).toHaveBeenCalled();
    });

    it("does not display add button when showAddAttributeButton is false", () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle="Provider"
              label="ClaimResponse.addItem[0].provider[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      expect(
        screen.queryByTestId("add-element-Provider")
      ).not.toBeInTheDocument();
    });

    it("displays delete button when showDeleteButton is true and canEdit is true", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      const mockHandleDeleteElement = jest.fn();
      render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              showDeleteButton={true}
              handleDeleteElement={mockHandleDeleteElement}
              label="ClaimResponse.addItem[0].provider[1]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      const deleteButton = screen.getByTestId(
        "delete-button-ClaimResponse.addItem[0].provider[1]"
      );
      expect(deleteButton).toBeInTheDocument();
      await userEvent.click(deleteButton);
      expect(mockHandleDeleteElement).toHaveBeenCalled();
    });

    it("does not display delete button when canEdit is false", () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={false}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              showDeleteButton={true}
              handleDeleteElement={jest.fn()}
              label="ClaimResponse.addItem[0].provider[1]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      expect(
        screen.queryByTestId(
          "delete-button-ClaimResponse.addItem[0].provider[1]"
        )
      ).not.toBeInTheDocument();
    });

    it("renders multiple reference instances with unique indexes", () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      const { rerender } = render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              index={0}
              label="ClaimResponse.addItem[0].provider[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      expect(screen.getByTestId("reference-type-select-0")).toBeInTheDocument();

      rerender(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              index={1}
              label="ClaimResponse.addItem[0].provider[1]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      expect(screen.getByTestId("reference-type-select-1")).toBeInTheDocument();
    });

    it("appends to add_new_resources array when selecting 'ID Not Present (Add New)'", async () => {
      const setFieldValueMock = jest.fn();
      const formikWithAddNewResources: FormikContextType<any> = {
        values: {
          add_new_resources: [{ resource: { id: "existing-resource" } }],
        },
        touched: {},
        getFieldProps: jest.fn(),
        handleChange: jest.fn(),
        setFieldValue: setFieldValueMock,
        setFieldTouched: jest.fn(),
      } as unknown as FormikContextType<any>;

      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });

      render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={formikWithAddNewResources}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              index={0}
              label="ClaimResponse.addItem[0].provider[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      // Select a reference type first
      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Encounter (QICore)-option"));

      // Wait for the second dropdown to be present
      const combo = screen.getByRole("combobox", {
        name: /specify encounter/i,
      });
      await userEvent.click(combo);
      await userEvent.click(await screen.findByTestId("reference-select-0"));

      // Find and click the "ID Not Present (Add New)" option
      const options = await screen.findAllByRole("option");
      const addNewOption = options.find((opt) =>
        opt.textContent?.includes("ID Not Present (Add New)")
      );
      expect(addNewOption).toBeDefined();
      await userEvent.click(addNewOption!);

      // Verify setFieldValue was called with add_new_resources array containing both old and new resources
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "add_new_resources",
        expect.arrayContaining([
          expect.objectContaining({
            resource: expect.objectContaining({ id: "existing-resource" }),
          }),
          expect.objectContaining({
            resource: expect.objectContaining({ resourceType: "Encounter" }),
          }),
        ])
      );
    });

    it("clears add_new_resources when selecting an existing resource", async () => {
      const setFieldValueMock = jest.fn();
      // Simulate a scenario where user previously selected "Add New" for an Encounter
      const formikWithPreviousAddNew: FormikContextType<any> = {
        values: {
          add_new_resources: [
            {
              resource: {
                resourceType: "Encounter",
                id: "temp-encounter-123",
              },
            },
          ],
        },
        touched: {},
        getFieldProps: jest.fn(),
        handleChange: jest.fn(),
        setFieldValue: setFieldValueMock,
        setFieldTouched: jest.fn(),
      } as unknown as FormikContextType<any>;

      // Provide an existing encounter in the bundle
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: {
          bundle: {
            entry: [
              {
                resource: {
                  resourceType: "Encounter",
                  id: "existing-encounter-1",
                  meta: {
                    profile: [
                      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
                    ],
                  },
                },
              },
            ],
          },
        },
      });

      render(
        <ResourceContext.Provider value={baseProfiles}>
          <FormikProvider value={formikWithPreviousAddNew}>
            <ReferenceComponent
              structureDefinition={structureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              index={0}
              label="ClaimResponse.addItem[0].provider[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      // Select a reference type first
      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Encounter (QICore)-option"));

      // Wait for the second dropdown to be present
      const combo = screen.getByRole("combobox", {
        name: /specify encounter/i,
      });
      await userEvent.click(combo);
      await userEvent.click(await screen.findByTestId("reference-select-0"));

      // Find and click the existing encounter option
      const options = await screen.findAllByRole("option");
      const existingOption = options.find((opt) =>
        opt.textContent?.includes("existing-encounter-1")
      );
      expect(existingOption).toBeDefined();
      await userEvent.click(existingOption!);

      // Verify setFieldValue was called with the reference
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "ClaimResponse.addItem[0].provider[0]",
        { reference: "Encounter/existing-encounter-1" }
      );
    });
  });

  it("displays accurate information in both select dropdowns based on value prop", async () => {
    // Set up bundle with multiple resource types
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: {
        bundle: {
          entry: [
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-qicore-123",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-encounter",
                  ],
                },
              },
            },
            {
              resource: {
                resourceType: "Encounter",
                id: "encounter-uscore-456",
                meta: {
                  profile: [
                    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter",
                  ],
                },
              },
            },
          ],
        },
      },
    });

    // Provide a value prop with reference and profile URL
    const valueWithReference = {
      reference: "Encounter/encounter-qicore-123",
    };

    render(
      <ResourceContext.Provider value={baseProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={structureDefinition}
            canEdit={true}
            required={false}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
            label="ClaimResponse.addItem[0].provider[0]"
            value={valueWithReference}
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    // Verify first dropdown (Reference Type) displays the correct value
    const referenceTypeSelect = screen.getByLabelText("Reference Type");
    expect(referenceTypeSelect).toBeInTheDocument();

    // The first dropdown should display "Encounter (QICore)" based on the reference type
    await waitFor(() => {
      expect(referenceTypeSelect).toHaveTextContent(/Encounter/);
    });

    // Verify second dropdown (Specify Encounter) displays the correct value
    const referenceSelect = screen.getByRole("combobox", {
      name: /specify encounter/i,
    });
    expect(referenceSelect).toBeInTheDocument();

    // The second dropdown should display "Encounter/encounter-qicore-123"
    await waitFor(() => {
      expect(referenceSelect).toHaveTextContent(
        "Encounter/encounter-qicore-123"
      );
    });
  });

  it("removes the trailing empty option when (isPatient && hasPatient) is true", () => {
    const selectedReferenceType = "Patient";
    const selectedProfileUrl =
      "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient";

    const bundleEntries = [
      {
        resource: {
          resourceType: "Patient",
          id: "keep-me",
          meta: {
            profile: [
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
            ],
          },
        },
      },
      {
        resource: {
          resourceType: "Patient",
          id: "exclude-me",
          meta: {
            profile: [
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-patient",
            ],
          },
        },
      },
      {
        resource: {
          resourceType: "Observation",
          id: "obs-1",
          meta: {
            profile: [
              "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-observation",
            ],
          },
        },
      },
    ];

    const resource = { id: "exclude-me" };

    const result = getSpecificResourceOptions(
      selectedReferenceType,
      selectedProfileUrl,
      bundleEntries,
      resource
    );
    expect(result).toEqual([
      { label: "Patient/keep-me", value: "Patient/keep-me" },
    ]);

    // Extra guard: ensure no "add_new_id" present
    expect(result.some((o) => o.value === "add_new_id")).toBe(false);
  });

  describe("Reference(Resource) generic expansion", () => {
    const genericStructureDefinition = {
      type: [
        {
          code: "Reference",
          targetProfile: [GENERIC_RESOURCE_PROFILE_URL],
        },
      ],
    };

    const ORG_BASE = {
      id: "org-base",
      title: "Organization",
      type: "Organization",
      profile: "http://hl7.org/fhir/StructureDefinition/Organization",
      category: "TestCategory",
    };
    const ORG_USCORE_1 = {
      id: "org-uscore-1",
      title: "Organization (US Core)",
      type: "Organization",
      profile:
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization",
      category: "TestCategory",
    };
    const ORG_USCORE_2 = {
      id: "org-uscore-2",
      title: "Organization (US Core Alt)",
      type: "Organization",
      profile:
        "http://hl7.org/fhir/us/core/StructureDefinition/us-core-organization-alt",
      category: "TestCategory",
    };
    const LOCATION_BASE = {
      id: "location-base",
      title: "Location",
      type: "Location",
      profile: "http://hl7.org/fhir/StructureDefinition/Location",
      category: "TestCategory",
    };
    const GENERIC_RESOURCE_IDENTIFIER = {
      id: "resource-generic",
      title: "Resource",
      type: "Resource",
      profile: GENERIC_RESOURCE_PROFILE_URL,
      category: "TestCategory",
    };
    const modelProfiles = [
      ...baseProfiles, // Encounter base / us-core / qicore
      ORG_BASE,
      ORG_USCORE_1,
      ORG_USCORE_2,
      LOCATION_BASE,
      GENERIC_RESOURCE_IDENTIFIER,
    ];

    it("isGenericResourceReference detects generic and empty targetProfiles", () => {
      expect(
        isGenericResourceReference(genericStructureDefinition as any)
      ).toBe(true);
      expect(
        isGenericResourceReference({ type: [{ code: "Reference" }] } as any)
      ).toBe(true);
      expect(isGenericResourceReference(structureDefinition as any)).toBe(
        false
      );
    });

    it("mapProfilesToReferenceTypeOptions excludes the abstract Resource profiles and de-duplicates", () => {
      const options = mapProfilesToReferenceTypeOptions([
        ORG_BASE,
        ORG_BASE, // duplicate
        GENERIC_RESOURCE_IDENTIFIER, // excluded
      ]);
      expect(options).toEqual([
        {
          label: "Organization",
          value: "Organization",
          profile: ORG_BASE.profile,
        },
      ]);
    });

    it("expands the Reference Type dropdown to all model-relevant profiles", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      await userEvent.click(screen.getByLabelText("Reference Type"));
      expect(screen.getByTestId("Encounter-option")).toBeInTheDocument();
      expect(
        screen.getByTestId("Encounter (US Core)-option")
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("Encounter (QICore)-option")
      ).toBeInTheDocument();
      expect(screen.getByTestId("Organization-option")).toBeInTheDocument();
      expect(
        screen.getByTestId("Organization (US Core)-option")
      ).toBeInTheDocument();
      expect(screen.getByTestId("Location-option")).toBeInTheDocument();
      // The invalid abstract Resource option is NOT offered
      expect(screen.queryByTestId("Resource-option")).not.toBeInTheDocument();
    });

    it("shows matching bundle resource IDs plus add-new for a selected concrete profile", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: {
          bundle: {
            entry: [
              {
                resource: {
                  resourceType: "Organization",
                  id: "org-123",
                  meta: { profile: [ORG_BASE.profile] },
                },
              },
            ],
          },
        },
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Organization-option"));
      const combo = screen.getByRole("combobox", {
        name: /specify organization/i,
      });
      await userEvent.click(combo);

      const options = await screen.findAllByRole("option");
      expect(
        options.some((opt) => opt.textContent?.includes("Organization/org-123"))
      ).toBe(true);
      expect(
        options.some((opt) => opt.textContent?.includes("ID Not Present"))
      ).toBe(true);
    });

    it("shows only add-new when no bundle resources match the selected profile", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Organization-option"));
      const combo = screen.getByRole("combobox", {
        name: /specify organization/i,
      });
      await userEvent.click(combo);

      const options = await screen.findAllByRole("option");
      expect(options.length).toBe(1);
      expect(options[0].textContent).toContain("ID Not Present");
    });

    it("writes the expected reference when an existing ID is selected", async () => {
      const setFieldValueMock = jest.fn();
      const formik = {
        ...mockFormik,
        setFieldValue: setFieldValueMock,
      } as unknown as FormikContextType<any>;
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: {
          bundle: {
            entry: [
              {
                resource: {
                  resourceType: "Organization",
                  id: "org-123",
                  meta: { profile: [ORG_BASE.profile] },
                },
              },
            ],
          },
        },
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={formik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Organization-option"));
      const combo = screen.getByRole("combobox", {
        name: /specify organization/i,
      });
      await userEvent.click(combo);
      const options = await screen.findAllByRole("option");
      const existing = options.find((opt) =>
        opt.textContent?.includes("Organization/org-123")
      );
      await userEvent.click(existing!);

      expect(setFieldValueMock).toHaveBeenCalledWith("Provenance.target[0]", {
        reference: "Organization/org-123",
      });
    });

    it("opens the profile-selection modal on add-new when multiple profiles are applicable", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
        dispatch: jest.fn(),
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      // Organization has two US Core profiles -> add-new must prompt for a profile
      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Organization-option"));
      const combo = screen.getByRole("combobox", {
        name: /specify organization/i,
      });
      await userEvent.click(combo);
      await userEvent.click(screen.getByText("ID Not Present (Add New)"));

      await waitFor(() => {
        expect(screen.getByText("Choose Profile")).toBeVisible();
      });
    });

    it("creates the resource without a modal on add-new when only one profile is applicable", async () => {
      const setFieldValueMock = jest.fn();
      const formik = {
        ...mockFormik,
        values: {},
        setFieldValue: setFieldValueMock,
      } as unknown as FormikContextType<any>;
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: { bundle: { entry: [] } },
        dispatch: jest.fn(),
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={formik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      // Location has a single (base FHIR) profile -> add-new builds it directly
      await userEvent.click(screen.getByLabelText("Reference Type"));
      await userEvent.click(screen.getByTestId("Location-option"));
      const combo = screen.getByRole("combobox", {
        name: /specify location/i,
      });
      await userEvent.click(combo);
      await userEvent.click(screen.getByText("ID Not Present (Add New)"));

      expect(screen.queryByText("Choose Profile")).not.toBeInTheDocument();
      expect(setFieldValueMock).toHaveBeenCalledWith(
        "add_new_resources",
        expect.arrayContaining([
          expect.objectContaining({
            resource: expect.objectContaining({ resourceType: "Location" }),
          }),
        ])
      );
    });

    it("initializes Reference Type and Specify values when editing a saved generic reference", async () => {
      (useQiCoreResource as jest.Mock).mockReturnValue({
        state: {
          bundle: {
            entry: [
              {
                resource: {
                  resourceType: "Organization",
                  id: "org-123",
                  meta: { profile: [ORG_BASE.profile] },
                },
              },
            ],
          },
        },
      });
      render(
        <ResourceContext.Provider value={modelProfiles}>
          <FormikProvider value={mockFormik}>
            <ReferenceComponent
              structureDefinition={genericStructureDefinition}
              canEdit={true}
              required={false}
              helperText="Select a reference"
              error={false}
              showAddAttributeButton={false}
              addTitle=""
              label="Provenance.target[0]"
              value={{ reference: "Organization/org-123" }}
            />
          </FormikProvider>
        </ResourceContext.Provider>
      );

      const referenceTypeSelect = screen.getByLabelText("Reference Type");
      await waitFor(() => {
        expect(referenceTypeSelect).toHaveTextContent(/Organization/);
      });
      const specify = screen.getByRole("combobox", {
        name: /specify organization/i,
      });
      await waitFor(() => {
        expect(specify).toHaveTextContent("Organization/org-123");
      });
    });

    it("leaves explicitly typed references unchanged", () => {
      const options = getReferenceTypeOptions(
        structureDefinition as any,
        modelProfiles
      );
      expect(options.every((opt) => opt.value === "Encounter")).toBe(true);
      expect(options.some((opt) => opt.value === "Organization")).toBe(false);
    });
  });
});
