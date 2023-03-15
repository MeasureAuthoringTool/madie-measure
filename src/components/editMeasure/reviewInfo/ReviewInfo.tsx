import React, { useState, useEffect } from "react";
import MetaDataWrapper from "../measureDetails/MetaDataWrapper";
import ReviewInfoItem from "./ReviewInfoItem";
import "../measureDetails/MeasureDetails.scss";
import { measureStore } from "@madie/madie-util";

const ReviewInfo = () => {
  const [measure, setMeasure] = useState<any>(measureStore.state);
  useEffect(() => {
    const subscription = measureStore.subscribe(setMeasure);
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div id="review-info" data-testid="review-info">
      <MetaDataWrapper
        header="Review Info"
        canEdit={false}
        dirty={false}
        isValid={true}
        handleSubmit={() => {}}
        onCancel={() => {}}
      >
        <>
          <div className="form-row">
            {measure?.reviewMetaData?.approvalDate && (
              <ReviewInfoItem
                label="Approval Date"
                date={measure?.reviewMetaData?.approvalDate}
                helperText="Set when versioning"
                testId="approval-date-input"
              />
            )}
            {measure?.reviewMetaData?.lastReviewDate && (
              <ReviewInfoItem
                label="Last Review Date"
                date={measure?.reviewMetaData?.lastReviewDate}
                helperText="Set when versioning"
                testId="review-date-input"
              />
            )}
            {/* to do, figure out how to do finalized date for QI core 
            <ReviewInfoItem label={} date={}/>*/}
          </div>
        </>
      </MetaDataWrapper>
    </div>
  );
};

export default ReviewInfo;
