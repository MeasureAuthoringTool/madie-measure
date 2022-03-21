import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import NotFound from "./NotFound";
import { MemoryRouter } from "react-router";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";

// mocking useHistory
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/measures-mocked");
    return { push };
  },
}));

describe("NotFound component", () => {
  it("should render NotFound component", () => {
    const { getByTestId, getByText } = render(<NotFound />);

    expect(getByTestId("404-page")).toBeInTheDocument();
    expect(getByText("404 - Not Found!")).toBeInTheDocument();
    expect(getByTestId("404-page-link")).toBeInTheDocument();
  });

  it("should render home page after clicking Go Home", () => {
    const { getByTestId } = render(<NotFound />);
    fireEvent.click(getByTestId("404-page-link"));
    expect(mockPush).toHaveBeenCalledWith("/measures-mocked");
  });
});
