import React from "react";
import info from "../../../components/common/info.svg";
const ReviewInfoItem = ({ label, helperText, date, testId }) => {
  const dateTime = new Date(date).toLocaleDateString();
  return (
    <article className="info-item">
      <div>
        <div className="help-image">
          <label>{label}</label>
          <img alt="info help" src={info} />
          <span className="more-text">{helperText}</span>
        </div>
      </div>
      <input data-testId={testId} value={dateTime} readOnly />
    </article>
  );
};

export default ReviewInfoItem;
