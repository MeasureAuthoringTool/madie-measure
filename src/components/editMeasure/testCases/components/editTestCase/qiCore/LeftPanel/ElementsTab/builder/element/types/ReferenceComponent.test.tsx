import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ReferenceComponent from "./ReferenceComponent";
import ResourceContext from "../../ResourceContext";
import { useQiCoreResource } from "../../../../../../../../util/QiCorePatientProvider";
import userEvent from "@testing-library/user-event";

// Mock the custom hook
jest.mock("../../../../../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn(),
}));

const mockResourceProfiles = [
  {
    title: "Patient",
    type: "Patient",
    profile: "http://hl7.org/fhir/StructureDefinition/Patient",
  },
  {
    title: "Practitioner",
    type: "Practitioner",
    profile: "http://hl7.org/fhir/StructureDefinition/Practitioner",
  },
];

const mockStructureDefinition = {
  type: [
    {
      code: "Reference",
      targetProfile: [
        "http://hl7.org/fhir/StructureDefinition/Patient",
        "http://hl7.org/fhir/StructureDefinition/Practitioner",
      ],
    },
  ],
};

const mockBundle = {
  entry: [{ resource: { resourceType: "Patient", id: "patient-1" } }],
};

describe("ReferenceComponent", () => {
  beforeEach(() => {
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: mockBundle },
    });
  });

  it("renders reference type dropdown with correct options", () => {
    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <ReferenceComponent
          structureDefinition={mockStructureDefinition}
          canEdit={true}
          required={false}
          helperText="Select a reference"
          error={false}
          showAddAttributeButton={false}
          addTitle=""
        />
      </ResourceContext.Provider>
    );

    const referenceTypeSelect = screen.getByLabelText("Reference Type");
    expect(referenceTypeSelect).toBeInTheDocument();

    fireEvent.mouseDown(referenceTypeSelect);
    expect(screen.getByTestId("Patient-option")).toBeInTheDocument();
    expect(screen.getByTestId("Practitioner-option")).toBeInTheDocument();
  });

  it("shows second dropdown when reference type is selected", async () => {
    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <ReferenceComponent
          structureDefinition={mockStructureDefinition}
          canEdit={true}
          required={true}
          helperText="Select a reference"
          error={false}
          showAddAttributeButton={false}
          addTitle=""
        />
      </ResourceContext.Provider>
    );

    // change the type
    const referenceTypeSelect = screen.getByTestId("reference-type-select");
    // open the select dropdown
    userEvent.click(referenceTypeSelect);
    const referenceTypeSelectDropdown = within(referenceTypeSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceTypeSelectDropdown);
    const referenceTypeOptionsList = await screen.findAllByTestId(/-option/i);
    const optionTexts = referenceTypeOptionsList.map(
      (option) => option.textContent
    );
    expect(optionTexts).toContain("Patient", "Practitioner");
    // now click on patient option
    const patientOption = screen.getByTestId("Patient-option");
    userEvent.click(patientOption);

    // now the second dropdown should appear
    const referenceLabel = await screen.findByText("Specify Patient");
    expect(referenceLabel).toBeInTheDocument();

    const referenceSelect = screen.getByTestId("reference-select");
    expect(referenceSelect).toBeInTheDocument();
    // open the second dropdown
    userEvent.click(referenceSelect);
    const referenceSelectDropdown = within(referenceSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceSelectDropdown);
  });

  it("shows 'ID Not Present' when no matching resources exist", async () => {
    const emptyBundle = {
      entry: [],
    };

    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: emptyBundle },
    });

    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <ReferenceComponent
          structureDefinition={mockStructureDefinition}
          canEdit={true}
          required={true}
          helperText="Select a reference"
          error={false}
          showAddAttributeButton={false}
          addTitle=""
        />
      </ResourceContext.Provider>
    );

    // change the type
    const referenceTypeSelect = screen.getByTestId("reference-type-select");
    // open the select dropdown
    userEvent.click(referenceTypeSelect);
    const referenceTypeSelectDropdown = within(referenceTypeSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceTypeSelectDropdown);
    const referenceTypeOptionsList = await screen.findAllByTestId(/-option/i);
    const optionTexts = referenceTypeOptionsList.map(
      (option) => option.textContent
    );
    expect(optionTexts).toContain("Patient", "Practitioner");
    // now click on practitioner option
    const practitionerOption = screen.getByTestId("Practitioner-option");
    userEvent.click(practitionerOption);
    // Now no option for practitioner exists in the bundle, so we should see the ID Not Present option
    const referenceLabel = await screen.findByText("Specify Practitioner");
    expect(referenceLabel).toBeInTheDocument();

    // open the second dropdown and confirm the options
    const referenceSelect = screen.getByTestId("reference-select");
    expect(referenceSelect).toBeInTheDocument();
    userEvent.click(referenceSelect);
    const referenceSelectDropdown = within(referenceSelect).getByRole(
      "combobox"
    ) as HTMLInputElement;
    userEvent.click(referenceSelectDropdown);
    const referenceOptionsList = await screen.findAllByTestId(/-option/i);
    const referenceOptionTexts = referenceOptionsList.map(
      (option) => option.textContent
    );
    expect(referenceOptionTexts).toContain("ID Not Present (Add New)");
  });
});
