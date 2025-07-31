import React from "react";
import { render, screen } from "@testing-library/react";
import TimeComponent from "./TimeComponent";
import userEvent from "@testing-library/user-event";

describe("TimeComponent", () => {
  test("Should render TimeComponent", () => {
    const handleChange = jest.fn();
    render(
      <TimeComponent
        canEdit={true}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
      />
    );

    const inputTime = screen.getByPlaceholderText("hh:mm:ss aa");
    expect(inputTime).toBeInTheDocument();
  });

  test("Should handle change", () => {
    const handleChange = jest.fn();
    render(
      <TimeComponent
        canEdit={true}
        structureDefinition={null}
        fieldRequired={false}
        onChange={handleChange}
        value={`01:23:45`}
        addTitle={"Time"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add Time")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("hh:mm:ss aa");
    userEvent.type(input, "082359AM");
    expect(input).toHaveValue("08:23:59 AM");
    expect(handleChange).toHaveBeenCalledWith("08:23:59");
  });
});
