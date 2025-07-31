import React from "react";
import { render, screen } from "@testing-library/react";
import InstantComponent from "./InstantComponent";

describe("InstantComponent", () => {
  describe("InstantComponent", () => {
    test("Should render InstantComponent with add button", () => {
      const functionThatDoesntDoAnything = jest.fn();
      render(
        <InstantComponent
          dateTimeValue={null}
          handleDateTimeChange={functionThatDoesntDoAnything}
          required={true}
          name={"test"}
          label={"Observation.issued"}
          error={true}
          helperText={"Something is possibly wrong"}
          onBlur={functionThatDoesntDoAnything}
          setTouched={functionThatDoesntDoAnything}
          showAddAttributeButton={true}
          addTitle={"Issued"}
        />
      );

      expect(screen.getByText("Add Issued")).toBeInTheDocument();
    });
  });
});
