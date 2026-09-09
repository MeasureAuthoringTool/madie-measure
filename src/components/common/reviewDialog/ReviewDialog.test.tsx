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
    const dispatchEventSpy = jest.spyOn(window, "dispatchEvent");
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

    // The header in the layout micro-frontend relies on this broadcast to
    // refresh its status without re-querying the API.
    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "review-measure-saved",
          detail: { id: "new-review-id" },
        })
      );
    });
    dispatchEventSpy.mockRestore();

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

    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();

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

  it("defaults Mark as Ready to ON for IN_PROGRESS and COMPLETE statuses", async () => {
    mockGetMeasureReview.mockResolvedValueOnce({
      id: "review-in-progress",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.IN_PROGRESS,
      comment: "<p>in progress</p>",
    });

    const { rerender } = render(
      <ReviewDialog open={true} measure={measure} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    mockGetMeasureReview.mockResolvedValueOnce({
      id: "review-complete",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.COMPLETE,
      comment: "<p>complete</p>",
    });

    rerender(
      <ReviewDialog open={false} measure={measure} onClose={jest.fn()} />
    );
    rerender(
      <ReviewDialog open={true} measure={measure} onClose={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });
  });

  it("shows confirmation before removing IN_PROGRESS review status", async () => {
    const onClose = jest.fn();
    const existingReview: MeasureReview = {
      id: "existing-review-id",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.IN_PROGRESS,
      comment: "<p>in progress</p>",
    };
    mockGetMeasureReview.mockResolvedValueOnce(existingReview);

    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText(/already In Progress\./)).toBeInTheDocument();
    expect(mockUpdateMeasureReview).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("still shows confirmation when IN_PROGRESS review payload has no id", async () => {
    mockGetMeasureReview.mockResolvedValueOnce({
      id: "",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.IN_PROGRESS,
      comment: "<p>in progress</p>",
    } as MeasureReview);

    render(<ReviewDialog open={true} measure={measure} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
    expect(mockCreateMeasureReview).not.toHaveBeenCalled();
    expect(mockUpdateMeasureReview).not.toHaveBeenCalled();
  });

  it("closes confirmation and keeps dialog open when cancel is clicked", async () => {
    mockGetMeasureReview.mockResolvedValueOnce({
      id: "existing-review-id",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.COMPLETE,
      comment: "<p>complete</p>",
    });

    render(<ReviewDialog open={true} measure={measure} onClose={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    userEvent.click(
      screen.getByTestId("review-dialog-remove-confirmation-cancel-button")
    );

    await waitFor(() => {
      expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    });
    expect(
      screen.getByText("Mark Measure Ready for Review")
    ).toBeInTheDocument();
    expect(mockUpdateMeasureReview).not.toHaveBeenCalled();
  });

  it("continues removal after confirmation for COMPLETE review status", async () => {
    const onClose = jest.fn();
    const existingReview: MeasureReview = {
      id: "existing-review-id",
      measureId: "measure-1",
      measureSetId: "set-1",
      status: ReviewStatus.COMPLETE,
      comment: "<p>complete</p>",
    };
    mockGetMeasureReview.mockResolvedValueOnce(existingReview);

    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText("Mark as Ready")).toBeChecked();
    });

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();

    userEvent.click(
      screen.getByTestId("review-dialog-remove-confirmation-continue-button")
    );

    await waitFor(() => {
      expect(mockUpdateMeasureReview).toHaveBeenCalledWith(
        "measure-1",
        expect.objectContaining({
          id: "existing-review-id",
          status: ReviewStatus.NOT_READY_FOR_REVIEW,
          comment: "<p>complete</p>",
        })
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("calls onSuccess before onClose so the list refreshes the Review column", async () => {
    const callOrder: string[] = [];
    const onSuccess = jest.fn(() => {
      callOrder.push("onSuccess");
    });
    const onClose = jest.fn(() => {
      callOrder.push("onClose");
    });

    render(
      <ReviewDialog
        open={true}
        measure={measure}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
    expect(callOrder).toEqual(["onSuccess", "onClose"]);
  });

  it("stays open until an async onSuccess resolves, so the refetch finishes first", async () => {
    let resolveRefetch: () => void;
    const onSuccess = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRefetch = resolve;
        })
    );
    const onClose = jest.fn();

    render(
      <ReviewDialog
        open={true}
        measure={measure}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    // still pending -> dialog must stay open
    expect(onClose).not.toHaveBeenCalled();

    resolveRefetch();
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("skips onSuccess when the save fails, so the list is not refreshed from an unsaved review", async () => {
    const onSuccess = jest.fn();
    mockCreateMeasureReview.mockRejectedValueOnce(new Error("save failed"));

    render(
      <ReviewDialog
        open={true}
        measure={measure}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

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
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("still saves and closes when the optional onSuccess is omitted", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
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
