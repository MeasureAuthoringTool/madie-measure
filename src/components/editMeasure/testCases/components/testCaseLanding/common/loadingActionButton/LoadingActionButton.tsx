import React, { useCallback, useState } from "react";
import RefreshIcon from "@mui/icons-material/Refresh";
import LoadingButton from "@mui/lab/LoadingButton";

interface RunTestButtonProps {
  hasErrors: boolean;
  isExecutionContextReady: boolean;
  onClick: () => void;
  label: string;
  primary?: boolean;
  dataTestId?: string;
}

export default function LoadingActionButton({
  hasErrors,
  isExecutionContextReady,
  onClick,
  dataTestId,
  primary = false,
  label,
}: RunTestButtonProps) {
  //TODO: because calculation is a heavy process, react blocks all the re-renders
  // during test case execution. this is to overcome that.
  // remove this once we move calculation to backend`
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(() => {
    setLoading(true);
    setTimeout(async () => {
      await onClick();
      setLoading(false);
    }, 500);
  }, [onClick]);

  return (
    <LoadingButton
      sx={{
        textTransform: "none",
        color: primary ? "white" : "#0073c8",
        borderColor: "#0073c8",
        fontFamily: "Rubik, Helvetica, sans-serif",
      }}
      variant="outlined"
      size="large"
      disabled={hasErrors}
      loading={(!hasErrors && !isExecutionContextReady) || loading}
      loadingPosition="start"
      startIcon={<RefreshIcon />}
      onClick={handleClick}
      data-testid={dataTestId}
      classes={{
        root: `qpp-c-button ${
          primary ? "qpp-c-button--cyan" : "qpp-c-button--outline"
        }`,
      }}
    >
      {label}
    </LoadingButton>
  );
}
