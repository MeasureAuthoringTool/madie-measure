import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ReferenceComponent, {
  getReferenceComponentLabel,
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

  it("renders reference type dropdown with correct options", () => {
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
            addTitle=""
            label="ClaimResponse.addItem[0].provider[0]"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );
    const referenceTypeSelect = screen.getByLabelText("Reference Type");
    expect(referenceTypeSelect).toBeInTheDocument();
    fireEvent.mouseDown(referenceTypeSelect);
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

    fireEvent.mouseDown(screen.getByLabelText("Reference Type"));
    userEvent.click(await screen.findByText("Encounter"));
    // Wait for the second dropdown to be present
    const referenceSelect = await screen.findByTestId("reference-select");
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    fireEvent.mouseDown(combo);
    userEvent.click(referenceSelect);

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

    fireEvent.mouseDown(screen.getByLabelText("Reference Type"));
    userEvent.click(screen.getByTestId("Encounter (US Core)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    fireEvent.mouseDown(combo);
    userEvent.click(await screen.findByTestId("reference-select"));

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

    fireEvent.mouseDown(screen.getByLabelText("Reference Type"));
    userEvent.click(screen.getByTestId("Encounter (QICore)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    fireEvent.mouseDown(combo);
    userEvent.click(await screen.findByTestId("reference-select"));

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

    fireEvent.mouseDown(screen.getByLabelText("Reference Type"));
    userEvent.click(screen.getByTestId("Encounter (US Core)-option"));

    // Wait for the second dropdown to be present
    const combo = screen.getByRole("combobox", { name: /specify encounter/i });
    fireEvent.mouseDown(combo);
    userEvent.click(await screen.findByTestId("reference-select"));

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
});
