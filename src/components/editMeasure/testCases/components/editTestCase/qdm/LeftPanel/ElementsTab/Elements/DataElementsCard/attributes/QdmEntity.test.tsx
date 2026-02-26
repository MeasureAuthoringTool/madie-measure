import * as React from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import {
  PatientEntity,
  CarePartner,
  Location,
  Practitioner,
  Organization,
} from "cqm-models";
import QdmEntity from "./QdmEntity";

const valueSets = [
  {
    display_name: "Encounter Inpatient",
    version: "2023-03",
    concepts: [
      {
        code: "183452005",
        code_system_name: "SNOMEDCT",
        code_system_oid: "1.2.3",
        code_system_version: "2023-03",
        display_name: "Snomed Emergency hospital admission (procedure)",
      },
      {
        code: "305686008",
        code_system_name: "SNOMEDCT",
        code_system_oid: "1.2.3",
        code_system_version: "2023-03",
        display_name: "Seen by palliative care physician (finding)",
      },
      {
        code: "Z51.5",
        code_system_name: "ICD10CM",
        code_system_oid: "4.5.6",
        code_system_version: "2023-03",
        display_name: "Encounter for palliative care",
      },
    ],
    oid: "1.2.3.4.5",
  },
  {
    display_name: "Palliative Care Intervention",
    version: "2023-03",
    concepts: [
      {
        code: "443761007",
        code_system_name: "SNOMEDCT",
        code_system_oid: "1.2.3",
        code_system_version: "2023-03",
        display_name: "Anticipatory palliative care (regime/therapy)",
      },
    ],
    oid: "7.8.9.10",
  },
];

jest.mock("@madie/madie-util", () => ({
  routeHandlerStore: {
    subscribe: (set) => {
      set();
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: true, pendingPath: "" },
    initialState: { canTravel: true, pendingPath: "" },
  },
}));

describe("QdmEntity Component", () => {
  beforeEach(() => {});

  test("null attributeType", () => {
    const mockHandleChange = jest.fn();
    render(
      <QdmEntity
        attributeType={undefined}
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(
      screen.queryByRole("textbox", {
        name: "Value Set / Direct Reference Code",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", {
        name: "Value",
      })
    ).not.toBeInTheDocument();
    expect(mockHandleChange).not.toHaveBeenCalled();
  });

  test("PatientEntity attributeType", () => {
    const mockHandleChange = jest.fn();
    render(
      <QdmEntity
        attributeType="PatientEntity"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.calls[0][0] instanceof PatientEntity
    ).toBeTruthy();

    const namingSystemInput = screen.getByRole("textbox", {
      name: "Naming System",
    });
    userEvent.paste(namingSystemInput, "test naming system");
    const valueInput = screen.getByRole("textbox", {
      name: "Value",
    });
    userEvent.paste(valueInput, "test value");
    const idInput = screen.getByTestId("string-field-id-input");
    userEvent.paste(idInput, "test id");

    const latestCall = mockHandleChange.mock.lastCall?.[0];

    expect(latestCall instanceof PatientEntity).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");
  });

  test("Practitioner attributeType", async () => {
    const mockHandleChange = jest.fn();
    render(
      <QdmEntity
        attributeType="Practitioner"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.calls[0][0] instanceof Practitioner
    ).toBeTruthy();

    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Naming System",
      }),
      "test naming system"
    );
    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Value",
      }),
      "test value"
    );
    userEvent.paste(screen.getByTestId("string-field-id-input"), "test id");

    //Role
    const valueSetsInputs = screen.getAllByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement[];
    expect(valueSetsInputs[0].value).toBe("");
    const valueSetSelectors = screen.getAllByTestId("value-set-selector");
    const valueSetDropdown1 = within(valueSetSelectors[0]).getByRole(
      "combobox",
      { name: "Value Set / Direct Reference Code" }
    ) as HTMLInputElement;
    userEvent.click(valueSetDropdown1);

    const valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    const codeSystemSelector = screen.getByTestId("code-system-selector");
    const codeSystemDropdown = within(codeSystemSelector).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown);
    const codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    const codeSelector = screen.getByTestId("code-selector");
    const codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    const codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    //Specialty
    const valueSetDropdown2 = within(valueSetSelectors[1]).getByRole(
      "combobox",
      { name: "Value Set / Direct Reference Code" }
    ) as HTMLInputElement;
    userEvent.click(valueSetDropdown2);
    const valueSetOptions2 = await screen.findAllByRole("option");
    expect(valueSetOptions2).toHaveLength(3);
    userEvent.click(valueSetOptions2[1]);

    // select the code system
    const codeSystemSelector2 = screen.getAllByTestId("code-system-selector");
    const codeSystemDropdown2 = within(codeSystemSelector2[1]).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown2);
    const codeSystemOptions2 = await screen.findAllByRole("option");
    expect(codeSystemOptions2[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions2[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions2[0]);

    // select the code
    const codeSelector2 = screen.getAllByTestId("code-selector");
    const codeDropdown2 = within(codeSelector2[1]).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown2);
    const codeOptions2 = await screen.findAllByRole("option");
    expect(codeOptions2).toHaveLength(2);
    expect(codeOptions2[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions2[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions2[0]);

    //Qualification
    const valueSetDropdown3 = within(valueSetSelectors[2]).getByRole(
      "combobox",
      { name: "Value Set / Direct Reference Code" }
    ) as HTMLInputElement;
    userEvent.click(valueSetDropdown3);
    const valueSetOptions3 = await screen.findAllByRole("option");
    expect(valueSetOptions3).toHaveLength(3);
    userEvent.click(valueSetOptions3[1]);

    // select the code system
    const codeSystemSelector3 = screen.getAllByTestId("code-system-selector");
    const codeSystemDropdown3 = within(codeSystemSelector3[2]).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown3);
    const codeSystemOptions3 = await screen.findAllByRole("option");
    expect(codeSystemOptions3[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions3[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions3[0]);

    // select the code
    const codeSelector3 = screen.getAllByTestId("code-selector");
    const codeDropdown3 = within(codeSelector3[2]).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown3);
    const codeOptions3 = await screen.findAllByRole("option");
    expect(codeOptions3).toHaveLength(2);
    expect(codeOptions3[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions3[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions3[0]);

    const latestCall = mockHandleChange.mock.lastCall?.[0];

    expect(latestCall instanceof Practitioner).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.role?.code).toEqual("183452005");
    expect(latestCall.role?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.role?.system).toEqual("1.2.3");
    expect(latestCall.role?.version).toEqual(null);

    expect(latestCall.specialty?.code).toEqual("183452005");
    expect(latestCall.specialty?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.specialty?.system).toEqual("1.2.3");
    expect(latestCall.specialty?.version).toEqual(null);

    expect(latestCall.qualification?.code).toEqual("183452005");
    expect(latestCall.qualification?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.qualification?.system).toEqual("1.2.3");
    expect(latestCall.qualification?.version).toEqual(null);
  });

  test("Location attributeType", async () => {
    const mockHandleChange = jest.fn();
    render(
      <QdmEntity
        attributeType="Location"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.lastCall?.[0] instanceof Location
    ).toBeTruthy();

    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Naming System",
      }),
      "test naming system"
    );
    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Value",
      }),
      "test value"
    );
    userEvent.paste(screen.getByTestId("string-field-id-input"), "test id");

    const valueSetsInput = screen.getByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement;
    expect(valueSetsInput.value).toBe("");
    const valueSetSelector = screen.getByTestId("value-set-selector");
    const valueSetDropdown = within(valueSetSelector).getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    }) as HTMLInputElement;
    userEvent.click(valueSetDropdown);

    const valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    const codeSystemSelector = screen.getByTestId("code-system-selector");
    const codeSystemDropdown = within(codeSystemSelector).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown);
    const codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    const codeSelector = screen.getByTestId("code-selector");
    const codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    const codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    const latestCall = mockHandleChange.mock.lastCall?.[0];
    expect(latestCall instanceof Location).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.locationType?.code).toEqual("183452005");
    expect(latestCall.locationType?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.locationType?.system).toEqual("1.2.3");
    expect(latestCall.locationType?.version).toEqual(null);
  });

  test("CarePartner attributeType", async () => {
    const mockHandleChange = jest.fn();
    render(
      <QdmEntity
        attributeType="CarePartner"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.calls[0][0] instanceof CarePartner
    ).toBeTruthy();

    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Naming System",
      }),
      "test naming system"
    );
    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Value",
      }),
      "test value"
    );
    userEvent.paste(screen.getByTestId("string-field-id-input"), "test id");

    const valueSetsInput = screen.getByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement;
    expect(valueSetsInput.value).toBe("");
    const valueSetSelector = screen.getByTestId("value-set-selector");
    const valueSetDropdown = within(valueSetSelector).getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    }) as HTMLInputElement;
    userEvent.click(valueSetDropdown);

    const valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    const codeSystemSelector = screen.getByTestId("code-system-selector");
    const codeSystemDropdown = within(codeSystemSelector).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown);
    const codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    const codeSelector = screen.getByTestId("code-selector");
    const codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    const codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    const latestCall = mockHandleChange.mock.lastCall?.[0];
    expect(latestCall instanceof CarePartner).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.relationship?.code).toEqual("183452005");
    expect(latestCall.relationship?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.relationship?.system).toEqual("1.2.3");
    expect(latestCall.relationship?.version).toEqual(null);
  });

  test("Organization attributeType", async () => {
    const mockHandleChange = jest.fn();
    render(
      <QdmEntity
        attributeType="Organization"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.calls[0][0] instanceof Organization
    ).toBeTruthy();

    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Naming System",
      }),
      "test naming system"
    );
    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Value",
      }),
      "test value"
    );
    userEvent.paste(screen.getByTestId("string-field-id-input"), "test id");

    const valueSetsInput = screen.getByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement;
    expect(valueSetsInput.value).toBe("");
    const valueSetSelector = screen.getByTestId("value-set-selector");
    const valueSetDropdown = within(valueSetSelector).getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    }) as HTMLInputElement;
    userEvent.click(valueSetDropdown);

    const valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    const codeSystemSelector = screen.getByTestId("code-system-selector");
    const codeSystemDropdown = within(codeSystemSelector).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown);
    const codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    const codeSelector = screen.getByTestId("code-selector");
    const codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    const codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    const latestCall = mockHandleChange.mock.lastCall?.[0];

    expect(latestCall instanceof Organization).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.organizationType?.code).toEqual("183452005");
    expect(latestCall.organizationType?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.organizationType?.system).toEqual("1.2.3");
    expect(latestCall.organizationType?.version).toEqual(null);
  });

  test("change in attributeType", async () => {
    const mockHandleChange = jest.fn();
    const { rerender } = render(
      <QdmEntity
        attributeType="PatientEntity"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.calls[0][0] instanceof PatientEntity
    ).toBeTruthy();

    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Naming System",
      }),
      "test naming system"
    );
    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Value",
      }),
      "test value"
    );
    userEvent.paste(screen.getByTestId("string-field-id-input"), "test id");
    expect(
      mockHandleChange.mock.calls[0][0] instanceof PatientEntity
    ).toBeTruthy();

    rerender(
      <QdmEntity
        attributeType="CarePartner"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    const valueSetsInput = screen.getByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement;
    expect(valueSetsInput.value).toBe("");
    const valueSetSelector = screen.getByTestId("value-set-selector");
    const valueSetDropdown = within(valueSetSelector).getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    }) as HTMLInputElement;
    userEvent.click(valueSetDropdown);

    const valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    const codeSystemSelector = screen.getByTestId("code-system-selector");
    const codeSystemDropdown = within(codeSystemSelector).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown);
    const codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    const codeSelector = screen.getByTestId("code-selector");
    const codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    const codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    let latestCall = mockHandleChange.mock.lastCall?.[0];

    expect(latestCall instanceof CarePartner).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.relationship?.code).toEqual("183452005");
    expect(latestCall.relationship?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.relationship?.system).toEqual("1.2.3");
    expect(latestCall.relationship?.version).toBeNull();
  });

  test("change in attributeType between location and practitioner", async () => {
    const mockHandleChange = jest.fn();
    const { rerender } = render(
      <QdmEntity
        attributeType="Location"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(mockHandleChange.mock.calls[0][0] instanceof Location).toBeTruthy();

    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Naming System",
      }),
      "test naming system"
    );
    userEvent.paste(
      screen.getByRole("textbox", {
        name: "Value",
      }),
      "test value"
    );
    userEvent.paste(screen.getByTestId("string-field-id-input"), "test id");

    let valueSetsInput = screen.getByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement;
    expect(valueSetsInput.value).toBe("");
    let valueSetSelector = screen.getByTestId("value-set-selector");
    let valueSetDropdown = within(valueSetSelector).getByRole("combobox", {
      name: "Value Set / Direct Reference Code",
    }) as HTMLInputElement;
    userEvent.click(valueSetDropdown);

    let valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    let codeSystemSelector = screen.getByTestId("code-system-selector");
    let codeSystemDropdown = within(codeSystemSelector).getByRole("combobox", {
      name: "Code System",
    });
    userEvent.click(codeSystemDropdown);
    let codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    let codeSelector = screen.getByTestId("code-selector");
    let codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    let codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    let latestCall = mockHandleChange.mock.lastCall?.[0];
    expect(latestCall instanceof Location).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.locationType?.code).toEqual("183452005");
    expect(latestCall.locationType?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.locationType?.system).toEqual("1.2.3");
    expect(latestCall.locationType?.version).toEqual(null);

    mockHandleChange.mockClear();

    rerender(
      <QdmEntity
        attributeType="Practitioner"
        setAttributeValue={mockHandleChange}
        valueSets={valueSets}
      />
    );

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    expect(
      mockHandleChange.mock.calls[0][0] instanceof Practitioner
    ).toBeTruthy();

    //Role
    const valueSetsInputs = screen.getAllByTestId(
      "value-set-selector-input"
    ) as HTMLInputElement[];
    expect(valueSetsInputs[0].value).toBe("");
    const valueSetSelectors = screen.getAllByTestId("value-set-selector");
    const valueSetDropdown1 = within(valueSetSelectors[0]).getByRole(
      "combobox",
      { name: "Value Set / Direct Reference Code" }
    ) as HTMLInputElement;
    userEvent.click(valueSetDropdown1);

    valueSetOptions = await screen.findAllByRole("option");
    expect(valueSetOptions).toHaveLength(3);
    // by default code system and code dropdown is not displayed unless user choose value set
    expect(
      screen.queryByTestId("code-system-selector")
    ).not.toBeInTheDocument();
    userEvent.click(valueSetOptions[1]);

    // select the code system
    codeSystemSelector = screen.getByTestId("code-system-selector");
    codeSystemDropdown = within(codeSystemSelector).getByRole("combobox", {
      name: "Code System",
    });
    userEvent.click(codeSystemDropdown);
    codeSystemOptions = await screen.findAllByRole("option");
    expect(codeSystemOptions[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions[0]);

    // select the code
    codeSelector = screen.getByTestId("code-selector");
    codeDropdown = within(codeSelector).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown);
    codeOptions = await screen.findAllByRole("option");
    expect(codeOptions).toHaveLength(2);
    expect(codeOptions[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions[0]);

    //Specialty
    const valueSetDropdown2 = within(valueSetSelectors[1]).getByRole(
      "combobox",
      { name: "Value Set / Direct Reference Code" }
    ) as HTMLInputElement;
    userEvent.click(valueSetDropdown2);
    const valueSetOptions2 = await screen.findAllByRole("option");
    expect(valueSetOptions2).toHaveLength(3);
    userEvent.click(valueSetOptions2[1]);

    // select the code system
    const codeSystemSelector2 = screen.getAllByTestId("code-system-selector");
    const codeSystemDropdown2 = within(codeSystemSelector2[1]).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown2);
    const codeSystemOptions2 = await screen.findAllByRole("option");
    expect(codeSystemOptions2[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions2[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions2[0]);

    // select the code
    const codeSelector2 = screen.getAllByTestId("code-selector");
    const codeDropdown2 = within(codeSelector2[1]).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown2);
    const codeOptions2 = await screen.findAllByRole("option");
    expect(codeOptions2).toHaveLength(2);
    expect(codeOptions2[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions2[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions2[0]);

    //Qualification
    const valueSetDropdown3 = within(valueSetSelectors[2]).getByRole(
      "combobox",
      { name: "Value Set / Direct Reference Code" }
    ) as HTMLInputElement;
    userEvent.click(valueSetDropdown3);
    const valueSetOptions3 = await screen.findAllByRole("option");
    expect(valueSetOptions3).toHaveLength(3);
    userEvent.click(valueSetOptions3[1]);

    // select the code system
    const codeSystemSelector3 = screen.getAllByTestId("code-system-selector");
    const codeSystemDropdown3 = within(codeSystemSelector3[2]).getByRole(
      "combobox",
      { name: "Code System" }
    );
    userEvent.click(codeSystemDropdown3);
    const codeSystemOptions3 = await screen.findAllByRole("option");
    expect(codeSystemOptions3[0]).toHaveTextContent("SNOMEDCT");
    expect(codeSystemOptions3[1]).toHaveTextContent("ICD10CM");
    userEvent.click(codeSystemOptions3[0]);

    // select the code
    const codeSelector3 = screen.getAllByTestId("code-selector");
    const codeDropdown3 = within(codeSelector3[2]).getByRole("combobox", {
      name: "Code",
    });
    userEvent.click(codeDropdown3);
    const codeOptions3 = await screen.findAllByRole("option");
    expect(codeOptions3).toHaveLength(2);
    expect(codeOptions3[0]).toHaveTextContent(
      "183452005 - Snomed Emergency hospital admission (procedure)"
    );
    expect(codeOptions3[1]).toHaveTextContent(
      "305686008 - Seen by palliative care physician (finding)"
    );
    userEvent.click(codeOptions3[0]);

    latestCall = mockHandleChange.mock.lastCall?.[0];

    expect(latestCall instanceof Practitioner).toBeTruthy();
    expect(latestCall.identifier?.namingSystem).toEqual("test naming system");
    expect(latestCall.identifier?.value).toEqual("test value");
    expect(latestCall.id).toEqual("test id");

    expect(latestCall.role?.code).toEqual("183452005");
    expect(latestCall.role?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.role?.system).toEqual("1.2.3");
    expect(latestCall.role?.version).toEqual(null);

    expect(latestCall.specialty?.code).toEqual("183452005");
    expect(latestCall.specialty?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.specialty?.system).toEqual("1.2.3");
    expect(latestCall.specialty?.version).toEqual(null);

    expect(latestCall.qualification?.code).toEqual("183452005");
    expect(latestCall.qualification?.display).toEqual(
      "Snomed Emergency hospital admission (procedure)"
    );
    expect(latestCall.qualification?.system).toEqual("1.2.3");
    expect(latestCall.qualification?.version).toEqual(null);
  });
});
