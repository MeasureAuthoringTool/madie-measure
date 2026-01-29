import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReferenceComponent, {
  getReferenceComponentLabel,
  getHighestPriorityResourceList,
  getProfileMatchTypes,
} from "./ReferenceComponent";
import ResourceContext from "../../ResourceContext";
import { useQiCoreResource } from "../../../../../../../../util/QiCorePatientProvider";
import userEvent from "@testing-library/user-event";
import { FormikProvider, FormikContextType } from "formik";

jest.mock("../../../../../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn(),
}));

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
    expect(options.length).toBe(2);
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
    expect(options.length).toBe(1);
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
      expect(screen.queryByText("Chooe Profile")).not.toBeInTheDocument();
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
    await waitFor(() => {
      expect(
        screen.getByTestId("add-new-profile-ref-save-button")
      ).toBeEnabled();
    });
    // save it
    userEvent.click(screen.getByTestId("add-new-profile-ref-save-button"));
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
    const baseFhirProfiles = [
      {
        id: "encounter-base",
        profile: "http://hl7.org/fhir/StructureDefinition/Encounter",
      },
    ];
    expect(
      getHighestPriorityResourceList(
        qiCoreProfiles,
        usCoreProfiles,
        baseFhirProfiles
      )
    ).toBe(qiCoreProfiles);
    expect(
      getHighestPriorityResourceList([], usCoreProfiles, baseFhirProfiles)
    ).toBe(usCoreProfiles);
    expect(getHighestPriorityResourceList([], [], baseFhirProfiles)).toBe(
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
});
