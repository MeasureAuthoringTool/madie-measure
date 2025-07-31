import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UrlComponent from "./UrlComponent";

describe("Url Component", () => {
  test("Should render Url component", () => {
    const handleChange = jest.fn();
    render(
      <UrlComponent
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="URL"
        structureDefinition={null}
      />
    );

    const urlField = screen.getByTestId("url-field-URL");
    expect(urlField).toBeInTheDocument();
    const urlFieldInput = screen.getByTestId("url-input-field-URL");
    expect(urlFieldInput).toBeInTheDocument();
    expect(urlFieldInput.value).toBe(
      "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement"
    );
  });

  test("Test change of value", () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <UrlComponent
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="URL"
        structureDefinition={null}
      />
    );

    const urlField = screen.getByTestId("url-field-URL");
    expect(urlField).toBeInTheDocument();
    const urlFieldInput = screen.getByTestId("url-input-field-URL");
    expect(urlFieldInput).toBeInTheDocument();
    expect(urlFieldInput.value).toBe(
      "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement"
    );
    fireEvent.change(urlFieldInput, {
      target: {
        value:
          "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-updatedrequirements",
      },
    });
    rerender(
      <UrlComponent
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-updatedrequirements`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        addTitle={"URL"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add URL")).toBeInTheDocument();
    expect(urlFieldInput.value).toBe(
      "http://hl7.org/fhir/us/core/StructureDefinition/uscdi-updatedrequirements"
    );
  });
});
