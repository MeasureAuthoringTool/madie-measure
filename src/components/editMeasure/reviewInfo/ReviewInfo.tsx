import React, { useState, useEffect } from "react";
import MetaDataWrapper from "../details/MetaDataWrapper";
import ReviewInfoItem from "./ReviewInfoItem";
import "../details/MeasureDetails.scss";
import { measureStore } from "@madie/madie-util";

// The tab and link to this component were removed in MAT-6402.
// However, we will be reviving it at some point in the future.
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
            <ReviewInfoItem
              label="Approval Date"
              date={measure?.reviewMetaData?.approvalDate}
              helperText="Set when versioning"
              testId="approval-date-input"
            />
            <ReviewInfoItem
              label="Last Review Date"
              date={measure?.reviewMetaData?.lastReviewDate}
              helperText="Set when versioning"
              testId="review-date-input"
            />
            {/* to do, figure out how to do finalized date for QI core 
            <ReviewInfoItem label={} date={}/>*/}
          </div>
        </>
      </MetaDataWrapper>
    </div>
  );
};

export default ReviewInfo;
