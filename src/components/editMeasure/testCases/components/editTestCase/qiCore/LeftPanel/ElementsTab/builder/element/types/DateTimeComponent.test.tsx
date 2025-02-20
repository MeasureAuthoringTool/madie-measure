import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DateTimeComponent from "./DateTimeComponent";
import userEvent from "@testing-library/user-event";

describe("DateTimeComponent", () => {
  test.skip("Should render DateTimeComponent", () => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value="2025-01-01T04:00:00-05:00"
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DDTHH:mm:ssZ-field-birthday");
    expect(dateField).toBeInTheDocument();

    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DDTHH:mm:ssZ-field-birthday-input"
    );
    expect(dateFieldInput).toBeInTheDocument();

    const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    expect(inputTime).toBeInTheDocument();

    const timeZone = screen.getByTestId("timezone-input-field-birthday-input");
    expect(timeZone).toBeInTheDocument();

    // to check the list of supported timezones in jest. number strings work in source, but not here. 
    // if (typeof Intl.supportedValuesOf === "function") {
    //   console.log(Intl.supportedValuesOf("timeZone"));
    // }
  });

  test("Should date and time", async() => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value="2025-01-01T04:00:00-05:00"
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DDTHH:mm:ssZ-field-birthday");
    expect(dateField).toBeInTheDocument();

    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DDTHH:mm:ssZ-field-birthday-input"
    );
    expect(dateFieldInput).toBeInTheDocument();
    userEvent.type(dateFieldInput, "09/27/2024");
    expect(screen.getByDisplayValue("09/27/2024")).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledWith("")

    const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    expect(inputTime).toBeInTheDocument();
    userEvent.type(inputTime, "07:33:33 PM");
    expect(screen.getByDisplayValue("07:33:33 PM")).toBeInTheDocument();
    expect(handleChange).toHaveBeenCalledWith("")

  });

  test("Should handleTimezone", async() => {
    const handleChange = jest.fn();
    render(
      <DateTimeComponent
        canEdit={true}
        label="birthday"
        fieldRequired={false}
        value="2025-01-01T04:00:00-05:00"
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    const dateField = screen.getByTestId("YYYY-MM-DDTHH:mm:ssZ-field-birthday");
    expect(dateField).toBeInTheDocument();

    const dateFieldInput = screen.getByTestId(
      "YYYY-MM-DDTHH:mm:ssZ-field-birthday-input"
    );
    // expect(dateFieldInput).toBeInTheDocument();
    // userEvent.type(dateFieldInput, "09/27/2024");
    // expect(screen.getByDisplayValue("09/27/2024")).toBeInTheDocument();

    // const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    // expect(inputTime).toBeInTheDocument();
    // userEvent.type(inputTime, "07:33:33 PM");
    // expect(screen.getByDisplayValue("07:33:33 PM")).toBeInTheDocument();

    const timeZone = screen.getByTestId("timezone-input-field-birthday-input");
    expect(timeZone.value).toBe("America/New_York");

    fireEvent.change(timeZone, {
      target: {
        value: "America/Los_Angeles",
      },
    });
    expect(handleChange).toHaveBeenCalledWith("")
  });
});
