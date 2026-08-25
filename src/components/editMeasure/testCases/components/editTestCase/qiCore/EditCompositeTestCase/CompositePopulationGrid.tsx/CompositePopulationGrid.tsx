import React from "react";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { StyledIcon } from "../../../../populations/TestCasePopulationList";
import classNames from "classnames";
import { useFormikContext, getIn } from "formik";
import _ from "lodash";

const formatValue = (value?: number, isPercentage = false): string => {
  if (value == null) {
    return "-";
  }
  return isPercentage ? `${value}%` : `${value}`;
};

const CompositePopulationGrid = ({
  group,
  isTestCaseExecuted,
  disabled,
  index,
}) => {
  const formik: any = useFormikContext();
  const rootLabel = `groupPopulations[${index}].compositeScoreValues`;

  const compositeScoreError = getIn(
    formik.errors,
    `${rootLabel}.compositeScore.expected`
  );

  const denominatorScoreError = getIn(
    formik.errors,
    `${rootLabel}.denominatorScore.expected`
  );

  const numeratorScoreError = getIn(
    formik.errors,
    `${rootLabel}.numeratorScore.expected`
  );

  const matchingPopulation = formik.values.groupPopulations?.find(
    (p) => p.groupId === group.groupId
  );
  const populationBasis =
    formik.values.groupPopulations?.find((p) => p.groupId === group?.groupId)
      ?.populationBasis ?? "";

  const checkIfAllPass = () => {
    if (!isTestCaseExecuted) {
      return "";
    }
    const actualScores = group.scores;
    const expectedScores = matchingPopulation?.compositeScoreValues;
    if (
      expectedScores?.compositeScore?.expected !== actualScores.compositeScore
    ) {
      return "fail";
    }

    if (
      expectedScores?.denominatorScore?.expected !==
      actualScores.denominatorScore
    ) {
      return "fail";
    }
    if (
      expectedScores?.numeratorScore?.expected !== actualScores.numeratorScore
    ) {
      return "fail";
    }
    return "pass";
  };
  const view = checkIfAllPass();
  const captionClass = classNames("caption", {
    pass: view === "pass",
    fail: view === "fail",
  });
  const displayName = group.displayId.replace(
    /^Group_(\d+)$/,
    "Measure Group $1"
  );
  return (
    <table
      data-testid="test-case-population-list-tbl"
      className="population-table"
    >
      <caption>
        {isTestCaseExecuted && (
          <StyledIcon
            icon={view === "pass" ? faCheckCircle : faTimesCircle}
            data-testid={`test-population-icon-scoring`}
            errors={view === "fail"}
          />
        )}
        <span data-testid={group.displayId} className={captionClass}>
          {displayName}&nbsp;
        </span>
        <span
          className="sub-caption"
          data-testid={`${group.displayId}-scoring-unit-${index + 1}`}
        >
          - {_.startCase(populationBasis)}
        </span>
      </caption>
      <thead>
        <tr>
          <th scope="col"></th>
          <th scope="col">Population</th>
          <th scope="col">Expected</th>
          <th scope="col">Actual</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td />
          <td>Denominator</td>
          <td>
            <input
              type="text"
              style={disabled ? { border: "none" } : {}}
              aria-disabled={disabled ? "true" : "false"}
              size={2}
              {...formik.getFieldProps(
                `${rootLabel}.denominatorScore.expected`
              )}
            />
          </td>
          <td data-testid={`composite-denominator-score-${group.displayId}`}>
            {formatValue(group.scores?.denominatorScore)}
          </td>
        </tr>
        {denominatorScoreError && (
          <tr tw="border-b">
            <td>
              <span style={{ visibility: "hidden" }} aria-hidden="true">
                -
              </span>
            </td>
            <td colSpan={5}>
              <span
                data-testid={`${group.name}-error-helper-text`}
                role="alert"
                className="qpp-error-message"
                style={{ textTransform: "none" }}
              >
                {denominatorScoreError}
              </span>
            </td>
          </tr>
        )}
        <tr>
          <td />
          <td>Numerator</td>
          <td>
            <input
              type="text"
              size={2}
              style={disabled ? { border: "none" } : {}}
              aria-disabled={disabled ? "true" : "false"}
              {...formik.getFieldProps(`${rootLabel}.numeratorScore.expected`)}
            />
          </td>
          <td data-testid={`composite-numerator-score-${group.displayId}`}>
            {formatValue(group.scores?.numeratorScore)}
          </td>
        </tr>
        {numeratorScoreError && (
          <tr tw="border-b">
            <td>
              <span style={{ visibility: "hidden" }} aria-hidden="true">
                -
              </span>
            </td>
            <td colSpan={5}>
              <span
                data-testid={`${group.displayId}-error-helper-text`}
                role="alert"
                className="qpp-error-message"
                style={{ textTransform: "none" }}
              >
                {numeratorScoreError}
              </span>
            </td>
          </tr>
        )}

        <tr>
          <td />
          <td>Composite Score</td>
          <td
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              size={2}
              style={disabled ? { border: "none" } : {}}
              aria-disabled={disabled ? "true" : "false"}
              {...formik.getFieldProps(`${rootLabel}.compositeScore.expected`)}
            />
            <span style={{ fontSize: "32px", marginLeft: "5px" }}>%</span>
          </td>
          <td data-testid={`composite-composite-score-${group.displayId}`}>
            {formatValue(group.scores?.compositeScore, true)}
          </td>
        </tr>
        {compositeScoreError && (
          <tr tw="border-b">
            <td>
              <span style={{ visibility: "hidden" }} aria-hidden="true">
                -
              </span>
            </td>
            <td colSpan={5}>
              <span
                data-testid={`${group.displayId}-error-helper-text`}
                role="alert"
                className="qpp-error-message"
                style={{ textTransform: "none" }}
              >
                {compositeScoreError}
              </span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export default CompositePopulationGrid;
