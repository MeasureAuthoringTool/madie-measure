import * as React from "react";
import { render, screen } from "@testing-library/react";
import ReferenceComponent, {
  getReferenceComponentLabel,
  getHighestPriorityResourceList,
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

  it("shows 'ID Not Present' when no matching profile entries exist", async () => {
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
    ).toBe(qiCoreProfiles[0]);
    expect(
      getHighestPriorityResourceList([], usCoreProfiles, baseFhirProfiles)
    ).toBe(usCoreProfiles[0]);
    expect(getHighestPriorityResourceList([], [], baseFhirProfiles)).toBe(
      baseFhirProfiles[0]
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
  });
});
