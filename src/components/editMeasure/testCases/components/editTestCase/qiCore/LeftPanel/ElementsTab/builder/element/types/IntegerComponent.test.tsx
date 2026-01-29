import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormikProvider } from "formik";
import IntegerComponent from "./IntegerComponent";
import { IntegerType } from "../typesValidations/FhirNumbers";

const setFieldValue = jest.fn();
const setFieldTouched = jest.fn();
const onChange = jest.fn();

const mockFormik = {
  setFieldTouched,
  setFieldValue,
  getFieldProps: () => ({
    label: "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed",
    name: "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed",
    value: 23,
    onChange,
    onBlur: jest.fn(),
  }),
};

const renderIntegerComponent = () =>
  render(
    <FormikProvider value={mockFormik}>
      <IntegerComponent
        label="MedicationRequest.dispenseRequest.numberOfRepeatsAllowed"
        name="MedicationRequest.dispenseRequest.numberOfRepeatsAllowed"
        canEdit
        fieldRequired={false}
        integerType={IntegerType.SIGNED}
        value={23}
      />
    </FormikProvider>
  );

const getInput = () =>
  screen.getByTestId(
    "integer-field-input-MedicationRequest.dispenseRequest.numberOfRepeatsAllowed"
  ) as HTMLInputElement;

describe("IntegerComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("onChange empty string sets null", async () => {
    renderIntegerComponent();

    fireEvent.change(getInput(), { target: { value: "" } });

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenLastCalledWith(
        "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed",
        null
      );
    });
  });

  test("onChange valid number sets numeric value", async () => {
    renderIntegerComponent();

    fireEvent.change(getInput(), { target: { value: "10" } });

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenLastCalledWith(
        "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed",
        10
      );
    });
  });

  test("onChange invalid input stores raw string", async () => {
    renderIntegerComponent();

    fireEvent.change(getInput(), { target: { value: "abc" } });

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenLastCalledWith(
        "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed",
        "abc"
      );
    });
  });

  test("SIGNED integer allows '-' to be entered", async () => {
    renderIntegerComponent();

    fireEvent.change(getInput(), { target: { value: "-" } });

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenLastCalledWith(
        "MedicationRequest.dispenseRequest.numberOfRepeatsAllowed",
        "-"
      );
    });
  });

  describe("Button functionality", () => {
    test("does not render AddElementButton or delete button when canEdit is false", () => {
      render(
        <IntegerComponent
          value={42}
          label="Test.integer"
          canEdit={false}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
          showDeleteButton={true}
          handleDeleteElement={jest.fn()}
          showAddAttributeButton={true}
          addTitle="Integer"
          handleAddElement={jest.fn()}
        />
      );

      expect(screen.queryByText("Add Integer")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("delete-button-Test.integer")
      ).not.toBeInTheDocument();
    });

    test("calls handleDeleteElement when delete button is clicked", () => {
      const handleDeleteElementMock = jest.fn();

      render(
        <IntegerComponent
          value={42}
          label="Test.integer"
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
          showDeleteButton={true}
          handleDeleteElement={handleDeleteElementMock}
        />
      );

      const deleteButton = screen.getByTestId("delete-button-Test.integer");
      fireEvent.click(deleteButton);

      expect(handleDeleteElementMock).toHaveBeenCalledTimes(1);
    });

    test("calls handleAddElement when AddElementButton is clicked", () => {
      const handleAddElementMock = jest.fn();

      render(
        <IntegerComponent
          value={42}
          label="Test.integer"
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
          showAddAttributeButton={true}
          addTitle="Integer"
          handleAddElement={handleAddElementMock}
        />
      );

      const addButton = screen.getByText("Add Integer");
      fireEvent.click(addButton);

      expect(handleAddElementMock).toHaveBeenCalledTimes(1);
    });
  });
});
