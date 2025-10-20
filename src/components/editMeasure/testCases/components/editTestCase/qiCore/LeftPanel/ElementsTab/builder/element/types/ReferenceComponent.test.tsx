import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import ReferenceComponent from "./ReferenceComponent";
import ResourceContext from "../../ResourceContext";
import { useQiCoreResource } from "../../../../../../../../util/QiCorePatientProvider";
import userEvent from "@testing-library/user-event";
import { FormikProvider, FormikContextType } from "formik";
import { getNestedProperty } from "../../../../../../../../api/fhirDefinitionServiceUtilities";

// Mock the custom hook
jest.mock("../../../../../../../../util/QiCorePatientProvider", () => ({
  useQiCoreResource: jest.fn(),
}));
jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

const mockFormikObj = {
  touched: {},
  errors: {},
  values: {},
  isSubmitting: false,
  setFieldValue: jest.fn(),
  setFieldTouched: jest.fn(),
  handleChange: jest.fn(),
};

const mockSetFieldValue = jest.fn();

const adverseEventValues = {
  AdverseEvent: {
    id: "7887d9e0-b2b6-455c-bd12-1b139390c824",
    resourceType: "AdverseEvent",
    meta: {
      profile: [
        "http://hl7.org/fhir/us/qicore/StructureDefinition/qicore-adverseevent",
      ],
    },
    actuality: "",
    event: "",
    subject: "",
    recorder: {
      reference: "PractitionerRole/edf97cbf-803b-4035-8770-157bcc0cdf74",
    },
  },
};
//@ts-ignore
const mockFormik: FormikContextType<any> = {
  values: {
    adverseEventValues,
  },
  touched: {},
  getFieldProps: (label) => {
    const name = getNestedProperty(adverseEventValues, label);
    return {
      value: name,
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
  },
  handleChange: () => {},
  setFieldValue: mockSetFieldValue,
  setFieldTouched: jest.fn(),
};

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
    mockFormikObj.touched = {};
    mockFormikObj.errors = {};
    mockFormikObj.values = {};
    mockFormikObj.isSubmitting = false;
    mockFormikObj.setFieldValue = jest.fn();
    mockFormikObj.setFieldValue = jest.fn();

    const mockUuid = require("uuid") as { v4: jest.Mock<string, []> };
    mockUuid.v4.mockImplementationOnce(() => "uuid-1");
    (useQiCoreResource as jest.Mock).mockReturnValue({
      state: { bundle: mockBundle },
    });
  });

  it("renders reference type dropdown with correct options", () => {
    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={mockStructureDefinition}
            canEdit={true}
            required={false}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );

    const referenceTypeSelect = screen.getByLabelText("Reference Type");
    expect(referenceTypeSelect).toBeInTheDocument();

    fireEvent.mouseDown(referenceTypeSelect);
    expect(screen.getByTestId("Patient-option")).toBeInTheDocument();
    expect(screen.getByTestId("Practitioner-option")).toBeInTheDocument();
  });

  it("shows second dropdown when reference type is selected when useFormikContext is defined", async () => {
    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={mockStructureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
          />
        </FormikProvider>
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
    const referenceOptionsList = await screen.findAllByTestId(/-option/i);
    userEvent.click(referenceOptionsList[0]);
    // expect the option to be selected.
    await waitFor(() => {
      expect(mockFormik.setFieldValue).toHaveBeenCalled();
    });
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
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={mockStructureDefinition}
            canEdit={true}
            required={true}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
          />
        </FormikProvider>
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
    userEvent.click(referenceOptionsList[0]);
    // expect the option to be selected.
    await waitFor(() => {
      expect(mockFormik.setFieldValue).toHaveBeenCalled();
    });
  });
  it("Should render with add title button", () => {
    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={mockStructureDefinition}
            canEdit={true}
            required={false}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={true}
            addTitle="Reference"
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );
    expect(screen.getByText("Add Reference")).toBeInTheDocument();
  });

  it("Renders when structureDefinition.type is undefined", () => {
    const mockStructureDefinitionNoType = {
      type: undefined,
    };
    render(
      <ResourceContext.Provider value={mockResourceProfiles}>
        <FormikProvider value={mockFormik}>
          <ReferenceComponent
            structureDefinition={mockStructureDefinitionNoType}
            canEdit={true}
            required={false}
            helperText="Select a reference"
            error={false}
            showAddAttributeButton={false}
            addTitle=""
          />
        </FormikProvider>
      </ResourceContext.Provider>
    );
    expect(screen.getByLabelText("Reference Type")).toBeInTheDocument();
  });
});
