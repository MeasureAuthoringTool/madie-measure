import React from "react";
import MetaDataWrapper from "../measureDetails/MetaDataWrapper";
import "../measureDetails/MeasureDetails.scss";

const ReviewInfo = () => {
  return (
    <div id="meta-data-container">
      <MetaDataWrapper
        header="Review Info"
        canEdit={false}
        dirty={false}
        isValid={true}
        handleSubmit={() => {}}
        onCancel={() => {}}
      >
        <div />
      </MetaDataWrapper>
    </div>
  );
};

export default ReviewInfo;
