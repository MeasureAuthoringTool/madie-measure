import * as React from "react";
import { render, screen } from "@testing-library/react";
import OidComponent from "./OidComponent";
import userEvent from "@testing-library/user-event";

describe("OidComponent", () => {
  it("Should render OidComponent", async () => {
    const handleChange = jest.fn();

    render(
      <OidComponent
        value={null}
        label="OID"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
      />
    );

    expect(screen.getByText("OID")).toBeInTheDocument();
    expect(screen.getByTestId("field-input-OID")).toBeInTheDocument();
  });

  it("Should validate input", async () => {
    const handleChange = jest.fn();

    render(
      <OidComponent
        value={null}
        label="OID"
        canEdit={true}
        fieldRequired={false}
        onChange={handleChange}
        structureDefinition={null}
        addTitle={"OID"}
        showAddAttributeButton={true}
      />
    );
    expect(screen.getByText("Add OID")).toBeInTheDocument();

    const oidInput = screen.getByTestId("field-input-OID") as HTMLInputElement;

    // valid oidInput
    userEvent.type(oidInput, "urn:oid:1.2.3.4.5");
    expect(oidInput.value).toBe("urn:oid:1.2.3.4.5");
    expect(
      screen.getByTestId("field-input-helper-text-OID")
    ).not.toHaveTextContent("Please enter a valid OID");

    // invalid oidInput
    userEvent.clear(oidInput);
    userEvent.type(oidInput, "invalid OID.");
    expect(oidInput).toHaveValue("invalid OID.");
    expect(screen.getByTestId("field-input-helper-text-OID")).toHaveTextContent(
      "Please enter a valid OID"
    );
  });
});
