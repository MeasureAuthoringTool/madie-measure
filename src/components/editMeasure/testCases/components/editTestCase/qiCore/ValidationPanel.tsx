import React from "react";

import tw, { styled } from "twin.macro";
import { TestCase, ValidationStatus } from "@madie/madie-models";

import { Box } from "@mui/material";
import Skeleton from "@mui/material/Skeleton";

interface AlertProps {
  status?: "success" | "warning" | "error" | "info" | "meta" | null;
  message?: any;
}

/*
previous color system based off of tw.
success #249A5B vs #A4FAA8, 3:1 fail dark green to light green
warning #B87A06 vs #FCEB9D, 3:1 fail, orange yellow
error: #BA1C32 vs #FBC4AB 4.1 fail red to red orange
// meta: 000 #b0EEFF: pass
default: #2469B7 vs #b0EEFF  d-L  teal 4.4:1
*/
const styles = {
  success: `color #333333; background-color: #90EE90; border: solid 1px #7cb342`,
  warning: `color #333333; background-color: #FFF9EB; border: solid 1px #FFC438`,
  error: `color #333333; background-color: #FDE7EA; border: solid 1px #D92F2F`,
  // meta and default are same colors.
  meta: `color #333333; background-color: #e6f5ff; border: solid 1px #0073c8`,
  default: `color #333333; background-color: #e6f5ff; border: solid 1px #0073c8`,
};

const ValidationAlertCard = styled.p<AlertProps>(({ status = "default" }) => [
  tw`text-xs bg-white p-3 rounded-xl mx-3 my-1 break-words`,
  styles[status],
]);

interface ValidationPanelProps {
  testCase: TestCase;
  validationErrors: any[];
  isQiCoreV6: boolean;
  stu6TestCaseValidationFeatureFlag: boolean;
}

const ValidationPanel = ({
  testCase,
  validationErrors,
  isQiCoreV6,
  stu6TestCaseValidationFeatureFlag,
}: ValidationPanelProps) => {
  const renderSkeleton = () => (
    <Box
      data-testid="validation-skeleton-box"
      aria-label="Validation loading skeletons"
      sx={{
        width: 480,
        height: 50,
        backgroundColor: "#f5f5f5",
        borderRadius: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "10px",
      }}
    >
      <Skeleton
        data-testid="validation-skeleton"
        aria-label="Validation loading skeleton"
        width={300}
        height={30}
        animation="wave"
        sx={{ marginLeft: "-160px" }}
      />
    </Box>
  );

  const renderValidationErrors = () =>
    validationErrors
      .sort((a, b) => (a.severity < b.severity ? -1 : 1))
      .filter((error) => !/^information/.test(error?.severity))
      .map((error) => (
        <ValidationAlertCard
          key={error.key}
          data-testid={`validation-card-${error.key}`}
          aria-describedby={`validation-card-description-${error.key}`}
          status={
            error.diagnostics.includes("Meta.profile")
              ? "meta"
              : error.severity || "error"
          }
        >
          {error.diagnostics.includes("Meta.profile")
            ? "Meta.profile: "
            : error.severity
            ? error.severity.charAt(0).toUpperCase() +
              error.severity.slice(1) +
              ": "
            : ""}
          {error.diagnostics}
        </ValidationAlertCard>
      ));

  const renderNoErrors = () => (
    <span aria-describedby="validation-no-errors">Nothing to see here!</span>
  );

  const isLoading = [
    ValidationStatus.PENDING,
    ValidationStatus.VALIDATING,
  ].includes(testCase?.validationStatus);
  const hasErrors = validationErrors && validationErrors.length > 0;
  const showNoErrors = stu6TestCaseValidationFeatureFlag
    ? (testCase?.validationStatus === ValidationStatus.VALID && isQiCoreV6) ||
      !isQiCoreV6
    : true;

  return (
    <>
      {isLoading
        ? renderSkeleton()
        : hasErrors
        ? renderValidationErrors()
        : showNoErrors && renderNoErrors()}
    </>
  );
};

export default ValidationPanel;
