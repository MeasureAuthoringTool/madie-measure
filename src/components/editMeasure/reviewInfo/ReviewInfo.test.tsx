import * as React from "react";
import ReviewInfo from "./ReviewInfo";
import { render, screen, waitFor } from "@testing-library/react";
describe("Reviewinfo", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const { getByTestId } = screen;

  const RenderReviewInfo = (props) => {
    return render(<ReviewInfo {...props} />);
  };

  test("Renders", async () => {
    await waitFor(() => RenderReviewInfo());
    const reviewInfo = getByTestId("review-info");
    expect(reviewInfo).toBeInTheDocument();
  });
});
