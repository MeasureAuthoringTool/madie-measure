import React from "react";
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
    expect(
      screen.getByText("Select test case profiles.")
    ).toBeInTheDocument();
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
});
