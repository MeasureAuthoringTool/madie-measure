import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// @ts-ignore;
import { useMeasureReviewServiceApi } from "@madie/madie-util";
import ReviewDialog from "./ReviewDialog";
import { Measure, ReviewStatus, MeasureReview } from "@madie/madie-models";

jest.mock("@madie/madie-design-system/dist/react", () => {
  const actual = jest.requireActual("@madie/madie-design-system/dist/react");
  return {
    ...actual,
    RichTextEditor: ({ label, content, onChange }: any) => (
      <textarea
        aria-label={label}
        data-testid="review-comments-textarea"
        value={content}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  };
});

jest.mock("@madie/madie-util", () => ({
  useMeasureReviewServiceApi: jest.fn(),
}));

describe("ReviewDialog", () => {
  const mockGetMeasureReview = jest.fn().mockResolvedValue(null);
  const mockCreateMeasureReview = jest.fn().mockResolvedValue({
    id: "new-review-id",
  });
  const mockUpdateMeasureReview = jest.fn().mockResolvedValue({
    id: "existing-review-id",
  });

  beforeEach(() => {
    (useMeasureReviewServiceApi as jest.Mock).mockReturnValue({
      getMeasureReview: mockGetMeasureReview,
      createMeasureReview: mockCreateMeasureReview,
      updateMeasureReview: mockUpdateMeasureReview,
    });
    mockGetMeasureReview.mockClear();
    mockCreateMeasureReview.mockClear();
    mockUpdateMeasureReview.mockClear();
  });

  const measure = {
    id: "measure-1",
    versionId: "version-1",
    active: true,
    measureHumanReadableId: "M1",
    measureSetId: "set-1",
    version: "0.0.001",
    state: "DRAFT",
    measureName: "Measure One",
    cqlLibraryName: "MeasureOne",
    ecqmTitle: "Measure One",
    cql: "library MeasureOne version '0.0.001'",
    createdAt: "",
    createdBy: "",
    lastModifiedAt: "",
    lastModifiedBy: "",
    model: "QI-Core v4.1.1",
    measurementPeriodStart: new Date(),
    measurementPeriodEnd: new Date(),
    baseConfigurationTypes: [],
  } as unknown as Measure;

  it("renders required content when open", async () => {
    render(<ReviewDialog open={true} measure={measure} onClose={jest.fn()} />);

    expect(
      screen.getByText("Mark Measure Ready for Review")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mark as Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Comments")).toBeInTheDocument();
    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();

    await waitFor(() => {
      expect(mockGetMeasureReview).toHaveBeenCalledWith("measure-1");
    });
  });

  it("creates READY_FOR_REVIEW when no existing review is found", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockCreateMeasureReview).toHaveBeenCalledWith(
        "measure-1",
        expect.objectContaining({
          id: "",
          measureId: "measure-1",
          measureSetId: "set-1",
          status: ReviewStatus.READY_FOR_REVIEW,
          comment: "<p></p>",
        })
      );
    });

    expect(mockUpdateMeasureReview).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("Review information has been saved successfully.")
    ).toBeInTheDocument();

    userEvent.click(screen.getByTestId("review-dialog-toast-close-button"));

    await waitFor(() => {
      expect(
        screen.queryByText("Review information has been saved successfully.")
      ).not.toBeInTheDocument();
    });
  });

  it("enables Save when comments are modified", async () => {
    render(<ReviewDialog open={true} measure={measure} onClose={jest.fn()} />);

    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();

    const commentEditor = screen.getByTestId("review-comments-textarea");
    userEvent.type(commentEditor, "Needs one more pass");

    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
  });

  it("invokes onClose when cancel is clicked", () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-cancel-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates NOT_READY_FOR_REVIEW when existing review is modified", async () => {
    const existingReview: MeasureReview = {
      id: "existing-review-id",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.READY_FOR_REVIEW,
      comment: "<p>already ready</p>",
    };
    mockGetMeasureReview.mockResolvedValueOnce(existingReview);

    render(<ReviewDialog open={true} measure={measure} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });

    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockUpdateMeasureReview).toHaveBeenCalledWith(
        "measure-1",
        expect.objectContaining({
          id: "existing-review-id",
          measureId: "measure-1",
          measureSetId: "set-1",
          status: ReviewStatus.NOT_READY_FOR_REVIEW,
          comment: "<p>already ready</p>",
        })
      );
    });

    expect(mockCreateMeasureReview).not.toHaveBeenCalled();
  });

  it("shows an error toast when saving a review fails", async () => {
    const onClose = jest.fn();
    mockCreateMeasureReview.mockRejectedValueOnce(new Error("save failed"));
    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    expect(
      await screen.findByText(
        "An error occurred while saving the review. Please try again."
      )
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
