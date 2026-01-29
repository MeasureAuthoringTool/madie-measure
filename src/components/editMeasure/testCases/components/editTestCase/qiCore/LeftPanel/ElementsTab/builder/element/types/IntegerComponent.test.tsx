import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IntegerComponent, { IntegerType } from "./IntegerComponent";
import userEvent from "@testing-library/user-event";

describe("IntegerComponent", () => {
  describe("Unsigned IntegerComponent", () => {
    test("Should render Unsigned IntegerComponent", () => {
      render(
        <IntegerComponent
          label="Coverage.class.value"
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );

      const integerField = screen.getByTestId(
        "integer-field-Coverage.class.value"
      );
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-Coverage.class.value"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      screen.debug();
    });

    test("Should validate Unsigned IntegerComponent", () => {
      render(
        <IntegerComponent
          value={1}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );

      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("1");

      fireEvent.keyPress(integerFieldInput, {
        target: { value: "2147483647" },
      });
    });

    test("should ignore . and - keys", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");
      userEvent.type(integerFieldInput, "-");
    });

    test("Test on key press of negative sign causes prevent default for Unsigned IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");
      fireEvent.keyPress(integerFieldInput, { key: "-", charCode: 173 });
      expect(integerFieldInput.value).toBe("");
    });

    test("Test on key press of valid Unsigned IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-Integer");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-Integer"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { key: "8", charCode: 56 });
      expect(
        screen.queryByText("Unsigned integer range is [0 to 2147483647]")
      ).not.toBeInTheDocument();
    });

    test("Test on key press of number reaching maximum causes prevent default for Unsigned IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label="Unsigned"
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-Unsigned");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-Unsigned"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "214748364" } });
      expect(integerFieldInput.value).toBe("214748364");

      fireEvent.keyPress(integerFieldInput, { key: "8", charCode: 56 });
      expect(integerFieldInput.value).toBe("214748364");
    });

    test("Test on key press of number reaching minimum causes prevent default for Unsigned IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.UNSIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "0" } });
      expect(integerFieldInput.value).toBe("0");

      fireEvent.keyPress(integerFieldInput, { key: "-", charCode: 173 });
      expect(integerFieldInput.value).toBe("0");
    });
  });

  describe("PositiveInt IntegerComponent", () => {
    test("Should render PositiveInt IntegerComponent", () => {
      render(
        <IntegerComponent
          value={2147483647}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.POSITIVE_INT}
        />
      );

      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("2147483647");
    });

    test("Should validate PositiveInt IntegerComponent", () => {
      render(
        <IntegerComponent
          value={1}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.POSITIVE_INT}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("1");

      fireEvent.keyPress(integerFieldInput, { target: { value: "10" } });
    });

    test("Test 1 on key press of non-numeric causes prevent default for PositiveInt IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.POSITIVE_INT}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { key: "a", charCode: 97 });
      expect(integerFieldInput.value).toBe("");
    });

    test("Test 4 on key press of reaching maximum number causes prevent default for PositiveInt IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.POSITIVE_INT}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "214748364" } });
      expect(integerFieldInput.value).toBe("214748364");
      fireEvent.keyPress(integerFieldInput, { key: "8", charCode: 56 });
      expect(integerFieldInput.value).toBe("214748364");
    });

    test("Test on key press of valid PositiveInt IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.POSITIVE_INT}
        />
      );
      const integerField = screen.getByTestId("integer-field-Integer");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-Integer"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "214748364" } });
      expect(integerFieldInput.value).toBe("214748364");
    });
  });

  describe("Signed IntegerComponent", () => {
    test("Should render Signed IntegerComponent", () => {
      render(
        <IntegerComponent
          value={-2147483649}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
        />
      );

      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("-2147483649");
    });

    test("Should validate Signed IntegerComponent", () => {
      render(
        <IntegerComponent
          value={1}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
        />
      );

      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("1");

      fireEvent.keyPress(integerFieldInput, {
        target: { value: "2147483647" },
      });
    });

    test("Test 2 on key press of duplicate minus signs causes prevent default for Signed IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { key: "a", charCode: 97 });
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "-1" } });
      expect(integerFieldInput.value).toBe("-1");
      fireEvent.keyPress(integerFieldInput, { key: "-", charCode: 173 });
      expect(integerFieldInput.value).toBe("-1");
    });

    test("Test 3 on key press of minus sign with a positive number causes prevent default for Signed IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "1" } });
      expect(integerFieldInput.value).toBe("1");
      fireEvent.keyPress(integerFieldInput, { key: "-", charCode: 173 });
      expect(integerFieldInput.value).toBe("1");
    });

    test("Test 4 on key press of reaching maximum number causes prevent default for Signed IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "214748364" } });
      expect(integerFieldInput.value).toBe("214748364");
      fireEvent.keyPress(integerFieldInput, { key: "8", charCode: 56 });
      expect(integerFieldInput.value).toBe("214748364");
    });

    test("Test 4 on key press of reaching maximum number causes prevent default for PositiveInt IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          label=""
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.POSITIVE_INT}
        />
      );
      const integerField = screen.getByTestId("integer-field-");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { target: { value: "214748364" } });
      expect(integerFieldInput.value).toBe("214748364");
      //Adding an 8 to that value with be MAX_INTEGER + 1 and should not change
      fireEvent.keyPress(integerFieldInput, { key: "8", charCode: 56 });
      expect(integerFieldInput.value).toBe("214748364");
    });

    test("Test on key press of valid Signed IntegerComponent", () => {
      render(
        <IntegerComponent
          value={null}
          canEdit={true}
          fieldRequired={false}
          integerType={IntegerType.SIGNED}
          addTitle={"Integer"}
          showAddAttributeButton={true}
        />
      );
      expect(screen.getByText("Add Integer")).toBeInTheDocument();
      const integerField = screen.getByTestId("integer-field-Integer");
      expect(integerField).toBeInTheDocument();
      const integerFieldInput = screen.getByTestId(
        "integer-field-input-Integer"
      ) as HTMLInputElement;
      expect(integerFieldInput).toBeInTheDocument();
      expect(integerFieldInput.value).toBe("");

      fireEvent.keyPress(integerFieldInput, { key: "8", charCode: 56 });
      expect(
        screen.queryByText(
          "Signed integer range is [-2147483648 to 2147483647]"
        )
      ).not.toBeInTheDocument();
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
