import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { Measure, ReviewStatus, MeasureReview } from "@madie/madie-models";
import {
  MadieDialog,
  RichTextEditor,
  Toast,
} from "@madie/madie-design-system/dist/react";
import { Divider, FormControlLabel, Switch } from "@mui/material";
import { useMeasureReviewServiceApi } from "@madie/madie-util";

interface ReviewDialogProps {
  open: boolean;
  measure?: Measure;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

const EMPTY_REVIEW_COMMENT = "<p></p>";
const REVIEW_ACTIVE_STATUSES = new Set<ReviewStatus>([
  ReviewStatus.READY_FOR_REVIEW,
  ReviewStatus.IN_PROGRESS,
  ReviewStatus.COMPLETE,
]);

const STATUS_DISPLAY_TEXT: Record<ReviewStatus, string> = {
  [ReviewStatus.READY_FOR_REVIEW]: "Ready for Review",
  [ReviewStatus.IN_PROGRESS]: "In Progress",
  [ReviewStatus.COMPLETE]: "Complete",
  [ReviewStatus.NOT_READY_FOR_REVIEW]: "Not Ready for Review",
};

export default function ReviewDialog({
  open,
  measure,
  onClose,
  onSuccess,
}: ReviewDialogProps) {
  const measureReviewServiceApi = useRef(useMeasureReviewServiceApi()).current;
  const [review, setReview] = useState<MeasureReview | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isRemoveConfirmationOpen, setIsRemoveConfirmationOpen] =
    useState(false);
  const [pendingValues, setPendingValues] = useState<{
    markAsReady: boolean;
    comments: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    toastOpen: boolean;
    toastType: string;
    toastMessage: string;
  }>({
    toastOpen: false,
    toastType: "danger",
    toastMessage: "",
  });
  const { toastOpen, toastType, toastMessage } = toast;

  const initialValues = useMemo(
    () => ({
      markAsReady: review?.status
        ? REVIEW_ACTIVE_STATUSES.has(review.status)
        : false,
      comments: review?.comment ?? EMPTY_REVIEW_COMMENT,
    }),
    [review?.status, review?.comment]
  );

  const shouldConfirmRemoval =
    review?.status === ReviewStatus.IN_PROGRESS ||
    review?.status === ReviewStatus.COMPLETE;

  const saveReview = async (values: {
    markAsReady: boolean;
    comments: string;
  }) => {
    if (!measure?.id) {
      return;
    }

    const reviewPayload: MeasureReview = {
      id: review?.id ?? "",
      measureId: measure.id,
      measureSetId: measure.measureSetId,
      status: values.markAsReady
        ? ReviewStatus.READY_FOR_REVIEW
        : ReviewStatus.NOT_READY_FOR_REVIEW,
      comment: values.comments || EMPTY_REVIEW_COMMENT,
    };

    try {
      const savedReview = review?.id
        ? await measureReviewServiceApi.updateMeasureReview(
            measure.id,
            reviewPayload
          )
        : await measureReviewServiceApi.createMeasureReview(
            measure.id,
            reviewPayload
          );

      setReview(savedReview);
      setToast({
        toastOpen: true,
        toastType: "success",
        toastMessage: "Review information has been saved successfully.",
      });
      await onSuccess?.();
      // The review status also surfaces in the PageHeader (madie-layout).
      // Broadcast the persisted review so that the PageHeader can update its display accordingly.
      window.dispatchEvent(
        new CustomEvent("review-measure-saved", { detail: savedReview })
      );
      onClose();
    } catch (error) {
      setToast({
        toastOpen: true,
        toastType: "danger",
        toastMessage:
          "An error occurred while saving the review. Please try again.",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchReview = async () => {
      if (!open || !measure?.id) {
        setReview(null);
        return;
      }

      setIsReviewLoading(true);
      try {
        const reviewResponse = await measureReviewServiceApi.getMeasureReview(
          measure.id
        );
        if (isMounted) {
          setReview(reviewResponse);
        }
      } catch {
        if (isMounted) {
          setReview(null);
        }
      } finally {
        if (isMounted) {
          setIsReviewLoading(false);
        }
      }
    };

    fetchReview();

    return () => {
      isMounted = false;
    };
  }, [open, measure?.id, measureReviewServiceApi]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (shouldConfirmRemoval && !values.markAsReady) {
        setPendingValues(values);
        setIsRemoveConfirmationOpen(true);
        return;
      }

      await saveReview(values);
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({ values: initialValues });
      setIsRemoveConfirmationOpen(false);
      setPendingValues(null);
    }
  }, [open, initialValues, resetForm]);

  const isSaveDisabled = !measure?.id || !formik.dirty || isReviewLoading;

  return (
    <>
      <MadieDialog
        title="Mark Measure Ready for Review"
        dialogProps={{
          open,
          onClose,
          maxWidth: "md",
          fullWidth: true,
          "data-testid": "review-dialog",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          onClick: onClose,
          "data-testid": "review-dialog-cancel-button",
        }}
        continueButtonProps={{
          variant: "cyan",
          continueText: "Save",
          disabled: isSaveDisabled,
          onClick: formik.submitForm,
          "data-testid": "review-dialog-save-button",
        }}
      >
        <div data-testid="review-dialog-content">
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            label="Mark as Ready"
            control={
              <Switch
                data-testid="review-dialog-mark-ready-switch"
                checked={formik.values.markAsReady}
                onChange={(event) =>
                  formik.setFieldValue("markAsReady", event.target.checked)
                }
                slotProps={{
                  input: {
                    "aria-label": "Mark as Ready",
                  },
                }}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "#0073C8",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#0073C8",
                  },
                }}
              />
            }
            sx={{
              "& .MuiFormControlLabel-label": {
                color: "#515151 !important",
              },
            }}
          />
          <div style={{ marginTop: 16 }}>
            <RichTextEditor
              id="review-comments"
              name="reviewComments"
              label="Comments"
              content={formik.values.comments}
              onChange={(value: string) =>
                formik.setFieldValue("comments", value)
              }
            />
          </div>
          <Divider sx={{ mt: 2 }} />
        </div>
      </MadieDialog>
      <MadieDialog
        title="Are you sure?"
        dialogProps={{
          open: isRemoveConfirmationOpen,
          onClose: () => {
            setIsRemoveConfirmationOpen(false);
            setPendingValues(null);
          },
          maxWidth: "sm",
          fullWidth: true,
          "data-testid": "review-dialog-remove-confirmation",
        }}
        cancelButtonProps={{
          variant: "outline",
          cancelText: "Cancel",
          onClick: () => {
            setIsRemoveConfirmationOpen(false);
            setPendingValues(null);
          },
          "data-testid": "review-dialog-remove-confirmation-cancel-button",
        }}
        continueButtonProps={{
          variant: "danger",
          continueText: "Continue",
          onClick: async () => {
            if (!pendingValues) {
              return;
            }
            setIsRemoveConfirmationOpen(false);
            const valuesToSave = pendingValues;
            setPendingValues(null);
            await saveReview(valuesToSave);
          },
          "data-testid": "review-dialog-remove-confirmation-continue-button",
        }}
      >
        <Divider sx={{ mb: 2 }} />
        <div data-testid="review-dialog-remove-confirmation-message">
          You are about to remove this measure from the review process which is
          {" already "}
          {
            STATUS_DISPLAY_TEXT[
              review?.status ?? ReviewStatus.NOT_READY_FOR_REVIEW
            ]
          }
          . Any existing comments on the measure will be retained.
        </div>
        <Divider sx={{ mt: 2 }} />
      </MadieDialog>
      <Toast
        toastKey="review-dialog-toast"
        toastType={toastType}
        testId={
          toastType === "danger"
            ? "review-dialog-error-text"
            : "review-dialog-success-text"
        }
        open={toastOpen}
        message={toastMessage}
        closeButtonProps={{
          "data-testid": "review-dialog-toast-close-button",
        }}
        onClose={() =>
          setToast({
            toastOpen: false,
            toastType: "danger",
            toastMessage: "",
          })
        }
        autoHideDuration={6000}
      />
    </>
  );
}
