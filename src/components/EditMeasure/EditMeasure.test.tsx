import * as React from "react";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import EditMeasure from "./EditMeasure";

jest.mock("./MeasureDetails/MeasureDetails");

describe.skip("EditMeasure Component", () => {
  it("should render edit measure menu with measure details page active by default", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <EditMeasure />
      </MemoryRouter>
    );

    //verify all menus present in the dom
    expect(getByText("Details")).toBeInTheDocument();
    expect(getByText("CQL Editor")).toBeInTheDocument();
    expect(getByText("Measure Groups")).toBeInTheDocument();
    expect(getByText("Patients")).toBeInTheDocument();

    expect(getByText("Details").classList).toContain("active");
  });

  it("should render respective menu contents on clicking menu items", () => {
    const { getByText } = render(
      <MemoryRouter initialEntries={["/"]}>
        <EditMeasure />
      </MemoryRouter>
    );

    // CQL Editor Menu click action
    fireEvent.click(getByText("CQL Editor"));
    expect(getByText("CQL Editor").classList).toContain("active");
    expect(document.body.textContent).toContain(
      "library testCql version '1.0.000'"
    );

    // Measure Groups Menu click action
    fireEvent.click(getByText("Measure Groups"));
    expect(getByText("Measure Groups").classList).toContain("active");
    expect(document.body.textContent).toContain("In progress...");

    // Patients Menu click action
    fireEvent.click(getByText("Patients"));
    expect(getByText("Patients").classList).toContain("active");
    expect(document.body.textContent).toContain("In progress...");
  });
});
