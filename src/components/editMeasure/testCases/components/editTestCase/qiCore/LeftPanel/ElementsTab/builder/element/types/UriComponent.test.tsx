import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UriComponent from "./UriComponent";
import { FormikProvider, FormikContextType } from "formik";

const getNestedProperty = (obj, path) => {
  return path.split(".").reduce((current, key) => current && current[key], obj);
};

const patientResponse = {
  Patient: {
    id: "test",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
            },
          ],
        },
        system: "urn:oid:1.2.36.146.595.217.0.1",
        value: "12345",
        period: {
          start: "2001-05-06",
        },
        assigner: {
          display: "Acme Healthcare",
        },
      },
    ],
    name: [
      {
        use: "official",
        family: "Chalmers",
        given: ["Peter", "James"],
      },
    ],
    gender: "female",
  },
};

//@ts-ignore
const mockFormik: FormikContextType<any> = {
  values: {
    patientResponse,
  },
  touched: {},
  getFieldProps: (label) => {
    const name = getNestedProperty(patientResponse, label);
    return {
      value: name,
      name,
      onChange: jest.fn(),
      onBlur: jest.fn(),
    };
  },
  handleChange: () => {},
  setFieldValue: jest.fn(),
  setFieldTouched: jest.fn(),
};

describe("UriComponent Component", () => {
  test("Should render UriComponent component", () => {
    const handleChange = jest.fn();
    render(
      <FormikProvider value={mockFormik}>
        <UriComponent
          value={`urn:oid:2.16.840.1.113883.6.238`}
          canEdit={true}
          fieldRequired={false}
          onChange={handleChange}
          label="URI"
          structureDefinition={null}
        />
        \
      </FormikProvider>
    );

    const uriField = screen.getByTestId("uri-field-URI");
    expect(uriField).toBeInTheDocument();
    const uriFieldInput = screen.getByTestId(
      "uri-input-field-URI"
    ) as HTMLInputElement;
    expect(uriFieldInput).toBeInTheDocument();
    expect(uriFieldInput.value).toBe("urn:oid:2.16.840.1.113883.6.238");
  });

  test("Test change of value", () => {
    const handleChange = jest.fn();
    const { rerender } = render(
      <UriComponent
        value={`urn:oid:2.16.840.1.113883.6.238`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        label="URI"
        structureDefinition={null}
      />
    );

    const uriField = screen.getByTestId("uri-field-URI");
    expect(uriField).toBeInTheDocument();
    const uriFieldInput = screen.getByTestId(
      "uri-input-field-URI"
    ) as HTMLInputElement;
    expect(uriFieldInput).toBeInTheDocument();
    expect(uriFieldInput.value).toBe("urn:oid:2.16.840.1.113883.6.238");
    fireEvent.change(uriFieldInput, {
      target: { value: "urn:oid:2.16.840.1.113883.4.642.3.224" },
    });
    rerender(
      <UriComponent
        value={`urn:oid:2.16.840.1.113883.4.642.3.224`}
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        addTitle={"URI"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add URI")).toBeInTheDocument();
    expect(uriFieldInput.value).toBe("urn:oid:2.16.840.1.113883.4.642.3.224");
  });

  test("does not render AddElementButton or delete button when canEdit is false", () => {
    render(
      <UriComponent
        value="urn:oid:2.16.840.1.113883.6.238"
        label="Test.uri"
        canEdit={false}
        fieldRequired={false}
        structureDefinition={null}
        showDeleteButton={true}
        handleDeleteElement={jest.fn()}
        showAddAttributeButton={true}
        addTitle="URI"
        handleAddElement={jest.fn()}
      />
    );

    expect(screen.queryByText("Add URI")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("delete-button-Test.uri")
    ).not.toBeInTheDocument();
  });

  test("should display delete icon and calls handleDeleteElement when delete button is clicked", () => {
    const handleDeleteElementMock = jest.fn();

    render(
      <UriComponent
        value="urn:oid:2.16.840.1.113883.6.238"
        label="Test.uri"
        canEdit={true}
        fieldRequired={false}
        structureDefinition={null}
        showDeleteButton={true}
        handleDeleteElement={handleDeleteElementMock}
      />
    );

    const deleteButton = screen.getByTestId("delete-button-Test.uri");
    fireEvent.click(deleteButton);

    expect(handleDeleteElementMock).toHaveBeenCalledTimes(1);
  });

  test("should display add new icon and calls handleAddElement when AddElementButton is clicked", () => {
    const handleAddElementMock = jest.fn();

    render(
      <UriComponent
        value="urn:oid:2.16.840.1.113883.6.238"
        label="Test.uri"
        canEdit={true}
        fieldRequired={false}
        structureDefinition={null}
        showAddAttributeButton={true}
        addTitle="URI"
        handleAddElement={handleAddElementMock}
      />
    );

    const addButton = screen.getByText("Add URI");
    fireEvent.click(addButton);

    expect(handleAddElementMock).toHaveBeenCalledTimes(1);
  });
});
