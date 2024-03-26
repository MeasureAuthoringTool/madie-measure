import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import * as React from "react";
import CodesSection from "./CodesSection";

const renderEditor = () => {
  return render(<CodesSection />);
};

describe("CodesSection", () => {
  it("should display all codes section nav tabs and navigation works as expected", async () => {
    renderEditor();
    const codeSystems = await screen.findByText("Code Systems");
    const code = await screen.findByText("Code");
    const applied = await screen.findByText("Applied");

    expect(codeSystems).toHaveAttribute("aria-selected", "true");
    act(() => {
      fireEvent.click(code);
    });
    await waitFor(() => {
      expect(code).toHaveAttribute("aria-selected", "true");
    });

    act(() => {
      fireEvent.click(applied);
    });
    await waitFor(() => {
      expect(applied).toHaveAttribute("aria-selected", "true");
    });
    act(() => {
      fireEvent.click(codeSystems);
    });
    await waitFor(() => {
      expect(codeSystems).toHaveAttribute("aria-selected", "true");
    });
  });

  it("should display code systems sub tab section", async () => {
    renderEditor();
    const codeSystemsSubTab = await screen.findByText("Code Systems");
    expect(codeSystemsSubTab).toBeInTheDocument();
    expect(codeSystemsSubTab).toHaveAttribute("aria-selected", "true");

    const codeSystemsSection = await screen.findByText("Code Systems Section");
    expect(codeSystemsSection).toBeInTheDocument();
  });

  it("should render code sub tab section", async () => {
    renderEditor();
    const codeSubTab = await screen.findByText("Code");
    expect(codeSubTab).toBeInTheDocument();
    act(() => {
      fireEvent.click(codeSubTab);
    });
    expect(codeSubTab).toHaveAttribute("aria-selected", "true");

    const codesSectionHeading = await screen.findByText("Code(s)");
    const resultsSectionHeading = await screen.findByText("Results");
    expect(codesSectionHeading).toBeInTheDocument();
    expect(resultsSectionHeading).toBeInTheDocument();
  });

  it("should render code applied tab section", async () => {
    renderEditor();
    const appliedSubTab = await screen.findByText("Applied");
    expect(appliedSubTab).toBeInTheDocument();
    act(() => {
      fireEvent.click(appliedSubTab);
    });
    expect(appliedSubTab).toHaveAttribute("aria-selected", "true");

    const appliedSectionButton = await screen.findByRole("button");
    const appliedSectionHeading =
      within(appliedSectionButton).getByText("Applied");
    expect(appliedSectionHeading).toBeInTheDocument();
  });
});
