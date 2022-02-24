import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
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

  const resetTimeout = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setTimingOut(false);
    timeoutRef.current = setTimeout(timeoutCallBack, timeLeft);
  }, [timeLeft]);

  // initialize
  useLayoutEffect(() => {
    const rootNode = document.getElementById("main");
    timeoutRef.current = setTimeout(timeoutCallBack, timeLeft);
    rootNode.addEventListener("keypress", timeoutCallBack);
    rootNode.addEventListener("click", timeoutCallBack);
    return () => {
      rootNode.removeEventListener("keypress", timeoutCallBack);
      rootNode.removeEventListener("click", timeoutCallBack);
      clearTimeout(timeoutRef.current);
    };
  }, [resetTimeout, timeLeft, timeoutRef]);
  return (
    <Dialog
      open={timingOut}
      onKeyDown={resetTimeout}
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
