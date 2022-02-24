import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import { throttle } from "lodash";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@mui/material";

export interface timeoutPropTypes {
  timeLeft: number;
}

const TimeoutHandler = ({ timeLeft = 10000 }) => {
  const timeoutRef = useRef<any>(null);
  const [timingOut, setTimingOut] = useState<boolean>(false);

  const timeoutCallBack = () => {
    setTimingOut(true);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resetTimeout = useCallback(
    throttle(
      () => {
        setTimingOut(false);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(timeoutCallBack, timeLeft);
      },
      500,
      { leading: true }
    ),
    [timeLeft]
  );

  // initialize
  useLayoutEffect(() => {
    const rootNode = document.getElementById("main");
    timeoutRef.current = setTimeout(timeoutCallBack, timeLeft);
    rootNode.addEventListener("keypress", resetTimeout);
    rootNode.addEventListener("click", resetTimeout);
    rootNode.addEventListener("mousemove", resetTimeout);
    return () => {
      rootNode.removeEventListener("keypress", resetTimeout);
      rootNode.removeEventListener("click", resetTimeout);
      rootNode.removeEventListener("mouseMove", resetTimeout);
      clearTimeout(timeoutRef.current);
    };
  }, [resetTimeout, timeoutRef, timeLeft]);
  return (
    <Dialog
      open={timingOut}
      onKeyDown={resetTimeout}
      onMouseMove={resetTimeout}
      onClose={resetTimeout}
      aria-labelledby="warn-timeout-title"
      aria-describedby="warn-timeout-description"
    >
      {/* we want clicks inside to also trigger reset */}
      <div role="button" tabIndex={0} onClick={resetTimeout}>
        <DialogTitle id="warn-timeout-title">
          Session Expiration Warning
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="warn-timeout-description">
            Your session is about to expire due to an extended period of
            inactivity.
          </DialogContentText>
        </DialogContent>
      </div>
    </Dialog>
  );
};

export default TimeoutHandler;
