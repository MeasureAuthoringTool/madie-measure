import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Measure, ReviewStatus } from "../../../../../madie-models/src";
// @ts-ignore
import { useMeasureServiceApi } from "@madie/madie-util";
import ReviewDialog from "./ReviewDialog";

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
  useMeasureServiceApi: jest.fn(),
}));

describe("ReviewDialog", () => {
  const mockUpdateMeasure = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    (useMeasureServiceApi as jest.Mock).mockReturnValue({
      updateMeasure: mockUpdateMeasure,
    });
    mockUpdateMeasure.mockClear();
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

  it("renders required content when open", () => {
    render(<ReviewDialog open={true} measure={measure} onClose={jest.fn()} />);

    expect(
      screen.getByText("Mark Measure Ready for Review")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Mark as Ready")).toBeInTheDocument();
    expect(screen.getByLabelText("Comments")).toBeInTheDocument();
    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
  });

  it("saves READY_FOR_REVIEW when mark-as-ready is selected", async () => {
    const onClose = jest.fn();
    render(<ReviewDialog open={true} measure={measure} onClose={onClose} />);

    expect(screen.getByTestId("review-dialog-save-button")).toBeDisabled();
    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockUpdateMeasure).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "measure-1",
          review: {
            status: ReviewStatus.READY_FOR_REVIEW,
            comment: "<p></p>",
          },
        })
      );
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
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

  it("saves NOT_READY_FOR_REVIEW when mark-as-ready remains off", async () => {
    const readyMeasure = {
      ...measure,
      review: {
        status: ReviewStatus.READY_FOR_REVIEW,
        comment: "<p>already ready</p>",
      },
    } as Measure;

    render(
      <ReviewDialog open={true} measure={readyMeasure} onClose={jest.fn()} />
    );

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });

    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(mockUpdateMeasure).toHaveBeenCalledWith(
        expect.objectContaining({
          review: {
            status: ReviewStatus.NOT_READY_FOR_REVIEW,
            comment: "<p>already ready</p>",
          },
        })
      );
    });
  });
});
