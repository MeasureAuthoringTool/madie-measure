import * as React from "react";
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
    const urlFieldInput = screen.getByTestId(
      "url-input-field-URL"
    ) as HTMLInputElement;
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
    const urlFieldInput = screen.getByTestId(
      "url-input-field-URL"
    ) as HTMLInputElement;
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

  test("Should render delete button and handle delete action when showDeleteButton is true", () => {
    const handleChange = jest.fn();
    const handleDeleteElement = jest.fn();
    render(
      <UrlComponent
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="URL"
        structureDefinition={null}
        showDeleteButton={true}
        handleDeleteElement={handleDeleteElement}
      />
    );

    const deleteButton = screen.getByTestId("delete-button-URL");
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveAttribute("aria-label", "delete URL");

    fireEvent.click(deleteButton);
    expect(handleDeleteElement).toHaveBeenCalledTimes(1);
  });

  test("Should render add button and handle add action when showAddAttributeButton is true", () => {
    const handleChange = jest.fn();
    const handleAddElement = jest.fn();
    render(
      <UrlComponent
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="URL"
        structureDefinition={null}
        showAddAttributeButton={true}
        addTitle="URL"
        handleAddElement={handleAddElement}
      />
    );

    const addButton = screen.getByText("Add URL");
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);
    expect(handleAddElement).toHaveBeenCalledTimes(1);
  });

  test("Should not render delete and add buttons when canEdit is false", () => {
    const handleChange = jest.fn();
    const handleDeleteElement = jest.fn();
    const handleAddElement = jest.fn();
    render(
      <UrlComponent
        value={`http://hl7.org/fhir/us/core/StructureDefinition/uscdi-requirement`}
        canEdit={false}
        fieldRequired={false}
        onChange={handleChange}
        label="URL"
        structureDefinition={null}
        showDeleteButton={true}
        handleDeleteElement={handleDeleteElement}
        showAddAttributeButton={true}
        addTitle="URL"
        handleAddElement={handleAddElement}
      />
    );

    const deleteButton = screen.queryByTestId("delete-button-URL");
    expect(deleteButton).not.toBeInTheDocument();

    const addButton = screen.queryByText("Add URL");
    expect(addButton).not.toBeInTheDocument();
  });
});
