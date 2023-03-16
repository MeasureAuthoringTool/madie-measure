import React from "react";
import info from "../../../components/common/info.svg";
const ReviewInfoItem = ({ label, helperText, date, testId }) => {
  // if date omitted we display a - instead.
  const dateTime = date ? new Date(date).toLocaleDateString() : "-";
  return (
    <article className="info-item">
      <div>
        <div className="help-image">
          <label id={`${testId}-label`} htmlFor={testId}>
            {label}
          </label>
          <img alt="info help" src={info} />
          <span className="more-text" id={`${testId}-helper-text`}>
            {helperText}
          </span>
        </div>
      </div>
      <input
        data-testId={testId}
        value={dateTime}
        readOnly
        aria-describedby={`${testId}-helper-text`}
      />
    </article>
  );
};

export default ReviewInfoItem;
