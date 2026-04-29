import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  it("renders the 'How it works' link by default", () => {
    render(<HowItWorks />);
    const link = screen.getByTestId("how-it-works-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("How it works");
    expect(
      screen.queryByTestId("how-it-works-content")
    ).not.toBeInTheDocument();
  });

  it("opens the info section when the link is clicked", async () => {
    render(<HowItWorks />);
    const link = screen.getByTestId("how-it-works-link");
    await userEvent.click(link);

    const content = screen.getByTestId("how-it-works-content");
    expect(content).toBeInTheDocument();
    expect(screen.getByText("How it Works")).toBeInTheDocument();
    expect(
      screen.getByText(
        /To combine profiles from one test case from each component, follow the steps below:/
      )
    ).toBeInTheDocument();
  });

  it("displays all three steps in the expanded info section", async () => {
    render(<HowItWorks />);
    await userEvent.click(screen.getByTestId("how-it-works-link"));

    expect(
      screen.getByText(
        "Select which measures to choose test case profiles from."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Select which test case to choose profiles from.")
    ).toBeInTheDocument();
    expect(screen.getByText("Select test case profiles.")).toBeInTheDocument();
  });

  it("closes the info section when the X button is clicked", async () => {
    render(<HowItWorks />);
    await userEvent.click(screen.getByTestId("how-it-works-link"));
    expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("how-it-works-close"));
    expect(
      screen.queryByTestId("how-it-works-content")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
  });

  it("sets aria-expanded correctly on the link", () => {
    render(<HowItWorks />);
    const link = screen.getByTestId("how-it-works-link");
    expect(link).toHaveAttribute("aria-expanded", "false");
  });

  // --- Controlled mode ---

  describe("controlled mode", () => {
    it("respects an external isOpen=true prop without internal state", () => {
      render(<HowItWorks isOpen={true} />);
      expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
      expect(screen.queryByTestId("how-it-works-link")).not.toBeInTheDocument();
    });

    it("respects an external isOpen=false prop", () => {
      render(<HowItWorks isOpen={false} />);
      expect(screen.getByTestId("how-it-works-link")).toBeInTheDocument();
      expect(
        screen.queryByTestId("how-it-works-content")
      ).not.toBeInTheDocument();
    });

    it("invokes onOpenChange(true) when link is clicked in controlled mode", async () => {
      const onOpenChange = jest.fn();
      render(<HowItWorks isOpen={false} onOpenChange={onOpenChange} />);
      await userEvent.click(screen.getByTestId("how-it-works-link"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it("invokes onOpenChange(false) when close button is clicked in controlled mode", async () => {
      const onOpenChange = jest.fn();
      render(<HowItWorks isOpen={true} onOpenChange={onOpenChange} />);
      await userEvent.click(screen.getByTestId("how-it-works-close"));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not toggle internally when controlled (parent must update isOpen)", async () => {
      // isOpen stays false; clicking link should not open the content
      const onOpenChange = jest.fn();
      render(<HowItWorks isOpen={false} onOpenChange={onOpenChange} />);
      await userEvent.click(screen.getByTestId("how-it-works-link"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      // still closed because parent did not flip isOpen
      expect(
        screen.queryByTestId("how-it-works-content")
      ).not.toBeInTheDocument();
    });

    it("calls onOpenChange in uncontrolled mode as well (when provided)", async () => {
      const onOpenChange = jest.fn();
      render(<HowItWorks onOpenChange={onOpenChange} />);
      await userEvent.click(screen.getByTestId("how-it-works-link"));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      // uncontrolled: state did flip
      expect(screen.getByTestId("how-it-works-content")).toBeInTheDocument();
    });
  });
});
