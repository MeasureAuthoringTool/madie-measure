import React from "react";
import { render, screen } from "@testing-library/react";
import PeriodComponent from "./PeriodComponent";

describe("ExtensionComponent", () => {
  describe("ExtensionComponent", () => {
    test("Should render ExtensionComponent with add button", () => {
      render(
        <PeriodComponent
          label={"test"}
          canEdit={true}
          elementDefinition={{}}
          parentStructureDefinition={{}}
          showAddAttributeButton={true}
          addTitle={"Period"}
        />
      );

      expect(screen.getByText("Add Period")).toBeInTheDocument();
    });
  });
});
