import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import NotFound from "./NotFound";

const mockedUsedNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockedUsedNavigate,
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
    expect(mockedUsedNavigate).toHaveBeenCalledWith("/measures");
  });
});
