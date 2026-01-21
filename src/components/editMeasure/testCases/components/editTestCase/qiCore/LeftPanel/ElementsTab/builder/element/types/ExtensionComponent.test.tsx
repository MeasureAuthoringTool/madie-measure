import React from "react";
import { render, screen } from "@testing-library/react";
import ExtensionComponent from "./ExtensionComponent";

describe("ExtensionComponent", () => {
  test("Should render ExtensionComponent with add button", () => {
    render(
      <ExtensionComponent
        label={"test"}
        canEdit={true}
        elementDefinition={{}}
        parentStructureDefinition={{}}
        showAddAttributeButton={true}
        addTitle={"Extension"}
      />
    );

    expect(screen.getByText("Add Extension")).toBeInTheDocument();
  });
});
