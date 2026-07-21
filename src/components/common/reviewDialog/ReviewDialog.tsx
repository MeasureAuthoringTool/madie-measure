import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { Measure, ReviewStatus, MeasureReview } from "@madie/madie-models";
import {
  MadieDialog,
  RichTextEditor,
} from "@madie/madie-design-system/dist/react";
import { Divider, FormControlLabel, Switch } from "@mui/material";
import { useMeasureReviewServiceApi } from "@madie/madie-util";

interface ReviewDialogProps {
  open: boolean;
  measure?: Measure;
  onClose: () => void;
}

const EMPTY_REVIEW_COMMENT = "<p></p>";

export default function ReviewDialog({
  open,
  measure,
  onClose,
}: ReviewDialogProps) {
  const measureReviewServiceApi = useRef(useMeasureReviewServiceApi()).current;
  const [review, setReview] = useState<MeasureReview | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const initialValues = useMemo(
    () => ({
      markAsReady: review?.status === ReviewStatus.READY_FOR_REVIEW,
      comments: review?.comment ?? EMPTY_REVIEW_COMMENT,
    }),
    [review?.status, review?.comment]
  );

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
      onClose();
    },
  });
  const { resetForm } = formik;

  useEffect(() => {
    if (open) {
      resetForm({ values: initialValues });
    }
  }, [open, initialValues, resetForm]);

  const isSaveDisabled = !measure?.id || !formik.dirty || isReviewLoading;

  return (
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
  );
}
